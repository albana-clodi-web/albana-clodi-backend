import { ServiceResponse } from "@/common/models/serviceResponse";
import { prismaClient } from "@/config/prisma";
import { StatusCodes } from "http-status-codes";
import type { CreateSalesChannelType, UpdateSalesChannelType } from "./salesChannelModel";

class SalesChannelService {
	public getAllSalesChannel = async () => {
		try {
			const foundSalesChannels = await prismaClient().salesChannel.findMany();

			return ServiceResponse.success("Sales channels retrieved successfully", foundSalesChannels, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error get all sales channel: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while get all sales channel.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public getDetailSalesChannel = async (salesChannelId: string) => {
		try {
			const foundSalesChannel = await prismaClient().salesChannel.findFirst({
				where: {
					id: salesChannelId,
				},
			});
			if (!foundSalesChannel) {
				return ServiceResponse.failure("Sales channel not found", null, StatusCodes.NOT_FOUND);
			}

			return ServiceResponse.success("Sales channel retrieved successfully", foundSalesChannel, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error get all sales channel: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while get all sales channel.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public createSalesChannel = async (req: CreateSalesChannelType) => {
		try {
			const foundSalesChannel = await prismaClient().salesChannel.findFirst({
				where: {
					name: req.name,
				},
			});
			if (foundSalesChannel) {
				return ServiceResponse.failure("Sales channel already exist", null, StatusCodes.BAD_REQUEST);
			}

			await prismaClient().salesChannel.create({ data: req });

			return ServiceResponse.success("Sales channel created successfully", null, StatusCodes.CREATED);
		} catch (ex) {
			const errorMessage = `Error create SalesChannel: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while create SalesChannel.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public updateSalesChannel = async (salesChannelId: string, req: UpdateSalesChannelType) => {
		try {
			const foundSalesChannel = await prismaClient().salesChannel.findFirst({
				where: {
					id: salesChannelId,
				},
			});
			if (!foundSalesChannel) {
				return ServiceResponse.failure("Sales channel not found", null, StatusCodes.NOT_FOUND);
			}

			await prismaClient().salesChannel.update({ where: { id: salesChannelId }, data: req });

			return ServiceResponse.success("Sales channel updated successfully", null, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error create SalesChannel: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while create SalesChannel.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public deleteSalesChannel = async (salesChannelId: string) => {
		try {
			const foundSalesChannel = await prismaClient().salesChannel.findFirst({
				where: {
					id: salesChannelId,
				},
			});
			if (!foundSalesChannel) {
				return ServiceResponse.failure("Sales channel not found", null, StatusCodes.NOT_FOUND);
			}

			await prismaClient().salesChannel.delete({ where: { id: salesChannelId } });

			return ServiceResponse.success("Sales channel deleted successfully", null, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error create SalesChannel: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while create SalesChannel.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};
}

export const salesChannelService = new SalesChannelService();
