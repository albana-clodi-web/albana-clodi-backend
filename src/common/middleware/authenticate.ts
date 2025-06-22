import { prismaClient } from "@/config/prisma";
import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import type { Roles } from "../../../generated/prisma";
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

		const user = await prismaClient().user.findUnique({
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
		if (error instanceof jwt.TokenExpiredError) {
			res
				.status(StatusCodes.UNAUTHORIZED)
				.send(ServiceResponse.failure("Unauthorized - Token telah kadaluarsa", null, StatusCodes.UNAUTHORIZED));
			return;
		}
		if (error instanceof jwt.JsonWebTokenError) {
			res
				.status(StatusCodes.UNAUTHORIZED)
				.send(ServiceResponse.failure("Unauthorized - Token tidak valid", null, StatusCodes.UNAUTHORIZED));
			return;
		}
		next(error);
	}
};
