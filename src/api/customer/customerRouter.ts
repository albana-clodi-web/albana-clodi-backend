import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { CustomerCategoryEnum } from "@/common/enums/customer/customerCategoryEnum";
import { CustomerStatusEnum } from "@/common/enums/customer/customerStatusEnum";
import { OrderPaginationEnum } from "@/common/enums/orderPaginationEnum";
import { validateRequest } from "@/common/utils/httpHandlers";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
import { type ZodTypeAny, z } from "zod";
import { customerController } from "./customerController";
import {
	CreateCustomerRequestSchema,
	CustomerSchema,
	DeleteCustomerRequestSchema,
	GetAllCustomerRequestSchema,
	GetCustomerRequestSchema,
	UpdateCustomerRequestSchema,
} from "./customerModel";

export const customerRegistry = new OpenAPIRegistry();
export const customerRouter: Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

customerRegistry.register("Customer", CustomerSchema);

customerRegistry.registerPath({
	method: "get",
	path: "/customers",
	tags: ["Customer"],
	security: [{ bearerAuth: [] }],
	request: {
		query: GetAllCustomerRequestSchema.shape.query,
	},
	responses: createApiResponse(z.array(CustomerSchema), "Success", StatusCodes.CREATED),
});
customerRouter.get("/", validateRequest(GetAllCustomerRequestSchema), customerController.getAllCustomers);

customerRegistry.registerPath({
	method: "get",
	path: "/customers/{id}",
	tags: ["Customer"],
	security: [{ bearerAuth: [] }],
	request: {
		params: GetCustomerRequestSchema.shape.params,
	},
	responses: createApiResponse(CustomerSchema, "Success", StatusCodes.OK),
});
customerRouter.get("/:id", validateRequest(GetCustomerRequestSchema), customerController.getDetailCustomer);

customerRegistry.registerPath({
	method: "post",
	path: "/customers",
	tags: ["Customer"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateCustomerRequestSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(CustomerSchema, "Success", StatusCodes.CREATED),
});
customerRouter.post("/", validateRequest(CreateCustomerRequestSchema), customerController.createCustomer);

customerRegistry.registerPath({
	method: "put",
	path: "/customers/{id}",
	tags: ["Customer"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: UpdateCustomerRequestSchema.shape.body,
				},
			},
		},
		params: UpdateCustomerRequestSchema.shape.params,
	},
	responses: createApiResponse(CustomerSchema, "Success", StatusCodes.CREATED),
});
customerRouter.put("/:id", validateRequest(UpdateCustomerRequestSchema), customerController.updateCustomer);

customerRegistry.registerPath({
	method: "delete",
	path: "/customers/{id}",
	tags: ["Customer"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: DeleteCustomerRequestSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(CustomerSchema, "Success", StatusCodes.CREATED),
});
customerRouter.delete("/:id", validateRequest(DeleteCustomerRequestSchema), customerController.deleteCustomer);

customerRegistry.registerPath({
	method: "post",
	path: "/customers/export/excel",
	tags: ["Customer"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: z.object({
						customers_data: z.any().optional().describe("File Excel untuk diimpor"),
					}),
				},
			},
		},
	},
	responses: {
		"200": {
			description: "Success",
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						message: z.string(),
						responseObject: z.object({
							totalImported: z.number(),
						}),
						statusCode: z.number(),
					}),
				},
			},
		},
	},
});
customerRouter.post("/export/excel", customerController.exportCustomers);

customerRegistry.registerPath({
	method: "post",
	path: "/customers/import/excel",
	tags: ["Customer"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: z.object({
						customers_data: z.any().optional().describe("File Excel untuk diimpor"),
					}),
				},
			},
		},
	},
	responses: {
		"200": {
			description: "Success",
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						message: z.string(),
						responseObject: z.object({
							totalImported: z.number(),
						}),
						statusCode: z.number(),
					}),
				},
			},
		},
	},
});
customerRouter.post("/import/excel", upload.single("customers_data"), customerController.importCustomers);
