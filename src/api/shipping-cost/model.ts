import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const ShippingCostSchema = z.object({
	shipper_destination_id: z.string().regex(/^\d+$/).describe("ID destinasi pengirim, hasil dari destination_id"),
	receiver_destination_id: z.string().regex(/^\d+$/).describe("ID destinasi penerima, hasil dari destination_id"),
	weight: z
		.string()
		.regex(/^\d+(\.\d+)?$/)
		.describe("Berat dalam Kilogram, gunakan titik(.) untuk nilai desimal"),
	item_value: z
		.string({
			message: "Harga barang dalam format angka",
		})
		.regex(/^\d+$/)
		.describe("Nilai paket dalam Rupiah"),
	cod: z.enum(["yes", "no"]).describe("Metode pengiriman COD (yes/no)"),
});

export type ShippingCost = z.infer<typeof ShippingCostSchema>;

// Schema untuk params shipping cost
export const ShippingCostParamsSchema = z.object({
	query: ShippingCostSchema,
});
export type ShippingCostParamsType = z.infer<typeof ShippingCostParamsSchema>;
