import { env } from "@/common/utils/envConfig";
import { PrismaClient } from "../../generated/prisma";

const appPrismaInstances: Record<string, PrismaClient> = {};

export const prismaClient = (): PrismaClient => {
	const dbUrl = env.DATABASE_POOL_URL as string;
	if (!appPrismaInstances[dbUrl]) {
		appPrismaInstances[dbUrl] = new PrismaClient({
			datasources: {
				db: {
					url: dbUrl,
				},
			},
		});
	}
	return appPrismaInstances[dbUrl];
};
