import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { authRegistry } from "@/api/auth/route";
import { categoryRegistry } from "@/api/category/categoryRouter";
import { customerRegistry } from "@/api/customer/customerRouter";
import { deliveryPlaceRegistry } from "@/api/delivery-place/router";
import { expensesRegistry } from "@/api/expenses/router";
import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter";
import { orderRegistry } from "@/api/order/router";
import { paymentMethodRegistry } from "@/api/payment-method/paymentMethodRouter";
import { productRegistry } from "@/api/product/productRouter";
import { receiptRegistry } from "@/api/receipt/router";
import { regionRegistry } from "@/api/region/regionRouter";
import { reportRegistry } from "@/api/report/router";
import { salesChannelRegistry } from "@/api/sales-channel/salesChannelRouter";
import { shippingCostRegistry } from "@/api/shipping-cost/router";
import { shopRegistry } from "@/api/shop/route";

export type OpenAPIDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

export function generateOpenAPIDocument(): OpenAPIDocument {
	const registry = new OpenAPIRegistry([
		authRegistry,
		healthCheckRegistry,
		expensesRegistry,
		productRegistry,
		shippingCostRegistry,
		deliveryPlaceRegistry,
		orderRegistry,
		regionRegistry,
		reportRegistry,
		receiptRegistry,
		paymentMethodRegistry,
		salesChannelRegistry,
		categoryRegistry,
		shopRegistry,
		customerRegistry,
	]);
	const generator = new OpenApiGeneratorV3(registry.definitions);

	const documents = generator.generateDocument({
		openapi: "3.0.0",
		info: {
			version: "1.0.0",
			title: "Swagger API",
			description: "API Documentation untuk Sistem Manajemen",
		},
		externalDocs: {
			description: "Lihat Spesifikasi OpenAPI mentah dalam format JSON",
			url: "/swagger.json",
		},
		// Tidak menerapkan security global, hanya pada endpoint yang memerlukan autentikasi
	});

	if (!documents.components) {
		documents.components = {};
	}

	if (!documents.components.securitySchemes) {
		documents.components.securitySchemes = {};
	}

	documents.components.securitySchemes = {
		...documents.components.securitySchemes,
		bearerAuth: {
			type: "http" as const,
			scheme: "bearer",
			bearerFormat: "JWT",
			description: "Masukkan token JWT Bearer Anda",
		},
	};

	return documents;
}
