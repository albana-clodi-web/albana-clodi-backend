import type { Roles } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { authRepository } from "../../api/auth/repository";
import { ServiceResponse } from "../models/serviceResponse";
import type { AuthRequest } from "../types/auth";

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		res
			.status(StatusCodes.UNAUTHORIZED)
			.send(ServiceResponse.failure("Unauthorized - Token tidak tersedia", null, StatusCodes.UNAUTHORIZED));
		return;
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { id: string; role: Roles };

		const user = await authRepository.client.user.findUnique({
			where: { id: decoded.id },
			select: {
				id: true,
				email: true,
				fullname: true,
				role: true,
			},
		});

		if (!user) {
			res
				.status(StatusCodes.NOT_FOUND)
				.send(ServiceResponse.failure("User tidak ditemukan", null, StatusCodes.NOT_FOUND));
			return;
		}

		req.user = {
			id: user.id,
			email: user.email || "",
			fullname: user.fullname || "",
			role: user.role as Roles,
		};

		next();
	} catch (error) {
		next(error);
	}
};
