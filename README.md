# Albana Clodi Backend

Backend REST API untuk sistem manajemen toko/reseller pakaian **Albana Clodi** — mencakup manajemen produk (dengan varian, harga bertingkat, dan diskon), pesanan (order), pelanggan, pengeluaran (expenses), metode pembayaran, ongkos kirim (integrasi RajaOngkir), hingga laporan penjualan.

Dibangun di atas **Express 5 + TypeScript + Prisma (PostgreSQL)**, mengikuti struktur ala [express-typescript-boilerplate](https://github.com/edwinhern/express-typescript-2024) (per‑modul: router → controller → service → model/schema).

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Autentikasi & Hak Akses (Role)](#autentikasi--hak-akses-role)
- [Fitur & Endpoint per Modul](#fitur--endpoint-per-modul)
- [Model Data (Ringkasan)](#model-data-ringkasan)
- [Environment Variables](#environment-variables)
- [Instalasi & Menjalankan Secara Lokal](#instalasi--menjalankan-secara-lokal)
- [Database: Migrasi & Seeder](#database-migrasi--seeder)
- [Dokumentasi API (Swagger)](#dokumentasi-api-swagger)
- [Deployment & CI/CD](#deployment--cicd)
- [Catatan & Isu yang Perlu Diperhatikan (untuk pengembangan lanjutan)](#catatan--isu-yang-perlu-diperhatikan-untuk-pengembangan-lanjutan)

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Runtime & bahasa | Node.js 20/23, TypeScript |
| Web framework | Express 5 |
| ORM & database | Prisma 6 + PostgreSQL |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` untuk hashing password |
| Validasi | Zod (+ `@asteasolutions/zod-to-openapi` untuk generate dokumentasi) |
| Dokumentasi API | Swagger UI (`swagger-ui-express`) di `/api-docs` |
| Upload file | `multer` (in-memory storage) |
| Storage cloud | AWS S3 (via Heroku CloudCube) — **lihat catatan, saat ini dinonaktifkan sebagian** |
| Export/Import data | `xlsx` (Excel) |
| Integrasi eksternal | RajaOngkir (ongkos kirim & data wilayah) |
| Logging | `pino` / `pino-http` |
| Lint & format | Biome |
| Build tool | `tsup`, `tsx` |
| Package manager | pnpm |
| Deployment | Docker (GHCR), Heroku, Vercel (config tersedia untuk ketiganya) |

## Struktur Folder

```
src/
├── api/                     # 1 folder = 1 modul/domain bisnis
│   ├── auth/                # register, login, profil
│   ├── category/            # kategori produk
│   ├── customer/            # pelanggan
│   ├── delivery-place/      # gudang/titik pengiriman
│   ├── expenses/            # pengeluaran toko
│   ├── healthCheck/         # health check endpoint
│   ├── location/            # (tidak terpakai, lihat catatan)
│   ├── order/                # pesanan (modul paling kompleks)
│   ├── payment-method/       # metode pembayaran
│   ├── product/               # produk
│   ├── product-discount/      # skema diskon produk (nested, bukan router terpisah)
│   ├── product-price/         # skema harga per kategori pelanggan (nested)
│   ├── product-variant/       # skema varian produk (nested)
│   ├── receipt/                # struk/invoice pesanan
│   ├── region/                  # data wilayah Indonesia (provinsi‑kota‑kecamatan‑desa)
│   ├── report/                   # laporan (order, expenses, produk, transaksi)
│   ├── sales-channel/             # kanal penjualan (marketplace, offline, dll)
│   ├── shipping-cost/              # kalkulasi ongkir (RajaOngkir)
│   └── shop/                        # profil/branding toko (singleton)
├── api-docs/                # generator dokumentasi OpenAPI/Swagger
├── common/
│   ├── enums/                # enum bersama (role, status, tipe produk, dll)
│   ├── libs/                  # integrasi pihak ketiga (mis. AWS S3)
│   ├── middleware/             # authenticate, authorizeRoles, error handler, rate limiter, dll
│   ├── models/                  # response wrapper standar (ServiceResponse)
│   ├── types/                    # tipe TypeScript bersama (AuthRequest, dll)
│   └── utils/                     # helper (env config, export/import excel, dll)
├── config/                   # koneksi Prisma client
├── server.ts                 # setup Express app & mounting semua router
└── index.ts                  # entry point (start server)

prisma/
├── schema.prisma            # skema database
├── migrations/               # riwayat migrasi
└── seeders/                   # skrip seeding data awal (user, region, produk, order)
```

Setiap modul di `src/api/<nama-modul>/` umumnya berisi: `router.ts` (routing + dokumentasi OpenAPI), `controller.ts`, `service.ts` (logika bisnis & akses Prisma), `model.ts`/`schema.ts` (skema Zod untuk validasi request & tipe data).

## Autentikasi & Hak Akses (Role)

Autentikasi menggunakan **JWT Bearer Token**. Ada 2 role yang tersedia di enum `Roles` (Prisma):

| Role | Deskripsi |
|---|---|
| `ADMIN` | Operasional harian: kelola produk, pesanan, pelanggan, pembayaran, dll. |
| `SUPERADMIN` | Semua akses `ADMIN`, ditambah akses ke modul sensitif: pengaturan toko, kategori produk, dan sebagian laporan (order & transaksi). |

**Endpoint auth (`/auth`)**

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | Publik | Registrasi user baru. **Role hasil registrasi selalu di-hardcode menjadi `ADMIN`** di service, apa pun nilai `role` yang dikirim client (lihat [Catatan](#catatan--isu-yang-perlu-diperhatikan-untuk-pengembangan-lanjutan)). |
| POST | `/auth/login` | Publik | Login, mengembalikan JWT (masa berlaku 1 hari) + data user. |
| GET | `/auth/current` | ADMIN, SUPERADMIN | Ambil profil user yang sedang login. |
| PATCH | `/auth/me` | ADMIN, SUPERADMIN | Update profil sendiri (nama, email, no. telepon, ganti password dengan konfirmasi). |

Tidak ada fitur **refresh token**, **forgot/reset password**, **email verification**, atau **logout** (client cukup membuang token). Token berlaku 1 hari lalu user harus login ulang.

**Hak akses per modul (route‑level, diterapkan di `src/server.ts`)**

| Modul (base path) | ADMIN | SUPERADMIN |
|---|:---:|:---:|
| `/expenses` | ✅ | ✅ |
| `/products` | ✅ | ✅ |
| `/delivery-places` | ✅ | ✅ |
| `/orders` | ✅ | ✅ |
| `/regions` | ✅ | ✅ |
| `/customers` | ✅ | ✅ |
| `/payment-methods` | ✅ | ✅ |
| `/sales-channels` | ✅ | ✅ |
| `/shipping-cost` | ✅ | ✅ |
| `/receipts` | ✅ | ✅ |
| `/reports` (umumnya) | ✅ | ✅ |
| `/reports/orders`, `/reports/transactions` | ❌ | ✅ saja |
| `/shop` (pengaturan toko) | ❌ | ✅ saja |
| `/categories` | ❌ | ✅ saja |
| `/health-check`, `/auth/register`, `/auth/login` | Publik (tanpa login) | Publik (tanpa login) |

> ⚠️ **Catatan penting:** middleware `authorizeRoles()` (`src/common/middleware/authorizeRoles.ts`) saat ini **tidak benar‑benar memvalidasi daftar role yang diizinkan** — ia hanya memeriksa bahwa user terautentikasi memiliki *role apapun*. Artinya secara kode saat ini, tabel akses di atas adalah **intent/desain**, bukan perilaku aktual: seorang `ADMIN` bisa saja lolos ke endpoint yang seharusnya `SUPERADMIN`-only. Ini adalah prioritas utama untuk diperbaiki sebelum bergantung pada pemisahan role ini secara ketat. Lihat detail di bagian Catatan di bawah.

## Fitur & Endpoint per Modul

Semua endpoint di bawah (kecuali auth & health-check) memerlukan header `Authorization: Bearer <token>`.

### Produk — `/products`
- `GET /products` — list produk (pagination `page`/`limit`, filter kategori/tipe/status publish, dll)
- `GET /products/:id` — detail produk (beserta varian, harga, diskon)
- `POST /products` — buat produk baru (multipart form‑data, upload banyak gambar via field `images`, mendukung nested data varian/harga/diskon)
- `PUT /products/:id` — update produk (upload gambar, validasi stok otomatis)
- `DELETE /products/:id` — hapus produk (hard delete)
- `POST /products/export/excel` — export data produk ke Excel
- `POST /products/import/excel` — import produk dari file Excel

Sub‑konsep produk (tidak punya endpoint sendiri, selalu nested di payload create/update produk):
- **Varian** (`product-variant`): SKU, ukuran, warna, stok, gambar, barcode.
- **Harga** (`product-price`): harga bertingkat per kategori pelanggan — `normal`, `buy` (beli), `reseller`, `agent`, `member`.
- **Diskon** (`product-discount`): tipe `PERCENTAGE` atau `NOMINAL`, dengan rentang tanggal aktif.

### Kategori Produk — `/categories` (khusus SUPERADMIN)
CRUD standar: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`.

### Pelanggan (Customer) — `/customers`
- `GET /customers` — list (pagination, filter kategori: `CUSTOMER`/`RESELLER`/`DROPSHIPPER`/`MEMBER`/`AGENT`, status `ACTIVE`/`NONACTIVE`)
- `GET /customers/:id`, `POST /customers`, `PUT /customers/:id`, `DELETE /customers/:id`
- `POST /customers/export/excel`, `POST /customers/import/excel`

### Pesanan (Order) — `/orders` (modul paling kompleks)
- `GET /orders` — list dengan filter sangat lengkap: pelanggan pemesan/tujuan, kanal penjualan, tempat pengiriman, rentang tanggal/bulan/tahun, status pembayaran, produk, metode pembayaran, pencarian bebas (nama/kode/no. resi/no. telepon), sorting, serta dukungan pagination biasa maupun cursor‑based.
- `GET /orders/:id` — detail pesanan lengkap
- `POST /orders` — buat pesanan baru (order, detail harga, biaya lain: asuransi/packing/berat, diskon per produk, ongkir, cicilan/installment, daftar produk, layanan pengiriman)
- `PUT /orders/:id` — update pesanan
- `DELETE /orders/:id` — hapus pesanan (hard delete)
- `PATCH /orders/:id/cancel` — batalkan pesanan
- `GET /orders/export/excel`, `POST /orders/import/excel`

Mendukung status pembayaran: `SETTLEMENT`, `PENDING`, `CANCEL`, `INSTALLMENTS` (cicilan).

### Struk/Invoice — `/receipts`
- `GET /receipts/:orderId` — generate data struk lengkap untuk satu pesanan (harga sesuai kategori pelanggan, diskon, cicilan, ongkir, biaya tambahan, info dropship otomatis untuk kategori `DROPSHIPPER`/`AGENT`/`RESELLER`). Endpoint ini murni membaca & menghitung data, tidak menyimpan apa pun.

### Pengeluaran (Expenses) — `/expenses`
- `GET /expenses` — list dengan filter tanggal/bulan/tahun/minggu + kata kunci (nama barang/penanggung jawab)
- `GET /expenses/:id`, `POST /expenses`, `PUT /expenses/:id`, `DELETE /expenses/:id`
- `GET /expenses/export/excel`, `POST /expenses/import/excel`

### Tempat Pengiriman (Delivery Place) — `/delivery-places`
CRUD standar untuk gudang/titik pengiriman (nama, alamat, kecamatan, kontak, `destinationId` untuk integrasi ongkir).

### Metode Pembayaran — `/payment-methods`
CRUD standar (nama, bank, cabang, no. rekening).

### Kanal Penjualan (Sales Channel) — `/sales-channels`
CRUD standar untuk kanal penjualan (mis. Shopee, Tokopedia, Offline), dengan flag `isActive`.

### Ongkos Kirim — `/shipping-cost` (integrasi RajaOngkir)
- `GET /shipping-cost/calculate` — hitung ongkir berdasarkan asal/tujuan (`destination_id`), berat, nilai barang, opsi COD. Mengembalikan 3 tingkatan layanan: reguler, cargo, instant — lengkap dengan biaya, cashback, net income, dan estimasi waktu tiba (ETD).

### Wilayah (Region) — `/regions`
Hierarki wilayah administratif Indonesia untuk keperluan alamat/pengiriman:
- `GET /regions/provinces`
- `GET /regions/cities/:id` (berdasarkan provinsi)
- `GET /regions/districts/:id` (berdasarkan kota)
- `GET /regions/villages/:id` (berdasarkan kecamatan)

Data awal berasal dari file JSON di `public/data/` yang di-seed ke database (lihat `prisma/seeders/regionSeeder.ts`).

### Laporan (Report) — `/reports`
Semua laporan menerima filter tanggal/bulan/tahun/minggu yang sama:

| Endpoint | Akses | Isi laporan |
|---|---|---|
| `GET /reports/expenses` | ADMIN, SUPERADMIN | Laporan pengeluaran |
| `GET /reports/orders` | **SUPERADMIN saja** | Laporan pesanan |
| `GET /reports/products` | ADMIN, SUPERADMIN | Laporan produk (berbasis harga) |
| `GET /reports/transactions` | **SUPERADMIN saja** | Laporan transaksi |
| `GET /reports/payments-transactions` | ADMIN, SUPERADMIN | Laporan pembayaran/transaksi |
| `GET /reports/products-sold` | ADMIN, SUPERADMIN | Laporan produk terjual |

### Pengaturan Toko (Shop Setting) — `/shop` (khusus SUPERADMIN)
Resource singleton untuk profil toko: nama, deskripsi, email, telepon, alamat, pemilik, logo, dan banner (upload gambar via `multer`).
- `POST /shop` — buat pengaturan toko
- `GET /shop` — ambil pengaturan toko saat ini
- `PATCH /shop` — update sebagian (termasuk ganti logo/banner)

### Health Check — `/health-check` (publik)
`GET /health-check` — pengecekan sederhana apakah service hidup. Berguna untuk load balancer/monitoring.

## Model Data (Ringkasan)

Model utama pada `prisma/schema.prisma` (PostgreSQL):

- **User** — akun login (`ADMIN`/`SUPERADMIN`)
- **Product**, **ProductVariant**, **ProductPrice**, **ProductDiscount**, **Category**
- **Customer** (dengan kategori CUSTOMER/RESELLER/DROPSHIPPER/MEMBER/AGENT)
- **Order**, **OrderDetail**, **OrderProduct**, **ShippingService**, **Installment**
- **PaymentMethod**, **DeliveryPlace**, **SalesChannel**, **Expense**, **ShopSetting**
- **Province → City → District → Village** (data wilayah Indonesia)

Sebagian besar tabel memakai UUID sebagai primary key, `createdAt`/`updatedAt` otomatis, dan sudah memiliki index pada kolom yang sering dipakai untuk filter/pencarian. **Tidak ada mekanisme soft delete** — semua operasi hapus bersifat permanen (hard delete).

## Environment Variables

Salin `.env.template` menjadi `.env` lalu isi:

| Variabel | Keterangan |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT`, `HOST` | Port & host server |
| `CORS_ORIGIN` | Origin yang diizinkan CORS |
| `COMMON_RATE_LIMIT_WINDOW_MS`, `COMMON_RATE_LIMIT_MAX_REQUESTS` | Konfigurasi rate limiter (saat ini middleware rate limiter **dinonaktifkan** di `src/server.ts`) |
| `DATABASE_POOL_URL` | Connection string PostgreSQL. **Perhatikan:** Prisma (`schema.prisma`) & `envConfig.ts` membaca nama variabel `DATABASE_POOL_URL`, bukan `DATABASE_URL` seperti yang tertulis di `.env.template` — sesuaikan nama variabel di `.env` Anda. |
| `RAJAONGKIR_SHIPPING_COST_API_KEY`, `RAJAONGKIR_SHIPPING_DELIVERY_API_KEY`, `RAJAONGKIR_BASE_URL` | Kredensial & base URL API RajaOngkir (dipakai modul `region`/`location` dan `shipping-cost`) |
| `JWT_SECRET` | Secret untuk sign/verify JWT. Wajib diisi nilai yang kuat (kode punya fallback `"secret"` jika kosong — jangan andalkan fallback ini di production) |
| `CLOUDCUBE_BUCKET`, `CLOUDCUBE_URL`, `CLOUDCUBE_REGION`, `CLOUDCUBE_ACCESS_KEY`, `CLOUDCUBE_SECRET_KEY` | Kredensial AWS S3 (via add-on Heroku CloudCube) untuk upload gambar produk/logo toko |

## Instalasi & Menjalankan Secara Lokal

Prasyarat: Node.js 20+ (project dikembangkan dengan Node 23), pnpm 10, PostgreSQL.

```bash
# instal dependensi
pnpm install

# siapkan environment variable
cp .env.template .env   # lalu isi sesuai kebutuhan (lihat tabel di atas)

# jalankan migrasi database
pnpm prisma migrate dev

# (opsional) isi data awal
pnpm seed

# jalankan mode development (hot reload)
pnpm start:dev
```

Script `npm`/`pnpm` yang tersedia (`package.json`):

| Script | Fungsi |
|---|---|
| `start:dev` | Jalankan server mode development dengan watch/hot-reload |
| `build` | Generate Prisma client → compile TypeScript → bundle dengan `tsup` |
| `start:prod` / `start` | Jalankan hasil build (`dist/index.js`) |
| `lint` | Lint & auto-fix dengan Biome |
| `format` | Format kode dengan Biome |
| `check` | Jalankan lint + format + build + test secara berurutan |
| `seed` | Jalankan seluruh seeder (`prisma/seeders/main.ts`) |

## Database: Migrasi & Seeder

Seeder (`pnpm seed`) menjalankan berurutan:
1. `UserSeeder` — **menghapus semua user lalu membuat ulang** 1 akun `SUPERADMIN` dan 10 akun `ADMIN` default (kredensial ada di `prisma/seeders/userSeeder.ts` — **wajib diganti setelah setup awal**, jangan pernah dipakai di production tanpa diganti).
2. `RegionSeeder` — mengisi data provinsi/kota/kecamatan/desa dari `public/data/*.json`.
3. `OrderSeeder` — data contoh pesanan.
4. `ProductsSeeder` — data contoh produk.

> ⚠️ Karena `UserSeeder` melakukan `deleteMany({})` pada tabel user, **jangan jalankan `pnpm seed` di database production** yang sudah punya data user asli tanpa memahami konsekuensinya.

## Dokumentasi API (Swagger)

Dokumentasi interaktif (OpenAPI) tersedia otomatis di:

```
GET /api-docs           # Swagger UI
GET /api-docs/swagger.json  # raw OpenAPI JSON
```

Dokumentasi ini digenerate langsung dari skema Zod tiap modul (`*Registry.registerPath(...)` di masing-masing router), jadi menambah endpoint baru sebaiknya sekaligus mendaftarkan path-nya di registry OpenAPI modul terkait agar dokumentasi tetap sinkron.

## Deployment & CI/CD

- **Docker** — `Dockerfile` multi-stage (pnpm) build image production, di-build & push ke GitHub Container Registry (`ghcr.io`) lewat `.github/workflows/ci.yml` pada setiap push/PR ke `master`.
- **Heroku** — `.github/workflows/cd.yml` men-deploy ke Heroku (app `albana-clodi-backend`) otomatis setiap kali sebuah tag `v*` di-push. `Procfile` mendefinisikan proses `web: npm run build && npm start`.
- **Vercel** — `vercel.json` tersedia sebagai alternatif deployment (build `src/index.ts` via `@vercel/node`).

Checklist rilis manual (kebiasaan tim sebelumnya, tetap relevan bila deploy tidak lewat tag/CD):
1. Pastikan `DATABASE_POOL_URL` di environment target sudah benar.
2. Jalankan seeding database bila diperlukan (data wilayah/produk awal).
3. Merge branch kerja ke `dev` (lalu ke `master`/tag untuk rilis produksi).
4. Re-deploy service.

## Catatan & Isu yang Perlu Diperhatikan (untuk pengembangan lanjutan)

Bagian ini dikumpulkan dari pembacaan kode saat ini, supaya pengembang berikutnya tidak perlu menemukan ulang hal-hal ini:

1. **`authorizeRoles` tidak memfilter role secara nyata** (`src/common/middleware/authorizeRoles.ts`) — parameter `allowedRoles` diterima tapi tidak pernah dibandingkan dengan role user. Efeknya, pembatasan "SUPERADMIN saja" pada `/categories`, `/shop`, `/reports/orders`, `/reports/transactions` **saat ini tidak benar-benar ditegakkan** selama user punya role apa pun (termasuk `ADMIN`). Ini prioritas keamanan yang perlu diperbaiki sebelum production sebenarnya bergantung pada pemisahan hak akses ini.
2. **`POST /auth/register` bersifat publik** (tanpa autentikasi) dan **selalu membuat user dengan role `ADMIN`**, mengabaikan field `role` yang dikirim client. Perlu didiskusikan apakah endpoint ini memang dimaksud publik (self-service registration) — jika tidak, sebaiknya dipindah ke belakang autentikasi `SUPERADMIN`.
3. **Upload gambar ke AWS S3 saat ini dinonaktifkan** (kode di-comment) di `src/api/product/productService.ts` — file gambar produk diterima lewat `multer` tapi tidak benar-benar diunggah ke storage manapun; URL barcode produk juga di-hardcode ke satu gambar placeholder statis, bukan hasil generate asli (`generateBarcode`). Fitur ini perlu diselesaikan/diaktifkan kembali sebelum upload gambar produk dianggap berfungsi.
4. **Modul `location` (`src/api/location`) adalah kode mati** — didefinisikan tapi tidak pernah di-mount di `src/server.ts`. Fungsinya (lookup provinsi/kota dari RajaOngkir) sudah digantikan oleh modul `region`. Sebaiknya dihapus atau didokumentasikan alasan dipertahankan.
5. **Tidak ada mekanisme soft delete** di modul manapun — semua delete adalah hard delete langsung ke database. Pertimbangkan menambah `deletedAt` bila riwayat data (mis. produk/pesanan yang terhapus) penting untuk audit.
6. **Kredensial database ter-hardcode**: `src/common/utils/envConfig.ts` memiliki *default value* berupa connection string PostgreSQL asli (bukan placeholder) untuk `DATABASE_POOL_URL` — akan terpakai diam-diam bila env var tidak diset. File `.env.heroku` juga masih ter-*track* di git (walau sudah masuk daftar `.gitignore`) dan berisi kredensial serupa. **Rekomendasi: rotasi kredensial database tersebut, hapus default hardcoded di kode, dan bersihkan `.env.heroku` dari riwayat git.**
7. **CI (`ci.yml`) berpotensi gagal**: job `test` menjalankan `npm test`, padahal `package.json` tidak punya script `test` dan tidak ada file test (`*.test.ts`/`*.spec.ts`) di project sama sekali; job `build` menjalankan `npm build` (bukan `npm run build`), yang bukan perintah npm yang valid.
8. **Duplikasi skema validasi**: router `sales-channel` memakai ulang skema Zod milik `customer` (`UpdateCustomerRequestSchema`/`DeleteCustomerRequestSchema`) untuk validasi `PUT`/`DELETE` — kemungkinan besar hasil copy-paste, sebaiknya dibuat skema khusus agar pesan error & validasi sesuai konteks sales channel.
9. **Rate limiter & Helmet dinonaktifkan** — baris `app.use(helmet())` dan `app.use(rateLimiter)` di `src/server.ts` di-comment. Pertimbangkan mengaktifkannya kembali untuk hardening keamanan dasar sebelum production.
