import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { authorizeRoles } from "@/common/middleware/authorizeRoles";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import { Roles } from "../../../generated/prisma";
import { ExpensesSchema } from "../expenses/model";
import { OrderSchema } from "../order/model";
import { ProductPriceSchema } from "../product-price/productPriceModel";
import { ReportController } from "./controller";

export const reportRegistry = new OpenAPIRegistry();
export const reportRouter: Router = express.Router();

reportRegistry.register("Report", ExpensesSchema);

reportRegistry.registerPath({
	method: "get",
	path: "/reports/expenses",
	tags: ["Report"],
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			startDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-01-01)"),
			endDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-12-31)"),
			month: z.string().optional().describe("Month number 1-12 (e.g. 1 for January)"),
			year: z.string().optional().describe("Year in YYYY format (e.g. 2025)"),
			week: z.string().optional().describe("Week number 1-52 (e.g. 1)"),
		}),
	},
	responses: createApiResponse(z.array(ExpensesSchema), "Success"),
});

reportRegistry.registerPath({
	method: "get",
	path: "/reports/orders",
	tags: ["Report"],
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			startDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-01-01)"),
			endDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-12-31)"),
			month: z.string().optional().describe("Month number 1-12 (e.g. 1 for January)"),
			year: z.string().optional().describe("Year in YYYY format (e.g. 2025)"),
			week: z.string().optional().describe("Week number 1-52 (e.g. 1)"),
		}),
	},
	responses: createApiResponse(z.array(OrderSchema), "Success"),
});

reportRegistry.registerPath({
	method: "get",
	path: "/reports/products",
	tags: ["Report"],
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			startDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-01-01)"),
			endDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-12-31)"),
			month: z.string().optional().describe("Month number 1-12 (e.g. 1 for January)"),
			year: z.string().optional().describe("Year in YYYY format (e.g. 2025)"),
			week: z.string().optional().describe("Week number 1-52 (e.g. 1)"),
		}),
	},
	responses: createApiResponse(z.array(ProductPriceSchema), "Success"),
});

reportRegistry.registerPath({
	method: "get",
	path: "/reports/transactions",
	tags: ["Report"],
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			startDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-01-01)"),
			endDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-12-31)"),
			month: z.string().optional().describe("Month number 1-12 (e.g. 1 for January)"),
			year: z.string().optional().describe("Year in YYYY format (e.g. 2025)"),
			week: z.string().optional().describe("Week number 1-52 (e.g. 1)"),
		}),
	},
	responses: createApiResponse(z.array(ProductPriceSchema), "Success"),
});

reportRegistry.registerPath({
	method: "get",
	path: "/reports/payments-transactions",
	tags: ["Report"],
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			startDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-01-01)"),
			endDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-12-31)"),
			month: z.string().optional().describe("Month number 1-12 (e.g. 1 for January)"),
			year: z.string().optional().describe("Year in YYYY format (e.g. 2025)"),
			week: z.string().optional().describe("Week number 1-52 (e.g. 1)"),
		}),
	},
	responses: createApiResponse(z.array(ProductPriceSchema), "Success"),
});

reportRegistry.registerPath({
	method: "get",
	path: "/reports/products-sold",
	tags: ["Report"],
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			startDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-01-01)"),
			endDate: z.string().optional().describe("Format: YYYY-MM-DD (e.g. 2025-12-31)"),
			month: z.string().optional().describe("Month number 1-12 (e.g. 1 for January)"),
			year: z.string().optional().describe("Year in YYYY format (e.g. 2025)"),
			week: z.string().optional().describe("Week number 1-52 (e.g. 1)"),
		}),
	},
	responses: createApiResponse(z.array(ProductPriceSchema), "Success"),
});

const reportController = new ReportController();

reportRouter.route("/expenses").get(reportController.reportExpenses);
reportRouter.route("/orders").get(authorizeRoles([Roles.SUPERADMIN]), reportController.reportOrders);
reportRouter.route("/products").get(reportController.reportProducts);
reportRouter.route("/transactions").get(authorizeRoles([Roles.SUPERADMIN]), reportController.reportTransaction);
reportRouter.route("/payments-transactions").get(reportController.reportPaymentsTransactions);
reportRouter.route("/products-sold").get(reportController.reportProductsSold);
