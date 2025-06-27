import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

	HOST: z.string().min(1).default("localhost"),

	DATABASE_POOL_URL: z
		.string()
		.min(1)
		.default(
			"postgres://u9eccddcet7i6r:p911cff8dcb80cc5dea02661abf810f7d5abdc1c06cfbf2f3ae6ced2b89ba57fb@cd1goc44htrmfn.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d8ked3ho6dj87b?pgbouncer=true",
		),

	PORT: z.coerce.number().int().positive().default(8080),

	CORS_ORIGIN: z.string().default("http://localhost:8080,http:/localhost:3000,http://localhost:3001"),

	COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),

	COMMON_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1000),

	// AWS CloudCube variables
	CLOUDCUBE_BUCKET: z.string().min(1),

	CLOUDCUBE_URL: z.string().url(),

	CLOUDCUBE_REGION: z.string().min(1),

	CLOUDCUBE_ACCESS_KEY: z.string().min(1),

	CLOUDCUBE_SECRET_KEY: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("❌ Invalid environment variables:", parsedEnv.error.format());
	throw new Error("Invalid environment variables");
}

export const env = {
	...parsedEnv.data,
	isDevelopment: parsedEnv.data.NODE_ENV === "development",
	isProduction: parsedEnv.data.NODE_ENV === "production",
	isTest: parsedEnv.data.NODE_ENV === "test",
	DATABASE_POOL_URL: parsedEnv.data.DATABASE_POOL_URL,
};
