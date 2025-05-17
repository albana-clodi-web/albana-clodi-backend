/*
  Warnings:

  - You are about to drop the column `productId` on the `order_details` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_details" DROP CONSTRAINT "order_details_productId_fkey";

-- DropForeignKey
ALTER TABLE "order_products" DROP CONSTRAINT "order_products_order_id_fkey";

-- AlterTable
ALTER TABLE "order_details" DROP COLUMN "productId";

-- AlterTable
ALTER TABLE "order_products" ADD COLUMN     "order_detail_id" UUID;

-- CreateIndex
CREATE INDEX "order_products_order_detail_id_idx" ON "order_products"("order_detail_id");

-- AddForeignKey
ALTER TABLE "order_products" ADD CONSTRAINT "order_products_order_detail_id_fkey" FOREIGN KEY ("order_detail_id") REFERENCES "order_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
