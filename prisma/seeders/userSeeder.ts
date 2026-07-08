import { PrismaClient, Roles } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const users = [
	{
		email: "superadmin@albana.com",
		password: "superadmin-albana-clodi-250425",
		fullname: "Alfina Albana",
		role: Roles.SUPERADMIN,
		phoneNumber: "081234567890",
		isPlatformAdmin: true,
	},
	...Array.from({ length: 10 }, (_, index) => {
		const number = index + 1;

		return {
			email: `admin${number}@albana.com`,
			password: "admin-albana-clodi-123",
			fullname: `Admin ${number}`,
			role: Roles.ADMIN,
			phoneNumber: `08123456789${number}`,
			isPlatformAdmin: false,
		};
	}),
];

export async function UserSeeder() {
	try {
		console.log("Seeding users...");

		for (const user of users) {
			const hashedPassword = await bcrypt.hash(user.password, 10);

			await prisma.user.upsert({
				where: { email: user.email },
				update: {
					fullname: user.fullname,
					role: user.role,
					phoneNumber: user.phoneNumber,
					isPlatformAdmin: user.isPlatformAdmin,
				},
				create: {
					email: user.email,
					password: hashedPassword,
					fullname: user.fullname,
					role: user.role,
					phoneNumber: user.phoneNumber,
					isPlatformAdmin: user.isPlatformAdmin,
				},
			});
		}

		console.log("User seeding completed successfully");
	} catch (error) {
		console.error("Error seeding users:", error);
	}
}
