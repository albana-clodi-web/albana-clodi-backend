import { ServiceResponse } from "@/common/models/serviceResponse";
import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OrderQueryType } from "./model";
import { orderService } from "./service";

export class OrderController {
	public getAll: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await orderService.getAll(req.query as OrderQueryType["query"]);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getOne: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const serviceResponse = await orderService.getOne(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public create: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await orderService.create(req.body);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public update: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const serviceResponse = await orderService.update(id, req.body);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public delete: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const serviceResponse = await orderService.delete(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public exportOrders: RequestHandler = async (req: Request, res: Response) => {
		const { startDate, endDate, month, year, week } = req.query;

		const serviceResponse = await orderService.exportOrders({
			startDate: startDate as string,
			endDate: endDate as string,
			month: month as string,
			year: year as string,
			week: week as string,
		});

		if (serviceResponse.success) {
			res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
			res.setHeader("Content-Disposition", `attachment; filename=${serviceResponse.responseObject?.fileName}`);
			res.status(serviceResponse.statusCode).send(serviceResponse.responseObject?.buffer);
		} else {
			res.status(serviceResponse.statusCode).send(serviceResponse);
		}
	};

	public importOrders: RequestHandler = async (req: Request, res: Response) => {
		const multerFile = req.file as Express.Multer.File;

		if (!multerFile) {
			res
				.status(StatusCodes.BAD_REQUEST)
				.send(ServiceResponse.failure("File tidak ditemukan", null, StatusCodes.BAD_REQUEST));
			return;
		}

		const serviceResponse = await orderService.importOrders(multerFile.buffer);

		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}
