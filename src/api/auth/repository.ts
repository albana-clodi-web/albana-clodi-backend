import { PrismaClient } from "@prisma/client";

export class AuthRepository {
	constructor(private readonly prisma: PrismaClient) {}

	public get client() {
		return this.prisma;
	}
}

const prisma = new PrismaClient();
export const authRepository = new AuthRepository(prisma);
