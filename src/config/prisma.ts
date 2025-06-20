import { type Prisma, PrismaClient } from "@prisma/client";
import { env } from "../common/utils/envConfig";

declare global {
	// eslint-disable-next-line no-var
	var prisma: PrismaClient | undefined;
}

// Konfigurasi timezone
process.env.TZ = "Asia/Jakarta";

// ✅ Gunakan instance yang sudah ada, jika tersedia (singleton)
const prismaClient =
	global.prisma ??
	new PrismaClient({
		log: [
			{ level: "query", emit: "event" },
			{ level: "error", emit: "stdout" },
			{ level: "info", emit: "stdout" },
			{ level: "warn", emit: "stdout" },
		],
	});

// Logging query (opsional)
prismaClient.$on("query", (e: Prisma.QueryEvent) => {
	console.log(`Query: ${e.query}`);
});

// ✅ Di development, simpan ke global untuk hindari koneksi ganda
if (env.NODE_ENV !== "production") global.prisma = prismaClient;

export default prismaClient;
