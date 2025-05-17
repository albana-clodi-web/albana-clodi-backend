/*
  Warnings:

  - You are about to drop the column `product_id` on the `order_details` table. All the data in the column will be lost.
  - You are about to drop the column `product_qty` on the `order_details` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_service_id` on the `order_details` table. All the data in the column will be lost.
  - You are about to drop the column `order_detail_id` on the `shipping_services` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[order_id]` on the table `order_details` will be added. If there are existing duplicate values, this will fail.
  - Made the column `order_id` on table `order_details` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `order_id` to the `shipping_services` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "order_details" DROP CONSTRAINT "order_details_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_details" DROP CONSTRAINT "order_details_product_id_fkey";

-- DropForeignKey
ALTER TABLE "order_details" DROP CONSTRAINT "order_details_shipping_service_id_fkey";

-- DropIndex
DROP INDEX "order_details_product_id_idx";

-- AlterTable
ALTER TABLE "order_details" DROP COLUMN "product_id",
DROP COLUMN "product_qty",
DROP COLUMN "shipping_service_id",
ADD COLUMN     "productId" UUID,
ALTER COLUMN "order_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "shipping_services" DROP COLUMN "order_detail_id",
ADD COLUMN     "order_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "order_products" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_products_order_id_idx" ON "order_products"("order_id");

-- CreateIndex
CREATE INDEX "order_products_product_id_idx" ON "order_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_details_order_id_key" ON "order_details"("order_id");

-- CreateIndex
CREATE INDEX "shipping_services_order_id_idx" ON "shipping_services"("order_id");

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_products" ADD CONSTRAINT "order_products_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_products" ADD CONSTRAINT "order_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_services" ADD CONSTRAINT "shipping_services_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
