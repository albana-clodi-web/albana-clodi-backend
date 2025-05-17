import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Request, type Response, type Router } from "express";
import multer from "multer";
import { z } from "zod";
import { ExpenseController } from "./controller";
import { CreateExpensesSchema, ExpenseParamsSchema, ExpensesSchema, UpdateExpensesSchema } from "./model";

export const expensesRegistry = new OpenAPIRegistry();
export const expensesRouter: Router = express.Router();

expensesRegistry.register("Expense", ExpensesSchema);

expensesRegistry.registerPath({
	method: "get",
	path: "/expenses",
	tags: ["Expenses"],
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

expensesRegistry.registerPath({
	method: "get",
	path: "/expenses/{id}",
	tags: ["Expenses"],
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
	},
	responses: createApiResponse(ExpensesSchema, "Success"),
});

expensesRegistry.registerPath({
	method: "post",
	path: "/expenses",
	tags: ["Expenses"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: ExpensesSchema.omit({ id: true }),
				},
			},
		},
	},
	responses: createApiResponse(ExpensesSchema, "Success"),
});

expensesRegistry.registerPath({
	method: "put",
	path: "/expenses/{id}",
	tags: ["Expenses"],
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
		body: {
			content: {
				"application/json": {
					schema: ExpensesSchema.partial().omit({ id: true }),
				},
			},
		},
	},
	responses: createApiResponse(ExpensesSchema, "Success"),
});

expensesRegistry.registerPath({
	method: "delete",
	path: "/expenses/{id}",
	tags: ["Expenses"],
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
	},
	responses: createApiResponse(z.object({ message: z.string() }), "Success"),
});

expensesRegistry.registerPath({
	method: "get",
	path: "/expenses/export/excel",
	tags: ["Expenses"],
	request: {
		query: z.object({
			startDate: z.string().optional(),
			endDate: z.string().optional(),
			month: z.string().optional(),
			year: z.string().optional(),
			week: z.string().optional(),
		}),
	},
	responses: {
		"200": {
			description: "Success",
			content: {
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
					schema: z.any(),
				},
			},
		},
	},
});

expensesRegistry.registerPath({
	method: "post",
	path: "/expenses/import/excel",
	tags: ["Expenses"],
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: z.object({
						expenses_data: z.any().optional().describe("File Excel untuk diimpor"),
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

const upload = multer({ storage: multer.memoryStorage() });

const expenseController = new ExpenseController();

expensesRouter
	.route("/")
	.get(expenseController.getAllExpenses)
	.post(validateRequest(CreateExpensesSchema), expenseController.createExpense);
expensesRouter
	.route("/:id")
	.get(validateRequest(ExpenseParamsSchema), expenseController.getExpenseDetail)
	.put(validateRequest(UpdateExpensesSchema), expenseController.updateExpense)
	.delete(validateRequest(ExpenseParamsSchema), expenseController.deleteExpense);
expensesRouter.route("/export/excel").get(expenseController.exportExpenses);
expensesRouter.route("/import/excel").post(upload.single("expenses_data"), expenseController.importExpenses);
