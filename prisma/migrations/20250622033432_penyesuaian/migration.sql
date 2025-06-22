-- DropIndex
DROP INDEX "customers_category_idx";

-- DropIndex
DROP INDEX "customers_email_idx";

-- DropIndex
DROP INDEX "customers_phone_number_idx";

-- DropIndex
DROP INDEX "customers_status_idx";

-- DropIndex
DROP INDEX "product_variant_product_id_idx";

-- DropIndex
DROP INDEX "product_variant_sku_idx";

-- DropIndex
DROP INDEX "products_category_id_idx";

-- DropIndex
DROP INDEX "products_is_publish_idx";

-- DropIndex
DROP INDEX "products_name_idx";

-- CreateIndex
CREATE INDEX "customers_name_email_phone_number_idx" ON "customers"("name", "email", "phone_number");

-- CreateIndex
CREATE INDEX "customers_category_status_idx" ON "customers"("category", "status");

-- CreateIndex
CREATE INDEX "customers_province_city_district_village_idx" ON "customers"("province", "city", "district", "village");

-- CreateIndex
CREATE INDEX "customers_destination_id_idx" ON "customers"("destination_id");

-- CreateIndex
CREATE INDEX "customers_created_at_updated_at_idx" ON "customers"("created_at", "updated_at");

-- CreateIndex
CREATE INDEX "delivery_places_phone_number_idx" ON "delivery_places"("phone_number");

-- CreateIndex
CREATE INDEX "delivery_places_destination_id_idx" ON "delivery_places"("destination_id");

-- CreateIndex
CREATE INDEX "delivery_places_subdistrict_idx" ON "delivery_places"("subdistrict");

-- CreateIndex
CREATE INDEX "order_details_order_id_idx" ON "order_details"("order_id");

-- CreateIndex
CREATE INDEX "order_details_receipt_number_idx" ON "order_details"("receipt_number");

-- CreateIndex
CREATE INDEX "order_details_payment_date_idx" ON "order_details"("payment_date");

-- CreateIndex
CREATE INDEX "order_details_created_at_idx" ON "order_details"("created_at");

-- CreateIndex
CREATE INDEX "order_details_updated_at_idx" ON "order_details"("updated_at");

-- CreateIndex
CREATE INDEX "order_details_productId_idx" ON "order_details"("productId");

-- CreateIndex
CREATE INDEX "order_details_order_id_paymentStatus_idx" ON "order_details"("order_id", "paymentStatus");

-- CreateIndex
CREATE INDEX "order_details_order_id_payment_method_id_idx" ON "order_details"("order_id", "payment_method_id");

-- CreateIndex
CREATE INDEX "order_details_order_id_created_at_idx" ON "order_details"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_products_product_variant_id_idx" ON "order_products"("product_variant_id");

-- CreateIndex
CREATE INDEX "order_products_created_at_idx" ON "order_products"("created_at");

-- CreateIndex
CREATE INDEX "order_products_order_id_product_id_idx" ON "order_products"("order_id", "product_id");

-- CreateIndex
CREATE INDEX "order_products_order_id_order_detail_id_idx" ON "order_products"("order_id", "order_detail_id");

-- CreateIndex
CREATE INDEX "order_products_order_detail_id_product_id_idx" ON "order_products"("order_detail_id", "product_id");

-- CreateIndex
CREATE INDEX "orders_updated_at_idx" ON "orders"("updated_at");

-- CreateIndex
CREATE INDEX "orders_id_orderer_customer_id_delivery_target_customer_id_o_idx" ON "orders"("id", "orderer_customer_id", "delivery_target_customer_id", "order_date");

-- CreateIndex
CREATE INDEX "orders_id_sales_channel_id_order_date_idx" ON "orders"("id", "sales_channel_id", "order_date");

-- CreateIndex
CREATE INDEX "orders_id_created_at_updated_at_idx" ON "orders"("id", "created_at", "updated_at");

-- CreateIndex
CREATE INDEX "payment_methods_bank_name_idx" ON "payment_methods"("bank_name");

-- CreateIndex
CREATE INDEX "payment_methods_account_number_idx" ON "payment_methods"("account_number");

-- CreateIndex
CREATE INDEX "product_discounts_product_id_type_idx" ON "product_discounts"("product_id", "type");

-- CreateIndex
CREATE INDEX "product_discounts_startDate_endDate_idx" ON "product_discounts"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "product_prices_normal_buy_reseller_agent_member_idx" ON "product_prices"("normal", "buy", "reseller", "agent", "member");

-- CreateIndex
CREATE INDEX "product_variant_product_id_sku_idx" ON "product_variant"("product_id", "sku");

-- CreateIndex
CREATE INDEX "product_variant_stock_size_color_idx" ON "product_variant"("stock", "size", "color");

-- CreateIndex
CREATE INDEX "product_variant_created_at_updated_at_idx" ON "product_variant"("created_at", "updated_at");

-- CreateIndex
CREATE INDEX "products_category_id_name_is_publish_idx" ON "products"("category_id", "name", "is_publish");

-- CreateIndex
CREATE INDEX "products_type_is_publish_idx" ON "products"("type", "is_publish");

-- CreateIndex
CREATE INDEX "products_created_at_updated_at_idx" ON "products"("created_at", "updated_at");

-- CreateIndex
CREATE INDEX "shipping_services_is_cod_idx" ON "shipping_services"("is_cod");

-- CreateIndex
CREATE INDEX "shipping_services_created_at_idx" ON "shipping_services"("created_at");

-- CreateIndex
CREATE INDEX "shipping_services_order_id_shipping_name_idx" ON "shipping_services"("order_id", "shipping_name");

-- CreateIndex
CREATE INDEX "shipping_services_order_id_type_idx" ON "shipping_services"("order_id", "type");
