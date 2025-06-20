import { PrismaClient } from "@prisma/client";
import { env } from "../common/utils/envConfig";

declare global {
	// eslint-disable-next-line no-var
	var prisma: PrismaClient | undefined;
}

// Konfigurasi timezone
process.env.TZ = "Asia/Jakarta";

// Implementasi singleton pattern untuk PrismaClient
let prismaInstance: PrismaClient | undefined;

function getPrismaInstance(): PrismaClient {
	if (!prismaInstance) {
		prismaInstance =
			global.prisma ||
			new PrismaClient({
				log: [
					{ level: "error", emit: "stdout" },
					{ level: "info", emit: "stdout" },
					{ level: "warn", emit: "stdout" },
				],
			});

		// Simpan ke global di development untuk hindari koneksi ganda
		if (env.NODE_ENV !== "production") {
			global.prisma = prismaInstance;
		}
	}

	return prismaInstance;
}

// Dapatkan instance PrismaClient
const prismaClient = getPrismaInstance();

export default prismaClient;
