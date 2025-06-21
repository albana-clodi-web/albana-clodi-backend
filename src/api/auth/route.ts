import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { authenticate } from "@/common/middleware/authenticate";
import { authorizeRoles } from "@/common/middleware/authorizeRoles";
import { validateRequest } from "@/common/utils/httpHandlers";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import { Roles } from "../../../generated/prisma";
import { AuthController } from "./controller";
import { LoginSchema, RegisterSchema, UpdateProfileSchema } from "./model";

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

authRegistry.registerPath({
	method: "post",
	path: "/auth/register",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: RegisterSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(
		z.object({
			token: z.string(),
			user: z.object({
				id: z.string().uuid(),
				email: z.string().email(),
				name: z.string(),
			}),
		}),
		"Registrasi berhasil",
	),
});

authRegistry.registerPath({
	method: "post",
	path: "/auth/login",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: LoginSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(
		z.object({
			token: z.string(),
			user: z.object({
				id: z.string().uuid(),
				email: z.string().email(),
				name: z.string(),
			}),
		}),
		"Login berhasil",
	),
});

authRegistry.registerPath({
	method: "get",
	path: "/auth/current",
	tags: ["Auth"],
	security: [{ bearerAuth: [] }],
	responses: createApiResponse(
		z.object({
			id: z.string().uuid(),
			email: z.string().email(),
			name: z.string(),
		}),
		"Berhasil mendapatkan data user",
	),
});

authRegistry.registerPath({
	method: "patch",
	path: "/auth/me",
	tags: ["Auth"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: UpdateProfileSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(
		z.object({
			id: z.string().uuid(),
			email: z.string().email(),
			fullname: z.string(),
			role: z.enum(["ADMIN", "SUPERADMIN"]),
			phoneNumber: z.string().optional(),
		}),
		"Berhasil mengupdate data user",
	),
});

const authController = new AuthController();

authRouter.post("/register", validateRequest(RegisterSchema), authController.register);
authRouter.post("/login", validateRequest(LoginSchema), authController.login);
authRouter.get(
	"/current",
	authenticate,
	authorizeRoles([Roles.ADMIN, Roles.SUPERADMIN]),
	authController.getCurrentUser,
);
authRouter.patch("/me", authenticate, authorizeRoles([Roles.ADMIN, Roles.SUPERADMIN]), authController.updateUser);
