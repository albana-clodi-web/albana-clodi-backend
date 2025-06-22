import { ServiceResponse } from "@/common/models/serviceResponse";
import { prismaClient } from "@/config/prisma";
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import type { Roles } from "../../../generated/prisma";
import type { LoginType, RegisterType, UpdateProfileType } from "./model";

class AuthService {
	private generateToken(userId: string): string {
		return jwt.sign({ id: userId }, process.env.JWT_SECRET || "secret", {
			expiresIn: "1d",
		});
	}

	public async register(data: RegisterType["body"]) {
		try {
			const existingUser = await prismaClient().user.findUnique({
				where: { email: data.email },
			});

			if (existingUser) {
				return ServiceResponse.failure("Email sudah terdaftar", null, StatusCodes.BAD_REQUEST);
			}

			const hashedPassword = await bcrypt.hash(data.password, 10);

			const user = await prismaClient().user.create({
				data: {
					email: data.email,
					password: hashedPassword,
					fullname: data.name,
					role: "ADMIN" as Roles,
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
			const user = await prismaClient().user.findUnique({
				where: { email: data.email },
			});

			if (!user) {
				return ServiceResponse.failure("Email atau password salah", null, StatusCodes.UNAUTHORIZED);
			}

			const isPasswordValid = await bcrypt.compare(data.password, user.password as string);

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
			const user = await prismaClient().user.findUnique({
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
					phoneNumber: user.phoneNumber,
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

	public async updateUser(userId: string, updateData: UpdateProfileType["body"]) {
		try {
			const updatedUserData: {
				fullname?: string;
				email?: string;
				password?: string;
				phoneNumber?: string;
				confirmPassword?: string;
			} = {
				...updateData,
			};

			if (updateData.password) {
				if (!updateData.confirmPassword) {
					return ServiceResponse.failure("Konfirmasi password harus diisi", null, StatusCodes.BAD_REQUEST);
				}

				if (updateData.password !== updateData.confirmPassword) {
					return ServiceResponse.failure("Password dan konfirmasi password tidak sama", null, StatusCodes.BAD_REQUEST);
				}

				const hashedPassword = await bcrypt.hash(updateData.password, 10);
				updatedUserData.password = hashedPassword;
			}

			// Hapus confirmPassword dari data yang akan diupdate
			const { confirmPassword, ...dataToUpdate } = updatedUserData;

			const user = await prismaClient().user.update({
				where: { id: userId },
				data: dataToUpdate,
				select: {
					id: true,
					email: true,
					fullname: true,
					phoneNumber: true,
					role: true,
				},
			});

			return ServiceResponse.success(
				"Berhasil mengupdate data user",
				{
					id: user.id,
					email: user.email as string,
					phoneNumber: user.phoneNumber as string,
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
