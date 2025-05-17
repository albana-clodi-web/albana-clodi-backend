import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { userRouter } from "@/api/user/userRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { authRouter } from "./api/auth/route";
import { customerRouter } from "./api/customer/customerRouter";
import { deliveryPlaceRouter } from "./api/delivery-place/router";
import { expensesRouter } from "./api/expenses/router";
import { orderRouter } from "./api/order/router";
import { paymentMethodRouter } from "./api/payment-method/paymentMethodRouter";
import { productRouter } from "./api/product/productRouter";
import { regionRouter } from "./api/region/regionRouter";
import { salesChannelRouter } from "./api/sales-channel/salesChannelRouter";
import { shippingCostRouter } from "./api/shipping-cost/router";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/users", userRouter);
app.use("/expenses", expensesRouter);
app.use("/products", productRouter);
app.use("/delivery-places", deliveryPlaceRouter);
app.use("/orders", orderRouter);
app.use("/regions", regionRouter);
app.use("/customers", customerRouter);
app.use("/payments", paymentMethodRouter);
app.use("/sales-channels", salesChannelRouter);
app.use("/shipping-cost", shippingCostRouter);
app.use("/auth", authRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
