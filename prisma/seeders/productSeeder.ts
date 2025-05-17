import { PrismaClient, ProductTypes } from "@prisma/client";

export async function ProductsSeeder() {
	console.log("Seeding products...");
	const prisma = new PrismaClient();

	try {
		console.time("Categories seeding");
		const categories = [
			{ name: "Pakaian" },
			{ name: "Aksesoris" },
			{ name: "Elektronik" },
			{ name: "Makanan" },
			{ name: "Minuman" },
		];

		await prisma.category.createMany({
			data: categories,
			skipDuplicates: true,
		});
		console.timeEnd("Categories seeding");

		console.time("Products seeding");
		// Dapatkan ID kategori yang sudah dibuat
		const categoryIds = await prisma.category.findMany({
			select: { id: true, name: true },
		});

		const categoryMap = new Map(categoryIds.map((cat) => [cat.name, cat.id]));

		// Buat produk
		const products = [
			{
				name: "Kaos Polos",
				categoryId: categoryMap.get("Pakaian"),
				type: ProductTypes.BARANG_STOK_SENDIRI,
				description: "Kaos polos berkualitas tinggi",
				weight: 0.2,
				isPublish: true,
			},
			{
				name: "Celana Jeans",
				categoryId: categoryMap.get("Pakaian"),
				type: ProductTypes.BARANG_STOK_SENDIRI,
				description: "Celana jeans dengan bahan premium",
				weight: 0.5,
				isPublish: true,
			},
			{
				name: "Gelang Tangan",
				categoryId: categoryMap.get("Aksesoris"),
				type: ProductTypes.BARANG_SUPPLIER_LAIN,
				description: "Gelang tangan dengan desain elegan",
				weight: 0.05,
				isPublish: true,
			},
			{
				name: "Smartphone",
				categoryId: categoryMap.get("Elektronik"),
				type: ProductTypes.BARANG_PRE_ORDER,
				description: "Smartphone dengan spesifikasi tinggi",
				weight: 0.3,
				isPublish: true,
			},
			{
				name: "Keripik Kentang",
				categoryId: categoryMap.get("Makanan"),
				type: ProductTypes.BARANG_STOK_SENDIRI,
				description: "Keripik kentang renyah dan gurih",
				weight: 0.1,
				isPublish: true,
			},
		];

		for (const product of products) {
			const createdProduct = await prisma.product.create({
				data: product,
			});

			// Buat varian produk
			const variants = [
				{
					productId: createdProduct.id,
					sku: `${createdProduct.name?.substring(0, 3).toUpperCase() || "XXX"}-001`,
					stock: 100,
					size: "M",
					color: "Hitam",
					imageUrl: "https://example.com/image.jpg",
				},
				{
					productId: createdProduct.id,
					sku: `${createdProduct.name?.substring(0, 3).toUpperCase() || "XXX"}-002`,
					stock: 50,
					size: "L",
					color: "Putih",
					imageUrl: "https://example.com/image2.jpg",
				},
			];

			for (const variant of variants) {
				const createdVariant = await prisma.productVariant.create({
					data: variant,
				});

				// Buat harga produk
				await prisma.productPrice.create({
					data: {
						productVariantId: createdVariant.id,
						normal: 100000,
						buy: 80000,
						reseller: 90000,
						agent: 85000,
						member: 95000,
					},
				});

				// Buat harga grosir
				await prisma.productWholesaler.create({
					data: {
						productVariantId: createdVariant.id,
						lowerLimitItem: 10,
						upperLimitItem: 50,
						unitPrice: 100000,
						wholesalerPrice: 85000,
					},
				});
			}
		}
		console.timeEnd("Products seeding");

		console.log("Product seeding complete.");
	} catch (error) {
		console.error("Error in product seeder:", error);
	} finally {
		await prisma.$disconnect();
	}
}
