import { PrismaClient } from "@prisma/client";
import { OrderSeeder } from "./orderSeeder";
import { RegionSeeder } from "./regionSeeder";

const prisma = new PrismaClient();

async function main() {
	try {
		console.log("Starting seeder....");

		await RegionSeeder();
		await OrderSeeder();

		console.log("Completed seeder....");
	} catch (error) {
		console.log(error);
	}
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
