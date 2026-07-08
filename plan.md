# Plan: Dynamic Role & Permission + Multi-Brand Support

Dokumen ini adalah rencana pengembangan untuk mengubah backend Albana Clodi dari **single-brand, role tetap (ADMIN/SUPERADMIN hardcoded)** menjadi **multi-brand, role & permission dinamis**. Ditulis berdasarkan kondisi kode saat ini (lihat `README.md`) dan keputusan arsitektur yang sudah disepakati.

## Keputusan Arsitektur (Disepakati)

| Keputusan                         | Pilihan                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Isolasi data antar brand          | **Shared database, 1 skema, kolom `brandId`** di setiap tabel yang scoped-brand (bukan database/schema terpisah per brand)                                    |
| Penentuan brand aktif per request | **User memilih "brand aktif"** (mirip workspace switcher Slack/Notion) — brandId disematkan di sesi/JWT, bukan subdomain atau parameter wajib di tiap request |
| Role antar brand                  | **Role per (user, brand)** — satu akun bisa jadi Owner di Brand A dan Staff Gudang di Brand B                                                                 |

Implikasi dari ketiga keputusan ini membentuk seluruh desain di bawah.

## Prinsip Desain

1. **Jangan tambah kompleksitas di atas bug yang belum diperbaiki.** `authorizeRoles` saat ini tidak benar-benar memvalidasi role (lihat README poin Catatan #1) — ini harus diperbaiki **sebelum** dibangun ulang jadi sistem permission, bukan setelahnya.
2. **Backward-compatible secara bertahap.** Karena ini sudah live (ada data produksi, seeder, dsb), migrasi harus lewat proses backfill (satu brand default "Albana Clodi" dibuat otomatis), bukan big-bang rewrite.
3. **Permission adalah katalog global, Role adalah kombinasinya per brand.** Definisi permission (`product.create`, `order.cancel`, dst) sama di seluruh sistem dan dikelola developer/migrasi. Role (kumpulan permission) dibuat per brand, tapi di-seed dari template default (`Owner`, `Admin`, `Staff`) supaya brand baru langsung punya role siap pakai.
4. **Perlu level "platform" di atas brand.** Seseorang harus bisa membuat brand baru dan mengelola akses lintas-brand (misal tim internal Albana yang mengoperasikan sistem ini untuk banyak brand/klien). Ini terpisah dari Role/Permission per-brand — lihat bagian [Level Platform](#level-platform-di-atas-brand).

---

## 1. Perubahan Skema Database

### 1.1 Model baru: `Brand`

Menggantikan `ShopSetting` (yang saat ini singleton). `ShopSetting` di-_rename_/dilebur jadi `Brand` — field brandingnya tetap sama, ditambah `slug` dan `isActive`.

```prisma
model Brand {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  slug        String   @unique   // dipakai di URL/subdomain di masa depan, juga identifier yang human-readable
  description String?  @db.Text
  email       String?
  phoneNumber String?  @map("phone_number")
  address     String?  @db.Text
  owner       String?
  logo        String?
  banner      String?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  userBrandRoles UserBrandRole[]
  roles          Role[]
  products       Product[]
  categories     Category[]
  customers      Customer[]
  orders         Order[]
  // ...relasi ke semua tabel scoped-brand lainnya

  @@map("brands")
}
```

### 1.2 Model baru: `Permission` (katalog global, tidak scoped-brand)

```prisma
model Permission {
  id          String   @id @default(uuid()) @db.Uuid
  code        String   @unique   // format "<resource>.<action>", mis. "product.create"
  resource    String              // mis. "product" — untuk pengelompokan di UI
  action      String              // mis. "create", "read", "update", "delete", "export", "import"
  description String?
  createdAt   DateTime @default(now()) @map("created_at")

  rolePermissions RolePermission[]

  @@index([resource])
  @@map("permissions")
}
```

Contoh katalog awal (di-seed sekali, lihat bagian [Migrasi](#3-migrasi-data--backfill)):

```
product.create, product.read, product.update, product.delete, product.export, product.import
order.create, order.read, order.update, order.delete, order.cancel, order.export, order.import
customer.create, customer.read, customer.update, customer.delete, customer.export, customer.import
expense.create, expense.read, expense.update, expense.delete, expense.export, expense.import
category.create, category.read, category.update, category.delete
report.expenses.view, report.orders.view, report.products.view, report.transactions.view,
report.payments-transactions.view, report.products-sold.view
shop.manage            // pengaturan brand/profil toko
role.manage            // membuat/mengedit role & permission dalam brand
user.invite            // mengundang/menambahkan user ke brand
delivery-place.*, payment-method.*, sales-channel.*, shipping-cost.calculate, receipt.view
```

> Katalog ini adalah 1:1 mapping dari endpoint yang sudah ada (lihat tabel endpoint di `README.md`) — bukan permission baru yang belum kepakai. Menambah endpoint baru di masa depan = menambah 1 baris permission baru.

### 1.3 Model baru: `Role` (scoped per brand)

```prisma
model Role {
  id        String   @id @default(uuid()) @db.Uuid
  brandId   String   @map("brand_id") @db.Uuid
  name      String                       // mis. "Owner", "Admin", "Staff Gudang"
  isDefault Boolean  @default(false) @map("is_default") // role bawaan hasil seed, tidak bisa dihapus
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  brand           Brand            @relation(fields: [brandId], references: [id])
  rolePermissions RolePermission[]
  userBrandRoles  UserBrandRole[]

  @@unique([brandId, name])
  @@map("roles")
}

model RolePermission {
  roleId       String @map("role_id") @db.Uuid
  permissionId String @map("permission_id") @db.Uuid

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}
```

### 1.4 Model baru: `UserBrandRole` (jembatan user ↔ brand ↔ role)

```prisma
model UserBrandRole {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  brandId   String   @map("brand_id") @db.Uuid
  roleId    String   @map("role_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  brand Brand @relation(fields: [brandId], references: [id], onDelete: Cascade)
  role  Role  @relation(fields: [roleId], references: [id])

  @@unique([userId, brandId])   // satu user hanya punya 1 role aktif per brand
  @@map("user_brand_roles")
}
```

### 1.5 Perubahan model `User`

```prisma
model User {
  id             String          @id @default(uuid()) @db.Uuid
  fullname       String?
  email          String?         @unique
  password       String?
  phoneNumber    String?
  isPlatformAdmin Boolean        @default(false) @map("is_platform_admin") // lihat "Level Platform"
  createdAt      DateTime?       @map("created_at")

  userBrandRoles UserBrandRole[]

  @@index([email])
  @@map("users")
}
```

- **Kolom `role` (enum `Roles`) dihapus** setelah migrasi selesai (lihat fase migrasi — tidak langsung dihapus di hari pertama, ada masa transisi).
- Enum `Roles { ADMIN, SUPERADMIN }` di-_deprecate_, digantikan data di tabel `Role` (yang isinya per-brand, jadi bukan enum lagi).

### 1.6 Tabel yang perlu ditambah `brandId`

Semua tabel yang datanya milik satu brand spesifik. Berdasarkan model saat ini:

| Tabel                                                                      | Perlu`brandId`?                                                                       | Catatan                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `Product`, `Category`, `ProductVariant`, `ProductPrice`, `ProductDiscount` | ✅ (Product & Category langsung; variant/price/discount ikut lewat relasi ke Product) | `Category.name` unique jadi `@@unique([brandId, name])`       |
| `Customer`                                                                 | ✅                                                                                    |                                                               |
| `Order`, `OrderDetail`, `OrderProduct`, `ShippingService`, `Installment`   | ✅ (di`Order` saja; turunannya ikut lewat relasi)                                     |                                                               |
| `Expense`                                                                  | ✅                                                                                    |                                                               |
| `PaymentMethod`, `SalesChannel`, `DeliveryPlace`                           | ✅                                                                                    |                                                               |
| `Brand` (ex-`ShopSetting`)                                                 | — (dia sendiri representasi brand)                                                    |                                                               |
| `Province`, `City`, `District`, `Village`                                  | ❌ tetap**global**                                                                    | data referensi wilayah Indonesia, dipakai bersama semua brand |
| `User`                                                                     | ❌ tetap global (1 akun bisa lintas brand)                                            | relasi ke brand lewat`UserBrandRole`                          |
| `Permission`                                                               | ❌ tetap global                                                                       | katalog permission, bukan data operasional                    |

---

## 2. Perubahan Auth, Session, & Middleware

### 2.1 Alur login & pemilihan brand aktif

1. `POST /auth/login` — seperti sekarang (email+password), **tapi** response berubah: selain token dasar, sertakan **daftar brand yang bisa diakses user** (`userBrandRoles` beserta nama brand & nama role), supaya frontend bisa tampilkan pemilihan brand.
2. **Endpoint baru** `POST /auth/switch-brand` — body `{ brandId }`. Validasi bahwa user punya `UserBrandRole` untuk brand tsb, lalu terbitkan JWT baru yang membawa klaim `activeBrandId` dan `permissions` (daftar kode permission dari role user di brand itu, di-_embed_ di token supaya middleware tidak perlu query ulang tiap request).
3. Semua request setelah itu membawa token yang sudah punya `activeBrandId` — inilah yang dipakai middleware untuk resolve konteks brand, **bukan** header/param terpisah.
4. Token lama (tanpa `activeBrandId`) otomatis expired dalam 1 hari (mengikuti masa berlaku token saat ini) — tidak perlu migrasi paksa token yang sedang aktif.

> Alternatif yang lebih sederhana bila mau hemat 1 endpoint: satu langkah — `POST /auth/login` bisa langsung menerima `brandId` opsional di body. Jika user hanya punya 1 brand, langsung aktifkan brand itu tanpa perlu switch. Jika user punya >1 brand dan tidak mengirim `brandId`, kembalikan daftar brand tanpa token final (butuh 1 kali lagi hit login/switch dengan `brandId` terpilih).

### 2.2 Middleware baru

- **`resolveBrandContext`** — decode `activeBrandId` dari JWT, taruh di `req.brandId`. Dipasang setelah `authenticate`, sebelum route handler.
- **`authorizePermission(["product.create"])`** — pengganti `authorizeRoles`. Cek apakah `req.user.permissions` (dari token) memuat kode permission yang dibutuhkan. Ini **memperbaiki sekaligus** bug `authorizeRoles` yang lama (yang tidak pernah benar-benar mengecek array yang dikirim).
- **Prisma query scoping** — tambahkan `brandId: req.brandId` di semua query `findMany`/`findFirst`/`create`/`update`/`delete` pada model yang scoped-brand. Untuk mengurangi risiko lupa/lolos (data brand A bocor ke brand B), pertimbangkan **Prisma Client Extension** (`$extends`) yang otomatis menyisipkan filter `brandId` untuk model-model tsb berdasarkan `AsyncLocalStorage`/context per-request — dibahas lebih lanjut di [Risiko](#5-risiko--yang-harus-dijaga).

### 2.3 Route yang berubah cara guard-nya

Semua `app.use("/xxx", authenticate, authorizeRoles([...]))` di `src/server.ts` berubah jadi:

```ts
app.use("/products", authenticate, resolveBrandContext, productRouter);
// lalu di dalam productRouter, per-route:
productRouter.post("/", authorizePermission(["product.create"]), upload.array("images"), ..., productController.createProduct);
```

Guard dipindah ke **level route**, bukan level module, karena sekarang granularitasnya per-aksi (create/update/delete/export), bukan per-modul seperti role lama.

---

## 3. Migrasi Data & Backfill

Urutan migrasi (via Prisma migration + skrip data, bukan cuma `migrate dev`):

1. Buat tabel baru (`Brand`, `Permission`, `Role`, `RolePermission`, `UserBrandRole`) — tambah kolom `brandId` nullable dulu di semua tabel scoped-brand (supaya tidak mem-block data lama).
2. Seed 1 baris `Brand` default: `{ name: "Albana Clodi", slug: "albana-clodi" }` — merupakan brand hasil migrasi dari `ShopSetting` yang sudah ada (copy data logo/banner/dll ke sana bila ada).
3. Backfill: `UPDATE` semua baris di tabel scoped-brand (`products`, `categories`, `customers`, `orders`, `expenses`, dst) supaya `brandId` = id brand default tadi.
4. Ubah kolom `brandId` jadi `NOT NULL` setelah backfill selesai.
5. Seed katalog `Permission` (daftar lengkap, lihat 1.2).
6. Seed 3 `Role` default untuk brand default: **Owner** (semua permission), **Admin** (semua kecuali `role.manage`, `shop.manage`, `report.orders.view`, `report.transactions.view` — mengikuti pemisahan ADMIN/SUPERADMIN yang lama), **Staff** (permission dasar read + create order/customer, tanpa delete/export/manage).
7. Migrasi user existing: user dengan `role = SUPERADMIN` di-assign `UserBrandRole` ke Role **Owner** brand default; user dengan `role = ADMIN` di-assign ke Role **Admin** brand default.
8. Setelah semua service/route dipindah pakai `permissions` bukan `role`, baru hapus kolom `role` dari `User` dan enum `Roles` dari schema (fase pembersihan, bukan di awal).

> Update juga `prisma/seeders/userSeeder.ts` dan seeder lain (`productSeeder`, `orderSeeder`) supaya menyertakan `brandId` brand default — kalau tidak, `pnpm seed` akan gagal begitu kolom jadi `NOT NULL`.

---

## 4. Level Platform (di atas Brand)

Karena sistem ini akan dipakai beberapa brand sekaligus, perlu ada pihak yang bisa **membuat brand baru** dan **mengelola akses lintas-brand** (misal tim internal Albana yang mengoperasikan backend ini untuk beberapa brand/klien). Ini **bukan** bagian dari Role/Permission per-brand di atas — melainkan level di atasnya.

- Ditandai lewat `User.isPlatformAdmin: Boolean` (lihat 1.5) — sengaja dibuat sederhana (flag), **bukan** sistem permission granular lagi, supaya tidak overengineering di level yang jarang dipakai (biasanya hanya tim internal).
- Endpoint baru yang hanya bisa diakses `isPlatformAdmin`:
  - `POST /platform/brands` — membuat brand baru (otomatis membuatkan 3 role default: Owner/Admin/Staff).
  - `GET /platform/brands` — list semua brand (untuk kebutuhan monitoring/billing internal).
  - `POST /platform/brands/:id/users` — menambahkan user pertama (Owner) ke brand baru.
- Middleware terpisah: `requirePlatformAdmin` (cek `req.user.isPlatformAdmin === true`), tidak tercampur dengan `authorizePermission`.

---

## 5. Risiko & Yang Harus Dijaga

1. **Kebocoran data lintas brand adalah risiko terbesar.** Satu query yang lupa filter `brandId` = data brand lain bocor. Mitigasi: prioritaskan Prisma Client Extension untuk auto-scoping (lihat 2.2) dibanding mengandalkan disiplin menambahkan `where: { brandId }` manual di puluhan file service.
2. **`authorizeRoles` yang buggy harus diperbaiki lebih dulu** (lihat README Catatan #1) sebagai bagian dari Fase 1, sebelum dibangun ulang jadi `authorizePermission` — supaya bug yang sama tidak terbawa ke sistem baru.
3. **Unique constraint global perlu diubah jadi scoped-brand** — `Category.name` saat ini `@@unique` global; kalau tidak diubah jadi `@@unique([brandId, name])`, dua brand tidak akan bisa punya kategori dengan nama sama (mis. dua-duanya punya kategori "Baju Anak").
4. **Token yang membawa daftar `permissions`** perlu strategi invalidasi — kalau admin brand mengubah permission suatu role, user yang sudah login dengan token lama tetap pakai permission lama sampai token expired (maks. 1 hari) atau re-login/switch-brand. Ini trade-off yang dapat diterima untuk sistem seukuran ini (dibanding query DB tiap request), tapi perlu didokumentasikan sebagai known behavior.
5. **Seluruh export/import Excel dan laporan (`report/*`) harus ikut di-scope per brand** — jangan sampai fitur export/laporan yang sudah ada malah jadi celah untuk lihat data brand lain kalau lupa di-filter.
6. **Testing.** Saat ini tidak ada test sama sekali (lihat README Catatan #7). Perubahan sebesar ini (menyentuh hampir semua modul) sebaiknya mulai disertai minimal test integrasi untuk skenario "brand A tidak bisa lihat data brand B" dan "role tanpa permission X ditolak" — ini yang paling gampang lolos tanpa disadari kalau hanya dites manual.

---

## 6. Rencana Bertahap (Fase Pengerjaan)

Disusun supaya tiap fase tetap menghasilkan sistem yang jalan (tidak ada periode "setengah migrasi" yang lama).

**Fase 0 — Perbaikan fondasi (prasyarat, low-risk)**

- Perbaiki bug `authorizeRoles` (buat sistem role lama benar-benar strict dulu).
- Tambah minimal test untuk auth & authorization (supaya ada baseline sebelum refactor besar).

**Fase 1 — Brand sebagai entitas (backend saja, belum multi-brand secara fungsional)**

- Migrasi schema: tambah `Brand`, kolom `brandId` nullable di semua tabel terkait.
- Backfill 1 brand default dari `ShopSetting` existing, isi `brandId` semua data lama.
- Ubah `brandId` jadi `NOT NULL`. Sistem tetap berjalan seperti biasa (masih 1 brand, tapi sudah "brand-aware").

**Fase 2 — Role & Permission dinamis (masih 1 brand)**

- Migrasi schema: `Permission`, `Role`, `RolePermission`, `UserBrandRole`.
- Seed katalog permission + 3 role default, migrasi user existing ke role baru.
- Ganti `authorizeRoles` → `authorizePermission` di semua router.
- Bangun endpoint manajemen role (`/roles`, `/roles/:id/permissions`) untuk brand yang sudah ada.

**Fase 3 — Multi-brand secara fungsional**

- Endpoint login/switch-brand + `resolveBrandContext` middleware.
- Prisma auto-scoping (extension) untuk semua model brand-scoped.
- Endpoint level-platform untuk membuat brand baru (`isPlatformAdmin`).
- Uji end-to-end: buat brand kedua, pastikan data & user brand pertama tidak "bocor".

**Fase 4 — Pengerasan & pembersihan**

- Hapus kolom `role`/enum `Roles` lama dari `User` setelah dipastikan tidak dipakai lagi.
- Audit log perubahan role/permission (siapa mengubah apa, kapan) — opsional tapi berguna untuk sistem multi-brand yang makin banyak penggunanya.
- Review ulang seluruh endpoint export/laporan untuk memastikan scoping brand benar (lihat Risiko #5).

---

## 7. Pertanyaan Terbuka (Bisa Ditunda, Perlu Diputuskan Sebelum/Selama Implementasi)

- Apakah `Product`/`Customer`/dll **boleh dibagi antar brand** dalam kasus tertentu (mis. 1 gudang fisik dipakai 2 brand)? Desain saat ini mengasumsikan **tidak** — setiap baris data milik tepat 1 brand. Kalau ternyata ada kebutuhan berbagi data, ini butuh desain tambahan (mis. tabel `shared_warehouse` terpisah dari brand-scoped tables).
- Apakah nama role & daftar permission-nya boleh **diedit bebas per brand** (Owner brand A bisa bikin role "Kasir" dengan kombinasi permission sesuka hati), atau dibatasi ke beberapa role template saja? Rencana di atas mengasumsikan bebas (custom role per brand), karena tabel `Role`+`RolePermission` sudah mendukung itu secara alami.
- Billing/kuota per brand (mis. batas jumlah user atau brand) belum masuk cakupan rencana ini — bisa jadi topik terpisah bila platform ini nantinya dikomersialkan ke banyak klien eksternal.
