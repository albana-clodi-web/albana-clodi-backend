import { CustomerCategories, CustomerStatuses, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function OrderSeeder() {
	try {
		console.log("Starting order seed...");

		// Seed customers
		console.time("Customers seeding");
		const customerCategories = Object.values(CustomerCategories);
		const customerStatuses = Object.values(CustomerStatuses);

		const customers = [
			{
				name: "John Doe",
				category: CustomerCategories.CUSTOMER,
				address: "Jl. Sudirman No. 123",
				subdistrict: "Karet Semanggi",
				postalCode: "12930",
				phoneNumber: "081234567890",
				destinationId: 1,
				email: "john.doe@example.com",
				status: CustomerStatuses.ACTIVE,
			},
			{
				name: "Jane Smith",
				category: CustomerCategories.RESELLER,
				address: "Jl. Gatot Subroto No. 456",
				subdistrict: "Kuningan",
				postalCode: "12940",
				phoneNumber: "082345678901",
				destinationId: 2,
				email: "jane.smith@example.com",
				status: CustomerStatuses.ACTIVE,
			},
			{
				name: "Ahmad Rizal",
				category: CustomerCategories.DROPSHIPPER,
				address: "Jl. Thamrin No. 789",
				subdistrict: "Menteng",
				postalCode: "10310",
				phoneNumber: "083456789012",
				destinationId: 3,
				email: "ahmad.rizal@example.com",
				status: CustomerStatuses.ACTIVE,
			},
			{
				name: "Siti Rahayu",
				category: CustomerCategories.MEMBER,
				address: "Jl. Asia Afrika No. 101",
				subdistrict: "Bandung Wetan",
				postalCode: "40111",
				phoneNumber: "084567890123",
				destinationId: 4,
				email: "siti.rahayu@example.com",
				status: CustomerStatuses.ACTIVE,
			},
			{
				name: "Budi Santoso",
				category: CustomerCategories.AGENT,
				address: "Jl. Diponegoro No. 202",
				subdistrict: "Darmo",
				postalCode: "60265",
				phoneNumber: "085678901234",
				destinationId: 5,
				email: "budi.santoso@example.com",
				status: CustomerStatuses.ACTIVE,
			},
			{
				name: "Dewi Lestari",
				category: CustomerCategories.CUSTOMER,
				address: "Jl. Pemuda No. 303",
				subdistrict: "Gubeng",
				postalCode: "60284",
				phoneNumber: "086789012345",
				destinationId: 6,
				email: "dewi.lestari@example.com",
				status: CustomerStatuses.NONACTIVE,
			},
			{
				name: "Eko Prasetyo",
				category: CustomerCategories.RESELLER,
				address: "Jl. Veteran No. 404",
				subdistrict: "Malang",
				postalCode: "65145",
				phoneNumber: "087890123456",
				destinationId: 7,
				email: "eko.prasetyo@example.com",
				status: CustomerStatuses.ACTIVE,
			},
			{
				name: "Fitri Handayani",
				category: CustomerCategories.DROPSHIPPER,
				address: "Jl. Gajah Mada No. 505",
				subdistrict: "Hayam Wuruk",
				postalCode: "10130",
				phoneNumber: "088901234567",
				destinationId: 8,
				email: "fitri.handayani@example.com",
				status: CustomerStatuses.ACTIVE,
			},
			{
				name: "Gunawan Wibowo",
				category: CustomerCategories.MEMBER,
				address: "Jl. Pahlawan No. 606",
				subdistrict: "Semarang Selatan",
				postalCode: "50249",
				phoneNumber: "089012345678",
				destinationId: 9,
				email: "gunawan.wibowo@example.com",
				status: CustomerStatuses.NONACTIVE,
			},
			{
				name: "Heni Purnama",
				category: CustomerCategories.AGENT,
				address: "Jl. Ahmad Yani No. 707",
				subdistrict: "Wonokromo",
				postalCode: "60243",
				phoneNumber: "081234567891",
				destinationId: 10,
				email: "heni.purnama@example.com",
				status: CustomerStatuses.ACTIVE,
			},
		];

		const createdCustomers = await prisma.customer.createMany({
			data: customers,
			skipDuplicates: true,
		});
		console.timeEnd("Customers seeding");
		console.log(`Created ${createdCustomers.count} customers`);

		// Seed payment methods
		console.time("Payment methods seeding");
		const paymentMethods = [
			{
				name: "Bank Transfer BCA",
				bankName: "BCA",
				bankBranch: "Jakarta",
				accountNumber: "1234567890",
			},
			{
				name: "Bank Transfer Mandiri",
				bankName: "Mandiri",
				bankBranch: "Jakarta",
				accountNumber: "0987654321",
			},
			{
				name: "Bank Transfer BNI",
				bankName: "BNI",
				bankBranch: "Jakarta",
				accountNumber: "1122334455",
			},
			{
				name: "E-Wallet OVO",
				bankName: "OVO",
				accountNumber: "081234567890",
			},
			{
				name: "E-Wallet GoPay",
				bankName: "GoPay",
				accountNumber: "082345678901",
			},
			{
				name: "Cash on Delivery",
			},
		];

		const createdPaymentMethods = await prisma.paymentMethod.createMany({
			data: paymentMethods,
			skipDuplicates: true,
		});
		console.timeEnd("Payment methods seeding");
		console.log(`Created ${createdPaymentMethods.count} payment methods`);

		// Seed delivery places
		console.time("Delivery places seeding");
		const deliveryPlaces = [
			{
				name: "Kantor Pusat",
				address: "Jl. Sudirman No. 123, Jakarta",
				subdistrict: "Karet Semanggi",
				phoneNumber: "021-5551234",
				destinationId: 1,
				email: "kantor.pusat@example.com",
				description: "Kantor pusat perusahaan",
			},
			{
				name: "Gudang Utama",
				address: "Jl. Industri No. 456, Bekasi",
				subdistrict: "Cikarang",
				phoneNumber: "021-5552345",
				destinationId: 2,
				email: "gudang.utama@example.com",
				description: "Gudang utama untuk penyimpanan barang",
			},
			{
				name: "Cabang Bandung",
				address: "Jl. Asia Afrika No. 789, Bandung",
				subdistrict: "Bandung Wetan",
				phoneNumber: "022-4231234",
				destinationId: 3,
				email: "cabang.bandung@example.com",
				description: "Kantor cabang wilayah Bandung",
			},
			{
				name: "Cabang Surabaya",
				address: "Jl. Pemuda No. 101, Surabaya",
				subdistrict: "Gubeng",
				phoneNumber: "031-5678901",
				destinationId: 4,
				email: "cabang.surabaya@example.com",
				description: "Kantor cabang wilayah Surabaya",
			},
			{
				name: "Cabang Medan",
				address: "Jl. Diponegoro No. 202, Medan",
				subdistrict: "Medan Baru",
				phoneNumber: "061-4567890",
				destinationId: 5,
				email: "cabang.medan@example.com",
				description: "Kantor cabang wilayah Medan",
			},
		];

		const createdDeliveryPlaces = await prisma.deliveryPlace.createMany({
			data: deliveryPlaces,
			skipDuplicates: true,
		});
		console.timeEnd("Delivery places seeding");
		console.log(`Created ${createdDeliveryPlaces.count} delivery places`);

		// Seed sales channels
		console.time("Sales channels seeding");
		const salesChannels = [
			{ name: "Website", isActive: true },
			{ name: "Tokopedia", isActive: true },
			{ name: "Shopee", isActive: true },
			{ name: "Lazada", isActive: true },
			{ name: "Bukalapak", isActive: false },
			{ name: "TikTok Shop", isActive: true },
			{ name: "Instagram", isActive: true },
			{ name: "Facebook", isActive: false },
			{ name: "WhatsApp", isActive: true },
			{ name: "Offline Store", isActive: true },
		];

		await prisma.salesChannel.createMany({
			data: salesChannels,
			skipDuplicates: true,
		});
		console.timeEnd("Sales channels seeding");

		console.log("Order seeding complete.");
	} catch (error) {
		console.error("Error in order seeder:", error);
	}
}
