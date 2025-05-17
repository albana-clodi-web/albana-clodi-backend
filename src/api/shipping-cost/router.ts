import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Request, type Response, type Router } from "express";
import { z } from "zod";
import { ShippingCostController } from "./controller";
import { ShippingCostParamsSchema, ShippingCostSchema } from "./model";

export const shippingCostRegistry = new OpenAPIRegistry();
export const shippingCostRouter: Router = express.Router();

shippingCostRegistry.register("ShippingCost", ShippingCostSchema);

shippingCostRegistry.registerPath({
	method: "get",
	path: "/shipping-cost",
	tags: ["ShippingCost"],
	request: {
		query: z.object({
			shipper_destination_id: z.number().int().describe("ID destinasi pengirim, hasil dari destination_id"),
			receiver_destination_id: z.number().int().describe("ID destinasi penerima, hasil dari destination_id"),
			weight: z.number().describe("Berat dalam Kilogram, gunakan titik(.) untuk nilai desimal"),
			item_value: z.number().int().describe("Nilai paket dalam Rupiah"),
			cod: z.boolean().describe("Metode pengiriman COD (ya/tidak)"),
		}),
	},
	responses: createApiResponse(
		z.object({
			calculate_reguler: z.array(
				z.object({
					shipping_name: z.string(),
					service_name: z.string(),
					weight: z.number(),
					is_cod: z.boolean(),
					shipping_cost: z.number(),
					shipping_cashback: z.number(),
					shipping_cost_net: z.number(),
					grandtotal: z.number(),
					service_fee: z.number(),
					net_income: z.number(),
					etd: z.string(),
				}),
			),
			calculate_cargo: z.array(
				z.object({
					shipping_name: z.string(),
					service_name: z.string(),
					weight: z.number(),
					is_cod: z.boolean(),
					shipping_cost: z.number(),
					shipping_cashback: z.number(),
					shipping_cost_net: z.number(),
					grandtotal: z.number(),
					service_fee: z.number(),
					net_income: z.number(),
					etd: z.string(),
				}),
			),
			calculate_instant: z.array(
				z
					.object({
						shipping_name: z.string(),
						service_name: z.string(),
						weight: z.number(),
						is_cod: z.boolean(),
						shipping_cost: z.number(),
						shipping_cashback: z.number(),
						shipping_cost_net: z.number(),
						grandtotal: z.number(),
						service_fee: z.number(),
						net_income: z.number(),
						etd: z.string(),
					})
					.optional(),
			),
		}),
		"Berhasil menghitung biaya pengiriman",
	),
});

const shippingCostController = new ShippingCostController();

shippingCostRouter.route("/calculate").get(validateRequest(ShippingCostParamsSchema), shippingCostController.calculate);
