import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Request, type Response, type Router } from "express";
import multer from "multer";
import { z } from "zod";
import { OrderController } from "./controller";
import { CreateOrderSchema, OrderParamsSchema, OrderQuerySchema, OrderSchema, UpdateOrderSchema } from "./model";

export const orderRegistry = new OpenAPIRegistry();
export const orderRouter: Router = express.Router();

orderRegistry.register("Order", OrderSchema);

orderRegistry.registerPath({
	method: "get",
	path: "/orders",
	tags: ["Order"],
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			ordererCustomerId: z
				.string()
				.uuid()
				.optional()
				.describe("ID pelanggan pemesan (contoh: 29d9f9d0-a35d-4ec1-af8c-6e514cade06c)"),
			deliveryTargetCustomerId: z
				.string()
				.uuid()
				.optional()
				.describe("ID pelanggan tujuan pengiriman (contoh: e1ee8c68-feed-47fd-8a24-c0af38ac9f51)"),
			salesChannelId: z
				.string()
				.uuid()
				.optional()
				.describe("ID saluran penjualan (contoh: 659a18d0-a4da-4103-a7bd-a81616cca889)"),
			deliveryPlaceId: z
				.string()
				.uuid()
				.optional()
				.describe("ID tempat pengiriman (contoh: da127630-ae9c-4678-b0f6-cdb51d645bfb)"),
			orderDate: z.string().optional().describe("Tanggal pemesanan (contoh: 2024-01-01T00:00:00.000Z)"),
			unavailableReceipt: z.enum(["yes"]).optional().describe("tidak ada resi?"),
			orderMonth: z.string().optional().describe("Bulan pemesanan (1-12)"),
			orderYear: z.string().optional().describe("Tahun pemesanan (contoh: 2024)"),
			startDate: z.string().optional().describe("Tanggal mulai pencarian (contoh: 2024-01-01T00:00:00.000Z)"),
			endDate: z.string().optional().describe("Tanggal akhir pencarian (contoh: 2025-01-01T00:00:00.000Z)"),
			customerCategory: z.string().optional().describe("Kategori pelanggan (contoh: RETAIL, DISTRIBUTOR)"),
			paymentStatus: z
				.string()
				.optional()
				.describe("Status pembayaran (contoh: settlement, pending, cancel, installments)"),
			productId: z.string().uuid().optional().describe("ID produk (contoh: 3fa85f64-5717-4562-b3fc-2c963f66afa6)"),
			paymentMethodId: z
				.string()
				.uuid()
				.optional()
				.describe("ID metode pembayaran (contoh: 3fa85f64-5717-4562-b3fc-2c963f66afa6)"),
			search: z.string().optional().describe("Kata kunci pencarian (contoh: nama pelanggan atau kode order)"),
			sort: z.string().optional().describe("Kolom untuk pengurutan (contoh: orderDate, code)"),
			order: z.enum(["asc", "desc"]).optional().describe("Urutan pengurutan (asc: naik, desc: turun)"),
			orderId: z.string().optional().describe("ID order untuk pencarian"),
			customerName: z.string().optional().describe("Nama pelanggan untuk pencarian"),
			productName: z.string().optional().describe("Nama produk untuk pencarian"),
			receiptNumber: z.string().optional().describe("Nomor resi untuk pencarian"),
			phoneNumber: z.string().optional().describe("Nomor telepon untuk pencarian"),
		}),
	},
	responses: createApiResponse(z.array(OrderSchema), "Berhasil mengambil semua order"),
});

orderRegistry.registerPath({
	method: "get",
	path: "/orders/{id}",
	tags: ["Order"],
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({
			id: z.string().uuid().describe("ID order"),
		}),
	},
	responses: createApiResponse(OrderSchema, "Berhasil mengambil detail order"),
});

orderRegistry.registerPath({
	method: "post",
	path: "/orders",
	tags: ["Order"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateOrderSchema,
					example: {
						order: {
							ordererCustomerId: "24fffee3-ee3f-4c13-8a4f-0cd7447b9bb3",
							deliveryTargetCustomerId: "24fffee3-ee3f-4c13-8a4f-0cd7447b9bb3",
							deliveryPlaceId: "6eedb934-112b-4a9a-81bb-fb62d952fa28",
							salesChannelId: "0136e1f4-9a3b-45e0-b292-9f01bf902c71",
							orderDate: "2023-01-01T00:00:00.000Z",
							note: "Tolong kirim secepatnya",
						},
						orderDetail: {
							detail: {
								originalFinalPrice: 1000,
								otherFees: {
									packaging: 5000,
									insurance: 10000,
									weight: 1000,
									productDiscount: [
										{
											produkVariantId: "40d6aefe-de8c-4afa-8aa2-8bbb017b3d7f",
											discountAmount: 10,
											discountType: "percent",
										},
									],
									shippingCost: {
										shippingService: "JNE",
										cost: 1000,
										type: "reguler",
									},
									discount: {
										value: 10,
										type: "percent",
									},
									installments: {
										paymentMethodId: "35adbda7-ade2-4b82-a512-588ad1a2ef11",
										paymentDate: "2023-01-01T00:00:00.000Z",
										amount: 50000,
									},
								},
								receiptNumber: "JNE123456789",
							},
							paymentMethod: {
								id: "35adbda7-ade2-4b82-a512-588ad1a2ef11",
								status: "PENDING",
								date: "2023-01-01T00:00:00.000Z",
							},
							orderProducts: [
								{
									productId: "57593814-de52-4377-a1e9-ca3ec1e9aaac",
									productVariantId: "40d6aefe-de8c-4afa-8aa2-8bbb017b3d7f",
									productQty: 2,
								},
							],
							shippingServices: [
								{
									shippingName: "JNE",
									serviceName: "REG",
									weight: 1000,
									isCod: false,
									shippingCost: 15000,
									shippingCashback: 2000,
									shippingCostNet: 13000,
									grandtotal: 165000,
									serviceFee: 2000,
									netIncome: 148000,
									etd: "2-3 hari",
									type: "reguler",
								},
							],
						},
					},
				},
			},
		},
	},
	responses: createApiResponse(CreateOrderSchema, "Berhasil membuat order baru"),
});

orderRegistry.registerPath({
	method: "put",
	path: "/orders/{id}",
	tags: ["Order"],
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({
			id: z.string().describe("ID order"),
		}),
		body: {
			content: {
				"application/json": {
					schema: UpdateOrderSchema,
					example: {
						order: {
							ordererCustomerId: "29d9f9d0-a35d-4ec1-af8c-6e514cade06c",
							deliveryTargetCustomerId: "e1ee8c68-feed-47fd-8a24-c0af38ac9f51",
							deliveryPlaceId: "da127630-ae9c-4678-b0f6-cdb51d645bfb",
							salesChannelId: "659a18d0-a4da-4103-a7bd-a81616cca889",
							orderDate: "2023-01-01T00:00:00.000Z",
							note: "Tolong kirim secepatnya",
						},
						orderDetail: {
							detail: {
								code: "ORD-004",
								originalFinalPrice: 1000,
								otherFees: {
									packaging: 5000,
									insurance: 10000,
									weight: 1000,
									productDiscount: [
										{
											produkVariantId: "0f027aee-6ed4-406e-8e70-1f951ecb66a0",
											discountAmount: 5000,
											discountType: "nominal",
										},
										{
											produkVariantId: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
											discountAmount: 10,
											discountType: "percent",
										},
									],
									installments: {
										paymentMethodId: "1598512d-0daa-45c1-bbeb-01855ebc1447",
										paymentDate: "2023-01-01T00:00:00.000Z",
										amount: 50000,
									},
									shippingCost: {
										shippingService: "JNE",
										cost: 1000,
										type: "reguler",
									},
									discount: {
										value: 10,
										type: "percent",
									},
								},
								receiptNumber: "JNE123456789",
							},
							paymentMethod: {
								id: "1598512d-0daa-45c1-bbeb-01855ebc1447",
								status: "PENDING",
								date: "2023-01-01T00:00:00.000Z",
							},
							orderProducts: [
								{
									productId: "0f11aa20-1f00-428d-9651-b226abfedae9",
									productVariantId: "0f027aee-6ed4-406e-8e70-1f951ecb66a0",
									productQty: 2,
								},
							],
							shippingServices: [
								{
									shippingName: "JNE",
									serviceName: "REG",
									weight: 1000,
									isCod: false,
									shippingCost: 15000,
									shippingCashback: 2000,
									shippingCostNet: 13000,
									grandtotal: 165000,
									serviceFee: 2000,
									netIncome: 148000,
									etd: "2-3 hari",
									type: "reguler",
								},
							],
						},
					},
				},
			},
		},
	},
	responses: createApiResponse(CreateOrderSchema, "Berhasil memperbarui order"),
});

orderRegistry.registerPath({
	method: "delete",
	path: "/orders/{id}",
	tags: ["Order"],
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({
			id: z.string().describe("ID order"),
		}),
	},
	responses: createApiResponse(z.object({ message: z.string() }), "Berhasil menghapus order"),
});

orderRegistry.registerPath({
	method: "patch",
	path: "/orders/{id}/cancel",
	tags: ["Order"],
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({
			id: z.string().describe("ID order"),
		}),
	},
	responses: createApiResponse(z.object({ message: z.string() }), "Berhasil menghapus order"),
});

orderRegistry.registerPath({
	method: "get",
	path: "/orders/export/excel",
	tags: ["Order"],
	security: [{ bearerAuth: [] }],
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

orderRegistry.registerPath({
	method: "post",
	path: "/orders/import/excel",
	tags: ["Order"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: z.object({
						orders_data: z.any().optional().describe("File Excel untuk diimpor"),
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

const orderController = new OrderController();

const upload = multer({ storage: multer.memoryStorage() });

orderRouter
	.route("/")
	.get(validateRequest(OrderQuerySchema), orderController.getAll)
	.post(validateRequest(CreateOrderSchema), orderController.create);
orderRouter
	.route("/:id")
	.get(validateRequest(OrderParamsSchema), orderController.getOne)
	.put(validateRequest(UpdateOrderSchema), orderController.update)
	.delete(validateRequest(OrderParamsSchema), orderController.delete);
orderRouter.route("/:id/cancel").patch(validateRequest(OrderParamsSchema), orderController.cancel);
orderRouter.route("/export/excel").get(orderController.exportOrders);
orderRouter.route("/import/excel").post(upload.single("orders_data"), orderController.importOrders);
