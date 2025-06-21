import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { authenticate } from "@/common/middleware/authenticate";
import { authorizeRoles } from "@/common/middleware/authorizeRoles";
import { validateRequest } from "@/common/utils/httpHandlers";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Request, type Response, type Router } from "express";
import multer from "multer";
import { z } from "zod";
import { Roles } from "../../../generated/prisma";
import { ShopController } from "./controller";
import { CreateShopSettingSchema, UpdateShopSettingSchema } from "./model";

export const shopRegistry = new OpenAPIRegistry();
export const shopRouter: Router = express.Router();

// Konfigurasi multer untuk menangani multipart form data
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

shopRegistry.registerPath({
	method: "post",
	path: "/shop",
	tags: ["Shop"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: CreateShopSettingSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(
		z.object({
			id: z.string().uuid(),
			name: z.string(),
			description: z.string().optional(),
			email: z.string().email().optional(),
			phoneNumber: z.string().optional(),
			address: z.string().optional(),
			owner: z.string().optional(),
			logo: z.string().optional(),
			banner: z.string().optional(),
		}),
		"Berhasil membuat pengaturan toko",
	),
});

shopRegistry.registerPath({
	method: "get",
	path: "/shop",
	tags: ["Shop"],
	security: [{ bearerAuth: [] }],
	responses: createApiResponse(
		z.object({
			id: z.string().uuid(),
			name: z.string(),
			description: z.string().optional(),
			email: z.string().email().optional(),
			phoneNumber: z.string().optional(),
			address: z.string().optional(),
			owner: z.string().optional(),
			logo: z.string().optional(),
			banner: z.string().optional(),
		}),
		"Berhasil mendapatkan pengaturan toko",
	),
});

shopRegistry.registerPath({
	method: "patch",
	path: "/shop",
	tags: ["Shop"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: UpdateShopSettingSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(
		z.object({
			id: z.string().uuid(),
			name: z.string(),
			description: z.string().optional(),
			email: z.string().email().optional(),
			phoneNumber: z.string().optional(),
			address: z.string().optional(),
			owner: z.string().optional(),
			logo: z.string().optional(),
			banner: z.string().optional(),
		}),
		"Berhasil mengupdate pengaturan toko",
	),
});

const shopController = new ShopController();

shopRouter.post(
	"/",
	authenticate,
	authorizeRoles([Roles.SUPERADMIN]),
	upload.fields([
		{ name: "logo", maxCount: 1 },
		{ name: "banner", maxCount: 1 },
	]),
	validateRequest(CreateShopSettingSchema),
	shopController.createShopSetting,
);
shopRouter.get("/", authenticate, authorizeRoles([Roles.SUPERADMIN]), shopController.getShopSetting);
shopRouter.patch(
	"/",
	authenticate,
	authorizeRoles([Roles.SUPERADMIN]),
	upload.fields([
		{ name: "logo", maxCount: 1 },
		{ name: "banner", maxCount: 1 },
	]),
	validateRequest(UpdateShopSettingSchema),
	shopController.updateShopSetting,
);
