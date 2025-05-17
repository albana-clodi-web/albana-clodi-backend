import type { Order } from "@prisma/client";
import type { ProductPrice } from "../../api/product-price/productPriceModel";

export type OrderWithRelations = Order & {
	SalesChannel: { name: string | null } | null;
	DeliveryPlace: { name: string | null } | null;
	OrdererCustomer: { name: string | null; category: string | null } | null;
	DeliveryTargetCustomer: { name: string | null } | null;
	OrderDetail: {
		code: string;
		paymentStatus: string;
		paymentDate: Date | null;
		PaymentMethod: { name: string | null } | null;
		finalPrice: number;
		createdAt: Date;
		OrderProducts: Array<{
			productQty?: number;
			Product: {
				name: string;
				productVariants: Array<{
					sku?: string;
					productPrices: Array<ProductPrice>;
				}>;
			};
		}>;
		otherFees?: {
			total?: number;
			insurance?: number;
			discount?: {
				type: string;
				value: number;
			};
			weight?: number;
			packaging?: number;
			shippingCost?: { cost: number; type: string; shippingService: string };
		};
		receiptNumber?: string;
	} | null;
	ShippingServices: Array<{
		cost?: number;
		serviceName?: string;
		serviceType?: string;
	}>;
};
