import type { Roles } from "@prisma/client";
import type { Request } from "express";

export interface AuthRequest extends Request {
	user?: {
		id: string;
		fullname: string;
		email: string;
		role: Roles;
	};
}
