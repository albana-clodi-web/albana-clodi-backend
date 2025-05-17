import type { Request, RequestHandler, Response } from "express";
import { shippingCostService } from "./service";

export class ShippingCostController {
	public calculate: RequestHandler = async (req: Request, res: Response) => {
		const { shipper_destination_id, receiver_destination_id, weight, item_value, cod } = req.query;
		const serviceResponse = await shippingCostService.checkShippingCost(
			Number(shipper_destination_id),
			Number(receiver_destination_id),
			Number(weight),
			Number(item_value),
			cod as string,
		);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}
