import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { authRegistry } from "@/api/auth/route";
import { deliveryPlaceRegistry } from "@/api/delivery-place/router";
import { expensesRegistry } from "@/api/expenses/router";
import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter";
import { locationRegistry } from "@/api/location/router";
import { orderRegistry } from "@/api/order/router";
import { productRegistry } from "@/api/product/productRouter";
import { regionRegistry } from "@/api/region/regionRouter";
import { shippingCostRegistry } from "@/api/shipping-cost/router";
import { userRegistry } from "@/api/user/userRouter";

export type OpenAPIDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

export function generateOpenAPIDocument(): OpenAPIDocument {
	const registry = new OpenAPIRegistry([
		authRegistry,
		healthCheckRegistry,
		userRegistry,
		expensesRegistry,
		productRegistry,
		locationRegistry,
		shippingCostRegistry,
		deliveryPlaceRegistry,
		orderRegistry,
		regionRegistry,
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
		security: [
			{
				bearerAuth: [],
			},
		],
	});

	if (!documents.components) {
		documents.components = {};
	}

	if (!documents.components.securitySchemes) {
		// Pastikan securitySchemes ada
		documents.components.securitySchemes = {};
	}

	// Tambahkan definisi bearerAuth ke securitySchemes
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
