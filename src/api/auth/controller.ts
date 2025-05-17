import { ServiceResponse } from "@/common/models/serviceResponse";
import type { AuthRequest } from "@/common/types/auth";
import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { LoginType, RegisterType } from "./model";
import { authService } from "./service";

export class AuthController {
	public register: RequestHandler = async (req: Request, res: Response) => {
		const registerData = req.body as RegisterType["body"];
		const serviceResponse = await authService.register(registerData);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public login: RequestHandler = async (req: Request, res: Response) => {
		const loginData = req.body as LoginType["body"];
		const serviceResponse = await authService.login(loginData);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getCurrentUser: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
		const userId = req.user?.id as string;

		const serviceResponse = await authService.getCurrentUser(userId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateUser: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
		const userId = req.user?.id as string;

		const updateData = req.body as { fullname?: string; email?: string };

		const serviceResponse = await authService.updateUser(userId, updateData);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}
