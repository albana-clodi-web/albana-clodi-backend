import { ServiceResponse } from "@/common/models/serviceResponse";
import prismaClient from "@/config/prisma";
import { StatusCodes } from "http-status-codes";
import type { CreatePaymentMethodType, UpdatePaymentMethodType } from "./paymentMethodModel";

class PaymentMethodService {
	public getAllPayments = async () => {
		try {
			const payments = await prismaClient.paymentMethod.findMany();

			return ServiceResponse.success("Payment methods retrieved successfully", payments, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error get all payments: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while get all payments.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public getDetailPayment = async (paymentMethodId: string) => {
		try {
			const foundPayment = await prismaClient.paymentMethod.findUnique({ where: { id: paymentMethodId } });
			if (!foundPayment) {
				return ServiceResponse.failure("Payment method not found", null, StatusCodes.NOT_FOUND);
			}

			return ServiceResponse.success("Payment method retrieved successfully", foundPayment, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error get detail payments: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while get detail payments.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public createPayment = async (req: CreatePaymentMethodType) => {
		try {
			const foundPaymentMethod = await prismaClient.paymentMethod.findFirst({
				where: {
					OR: [
						{
							name: req.name,
						},
						{
							accountNumber: req.accountNumber,
						},
					],
				},
			});
			if (foundPaymentMethod) {
				return ServiceResponse.failure("Payment method already exist", null, StatusCodes.BAD_REQUEST);
			}

			await prismaClient.paymentMethod.create({ data: req });

			return ServiceResponse.success("Payment method created successfully", null, StatusCodes.CREATED);
		} catch (ex) {
			const errorMessage = `Error create payments: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while create payments.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public updatePayment = async (paymentMethodId: string, req: UpdatePaymentMethodType) => {
		try {
			const foundPayment = await prismaClient.paymentMethod.findUnique({ where: { id: paymentMethodId } });
			if (!foundPayment) {
				return ServiceResponse.failure("Payment method not found", null, StatusCodes.NOT_FOUND);
			}

			await prismaClient.paymentMethod.update({
				where: { id: paymentMethodId },
				data: req,
			});

			return ServiceResponse.success("Payment method updated successfully", null, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error update payments: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while update payments.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public deletePayment = async (paymentMethodId: string) => {
		try {
			const foundPayment = await prismaClient.paymentMethod.findUnique({ where: { id: paymentMethodId } });
			if (!foundPayment) {
				return ServiceResponse.failure("Payment method not found", null, StatusCodes.NOT_FOUND);
			}

			await prismaClient.paymentMethod.delete({ where: { id: paymentMethodId } });

			return ServiceResponse.success("Payment method deleted successfully", null, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error update payments: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while update payments.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};
}

export const paymentMethodService = new PaymentMethodService();
