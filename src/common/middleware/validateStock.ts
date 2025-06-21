import type { CreateProductType, UpdateProductType } from "@/api/product/productModel";
import prismaClient from "@/config/prisma";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { NIL } from "uuid";
import { ZodSchema } from "zod";
import { Roles } from "../../../generated/prisma";
import { ServiceResponse } from "../models/serviceResponse";
import type { AuthRequest } from "../types/auth";

export const validateStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { productVariants } = req.body as UpdateProductType;
		const userRole = req.user?.role;

		if (userRole === Roles.ADMIN) {
			const ids = productVariants?.map((v) => v.id);
			const foundVariants = await prismaClient.productVariant.findMany({
				where: { id: { in: ids } },
			});
			const variantMap = new Map(foundVariants.map((v) => [v.id, v]));

			for (const variant of productVariants ?? []) {
				const foundVariant = variantMap.get(variant.id);

				if (!foundVariant) {
					res
						.status(StatusCodes.NOT_FOUND)
						.json(ServiceResponse.failure("Variant not found", { variant_id: variant.id }, StatusCodes.NOT_FOUND));
					return;
				}

				if (foundVariant?.stock !== null && foundVariant?.stock > variant.stock) {
					res.status(StatusCodes.BAD_REQUEST).json(
						ServiceResponse.failure(
							"Insufficient stock",
							{
								variant_id: variant.id,
								available_stock: foundVariant.stock,
								requested_stock: variant.stock,
							},
							StatusCodes.BAD_REQUEST,
						),
					);
					return;
				}
			}
		}

		next();
	} catch (error) {
		res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json(
				ServiceResponse.failure(
					"An error occurred while validating stock",
					String(error),
					StatusCodes.INTERNAL_SERVER_ERROR,
				),
			);
		return;
	}
};
