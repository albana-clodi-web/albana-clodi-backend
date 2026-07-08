import { PrismaClient, Roles } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_BRAND_SLUG = "albana-clodi";

const permissions = [
	["auth.me", "auth", "me", "Melihat profil user yang sedang login"],
	["auth.update-profile", "auth", "update-profile", "Mengubah profil user yang sedang login"],
	["product.create", "product", "create", "Membuat produk"],
	["product.read", "product", "read", "Melihat produk"],
	["product.update", "product", "update", "Mengubah produk"],
	["product.delete", "product", "delete", "Menghapus produk"],
	["product.export", "product", "export", "Export produk"],
	["product.import", "product", "import", "Import produk"],
	["category.create", "category", "create", "Membuat kategori"],
	["category.read", "category", "read", "Melihat kategori"],
	["category.update", "category", "update", "Mengubah kategori"],
	["category.delete", "category", "delete", "Menghapus kategori"],
	["customer.create", "customer", "create", "Membuat customer"],
	["customer.read", "customer", "read", "Melihat customer"],
	["customer.update", "customer", "update", "Mengubah customer"],
	["customer.delete", "customer", "delete", "Menghapus customer"],
	["customer.export", "customer", "export", "Export customer"],
	["customer.import", "customer", "import", "Import customer"],
	["order.create", "order", "create", "Membuat order"],
	["order.read", "order", "read", "Melihat order"],
	["order.update", "order", "update", "Mengubah order"],
	["order.delete", "order", "delete", "Menghapus order"],
	["order.cancel", "order", "cancel", "Membatalkan order"],
	["order.export", "order", "export", "Export order"],
	["order.import", "order", "import", "Import order"],
	["expense.create", "expense", "create", "Membuat expense"],
	["expense.read", "expense", "read", "Melihat expense"],
	["expense.update", "expense", "update", "Mengubah expense"],
	["expense.delete", "expense", "delete", "Menghapus expense"],
	["expense.export", "expense", "export", "Export expense"],
	["expense.import", "expense", "import", "Import expense"],
	["delivery-place.create", "delivery-place", "create", "Membuat tempat pengiriman"],
	["delivery-place.read", "delivery-place", "read", "Melihat tempat pengiriman"],
	["delivery-place.update", "delivery-place", "update", "Mengubah tempat pengiriman"],
	["delivery-place.delete", "delivery-place", "delete", "Menghapus tempat pengiriman"],
	["payment-method.create", "payment-method", "create", "Membuat metode pembayaran"],
	["payment-method.read", "payment-method", "read", "Melihat metode pembayaran"],
	["payment-method.update", "payment-method", "update", "Mengubah metode pembayaran"],
	["payment-method.delete", "payment-method", "delete", "Menghapus metode pembayaran"],
	["sales-channel.create", "sales-channel", "create", "Membuat channel penjualan"],
	["sales-channel.read", "sales-channel", "read", "Melihat channel penjualan"],
	["sales-channel.update", "sales-channel", "update", "Mengubah channel penjualan"],
	["sales-channel.delete", "sales-channel", "delete", "Menghapus channel penjualan"],
	["region.read", "region", "read", "Melihat data wilayah"],
	["shipping-cost.calculate", "shipping-cost", "calculate", "Menghitung ongkos kirim"],
	["receipt.view", "receipt", "view", "Melihat receipt"],
	["shop.manage", "shop", "manage", "Mengelola profil brand/toko"],
	["role.manage", "role", "manage", "Mengelola role dan permission"],
	["user.invite", "user", "invite", "Menambahkan user ke brand"],
	["report.expenses.view", "report.expenses", "view", "Melihat laporan expense"],
	["report.orders.view", "report.orders", "view", "Melihat laporan order"],
	["report.products.view", "report.products", "view", "Melihat laporan produk"],
	["report.transactions.view", "report.transactions", "view", "Melihat laporan transaksi"],
	[
		"report.payments-transactions.view",
		"report.payments-transactions",
		"view",
		"Melihat laporan transaksi pembayaran",
	],
	["report.products-sold.view", "report.products-sold", "view", "Melihat laporan produk terjual"],
] as const;

const adminExcludedPermissions = new Set([
	"category.create",
	"category.read",
	"category.update",
	"category.delete",
	"role.manage",
	"shop.manage",
	"user.invite",
	"report.orders.view",
	"report.transactions.view",
]);

const staffPermissionCodes = new Set([
	"auth.me",
	"auth.update-profile",
	"product.read",
	"category.read",
	"customer.create",
	"customer.read",
	"customer.update",
	"order.create",
	"order.read",
	"order.update",
	"delivery-place.read",
	"payment-method.read",
	"sales-channel.read",
	"region.read",
	"shipping-cost.calculate",
	"receipt.view",
]);

async function ensureDefaultBrand() {
	const shopSetting = await prisma.shopSetting.findFirst();

	return prisma.brand.upsert({
		where: { slug: DEFAULT_BRAND_SLUG },
		update: {
			name: shopSetting?.name || "Albana Clodi",
			description: shopSetting?.description,
			email: shopSetting?.email,
			phoneNumber: shopSetting?.phoneNumber,
			address: shopSetting?.address,
			owner: shopSetting?.owner,
			logo: shopSetting?.logo,
			banner: shopSetting?.banner,
			isActive: true,
		},
		create: {
			name: shopSetting?.name || "Albana Clodi",
			slug: DEFAULT_BRAND_SLUG,
			description: shopSetting?.description,
			email: shopSetting?.email,
			phoneNumber: shopSetting?.phoneNumber,
			address: shopSetting?.address,
			owner: shopSetting?.owner,
			logo: shopSetting?.logo,
			banner: shopSetting?.banner,
			isActive: true,
		},
	});
}

async function seedPermissions() {
	for (const [code, resource, action, description] of permissions) {
		await prisma.permission.upsert({
			where: { code },
			update: { resource, action, description },
			create: { code, resource, action, description },
		});
	}
}

async function ensureRole(brandId: string, name: string) {
	return prisma.role.upsert({
		where: {
			brandId_name: {
				brandId,
				name,
			},
		},
		update: {
			isDefault: true,
		},
		create: {
			brandId,
			name,
			isDefault: true,
		},
	});
}

async function syncRolePermissions(roleId: string, allowedCodes: Set<string>) {
	const allowedPermissions = await prisma.permission.findMany({
		where: { code: { in: [...allowedCodes] } },
		select: { id: true },
	});

	for (const permission of allowedPermissions) {
		await prisma.rolePermission.upsert({
			where: {
				roleId_permissionId: {
					roleId,
					permissionId: permission.id,
				},
			},
			update: {},
			create: {
				roleId,
				permissionId: permission.id,
			},
		});
	}
}

async function seedRoles(brandId: string) {
	const allPermissionCodes = new Set(permissions.map(([code]) => code));
	const adminPermissionCodes = new Set([...allPermissionCodes].filter((code) => !adminExcludedPermissions.has(code)));

	const ownerRole = await ensureRole(brandId, "Owner");
	const adminRole = await ensureRole(brandId, "Admin");
	const staffRole = await ensureRole(brandId, "Staff");

	await syncRolePermissions(ownerRole.id, allPermissionCodes);
	await syncRolePermissions(adminRole.id, adminPermissionCodes);
	await syncRolePermissions(staffRole.id, staffPermissionCodes);

	return { ownerRole, adminRole };
}

async function assignExistingUsersToDefaultBrand(brandId: string, ownerRoleId: string, adminRoleId: string) {
	const users = await prisma.user.findMany({
		select: {
			id: true,
			role: true,
		},
	});

	for (const user of users) {
		const roleId = user.role === Roles.SUPERADMIN ? ownerRoleId : adminRoleId;

		await prisma.userBrandRole.upsert({
			where: {
				userId_brandId: {
					userId: user.id,
					brandId,
				},
			},
			update: {
				roleId,
			},
			create: {
				userId: user.id,
				brandId,
				roleId,
			},
		});
	}
}

export async function RolePermissionSeeder() {
	try {
		console.log("Seeding role and permission data...");

		const brand = await ensureDefaultBrand();
		await seedPermissions();
		const { ownerRole, adminRole } = await seedRoles(brand.id);
		await assignExistingUsersToDefaultBrand(brand.id, ownerRole.id, adminRole.id);

		console.log("Role and permission seeding completed successfully");
	} catch (error) {
		console.error("Error seeding role and permission data:", error);
	}
}
