import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { StatusCodes } from "http-status-codes";

class ShippingCostService {
	public checkShippingCost = async (
		shipper_destination_id: number,
		receiver_destination_id: number,
		weight: number,
		item_value: number,
		cod: string,
	) => {
		try {
			const API_KEY = process.env.RAJAONGKIR_SHIPPING_DELIVERY_API_KEY;
			const BASE_URL = process.env.RAJAONGKIR_BASE_URL;

			const queryParams = new URLSearchParams({
				shipper_destination_id: shipper_destination_id.toString(),
				receiver_destination_id: receiver_destination_id.toString(),
				weight: weight.toString(),
				item_value: item_value.toString(),
				cod: cod || "no",
			});

			console.log(`URL: ${BASE_URL}/calculate?${queryParams.toString()}`);

			const response = await fetch(`${BASE_URL}/calculate?${queryParams.toString()}`, {
				method: "GET",
				headers: {
					"x-api-key": API_KEY as string,
				},
			});
			const data = await response.json();
			console.log(data);
			if (data.meta && data.meta.code !== 200) {
				return ServiceResponse.failure(data.rajaongkir.status.description, null, StatusCodes.BAD_REQUEST);
			}

			return ServiceResponse.success("Successfully calculated shipping cost", data.data, StatusCodes.OK);
		} catch (error) {
			logger.error(error);
			return ServiceResponse.failure("Failed to calculate shipping cost", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	};
}

export const shippingCostService = new ShippingCostService();
