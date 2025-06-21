import { PrismaClient } from "../../generated/prisma";

const prismaClient = new PrismaClient({
	log: [
		{ level: "error", emit: "stdout" },
		{ level: "info", emit: "stdout" },
		{ level: "warn", emit: "stdout" },
	],
});

export default prismaClient;
