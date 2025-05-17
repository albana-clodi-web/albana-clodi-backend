import { ServiceResponse } from "@/common/models/serviceResponse";
import type { Roles } from "@prisma/client";
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import type { LoginType, RegisterType } from "./model";
import { authRepository } from "./repository";

class AuthService {
	private generateToken(userId: string): string {
		return jwt.sign({ id: userId }, process.env.JWT_SECRET || "secret", {
			expiresIn: "1d",
		});
	}

	public async register(data: RegisterType["body"]) {
		try {
			const existingUser = await authRepository.client.user.findUnique({
				where: { email: data.email },
			});

			if (existingUser) {
				return ServiceResponse.failure("Email sudah terdaftar", null, StatusCodes.BAD_REQUEST);
			}

			const hashedPassword = await bcrypt.hash(data.password, 10);

			const user = await authRepository.client.user.create({
				data: {
					email: data.email,
					password: hashedPassword,
					fullname: data.name,
				},
			});

			const token = this.generateToken(user.id);

			return ServiceResponse.success(
				"Registrasi berhasil",
				{
					token,
					user: {
						id: user.id,
						email: user.email,
						fullname: user.fullname,
					},
				},
				StatusCodes.CREATED,
			);
		} catch (error) {
			return ServiceResponse.failure("Terjadi kesalahan saat registrasi", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	public async login(data: LoginType["body"]) {
		try {
			const user = await authRepository.client.user.findUnique({
				where: { email: data.email },
			});

			if (!user) {
				return ServiceResponse.failure("Email atau password salah", null, StatusCodes.UNAUTHORIZED);
			}

			const isPasswordValid = bcrypt.compare(data.password, user.password as string);

			if (!isPasswordValid) {
				return ServiceResponse.failure("Email atau password salah", null, StatusCodes.UNAUTHORIZED);
			}

			const token = this.generateToken(user.id);

			return ServiceResponse.success(
				"Login berhasil",
				{
					token,
					user: {
						id: user.id,
						email: user.email,
						fullname: user.fullname,
					},
				},
				StatusCodes.OK,
			);
		} catch (error) {
			return ServiceResponse.failure("Terjadi kesalahan saat login", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	public async getCurrentUser(userId: string) {
		try {
			const user = await authRepository.client.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				return ServiceResponse.failure("User tidak ditemukan", null, StatusCodes.NOT_FOUND);
			}

			return ServiceResponse.success(
				"Berhasil mendapatkan data user",
				{
					id: user.id,
					email: user.email as string,
					fullname: user.fullname as string,
					role: user.role as Roles,
				},
				StatusCodes.OK,
			);
		} catch (error) {
			return ServiceResponse.failure(
				"Terjadi kesalahan saat mengambil data user",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	public async updateUser(userId: string, updateData: { fullname?: string; email?: string }) {
		try {
			const user = await authRepository.client.user.update({
				where: { id: userId },
				data: updateData,
				select: {
					id: true,
					email: true,
					fullname: true,
					role: true,
				},
			});

			return ServiceResponse.success(
				"Berhasil mengupdate data user",
				{
					id: user.id,
					email: user.email as string,
					fullname: user.fullname as string,
					role: user.role as Roles,
				},
				StatusCodes.OK,
			);
		} catch (error) {
			return ServiceResponse.failure(
				"Terjadi kesalahan saat mengupdate data user",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const authService = new AuthService();
