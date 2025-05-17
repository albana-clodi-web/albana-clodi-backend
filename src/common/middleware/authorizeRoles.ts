import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "../models/serviceResponse";
import type { AuthRequest } from "../types/auth";

export const authorizeRoles = (allowedRoles: string[]) => {
	return (req: AuthRequest, res: Response, next: NextFunction): void => {
		const userRole = req.user?.role;

		if (!userRole) {
			res
				.status(StatusCodes.UNAUTHORIZED)
				.send(ServiceResponse.failure("Unauthorized - Role tidak tersedia", null, StatusCodes.UNAUTHORIZED));
			return;
		}

		if (!allowedRoles.includes(userRole)) {
			res
				.status(StatusCodes.FORBIDDEN)
				.send(ServiceResponse.failure("Forbidden - Role tidak diizinkan", null, StatusCodes.FORBIDDEN));
			return;
		}

		next();
	};
};
