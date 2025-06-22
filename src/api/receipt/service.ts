import { ServiceResponse } from "@/common/models/serviceResponse";
import { prismaClient } from "@/config/prisma";
import { logger } from "@/server";
import { StatusCodes } from "http-status-codes";
import type { CustomerCategories } from "../../../generated/prisma";

interface IReceiptParams {
	order_id?: string;
}

class ReportService {
	public getReceipt = async (params: IReceiptParams) => {
		try {
			// Validasi parameter order_id
			if (!params.order_id) {
				return ServiceResponse.failure("Parameter order_id diperlukan", null, StatusCodes.BAD_REQUEST);
			}

			try {
				// Ambil data order berdasarkan ID
				const order = await prismaClient().order.findUnique({
					where: {
						id: params.order_id,
					},
					include: {
						OrderDetail: {
							include: {
								OrderProducts: {
									include: {
										Product: {
											include: {
												productVariants: {
													include: {
														productPrices: true,
													},
												},
											},
										},
									},
								},
								PaymentMethod: true,
							},
						},
						SalesChannel: true,
						DeliveryPlace: true,
						OrdererCustomer: true,
						DeliveryTargetCustomer: true,
						ShippingServices: true,
					},
				});

				if (!order) {
					return ServiceResponse.failure("Order tidak ditemukan", null, StatusCodes.NOT_FOUND);
				}

				// Menghitung total item dan total harga untuk order ini
				let orderTotalItems = 0;
				let orderTotalPrice = 0;

				const products =
					order.OrderDetail?.OrderProducts.map((orderProduct) => {
						orderTotalItems += orderProduct.productQty;

						// Mendapatkan harga berdasarkan jenis pelanggan
						let productPrice = 0;
						const customerType = order.DeliveryTargetCustomer?.category || "CUSTOMER";
						const productPrices = orderProduct.Product.productVariants[0].productPrices[0];

						switch (customerType) {
							case "CUSTOMER":
							case "DROPSHIPPER":
								productPrice = productPrices.normal || 0;
								break;
							case "MEMBER":
								productPrice = productPrices.member || productPrices.normal || 0;
								break;
							case "RESELLER":
								productPrice = productPrices.reseller || productPrices.normal || 0;
								break;
							case "AGENT":
								productPrice = productPrices.agent || productPrices.normal || 0;
								break;
							default:
								productPrice = productPrices.normal || 0;
						}

						orderTotalPrice += productPrice * orderProduct.productQty;

						return {
							product_name: orderProduct.Product?.name || "Tidak ada nama",
							product_qty: orderProduct.productQty,
							product_price: productPrice,
							product_total: productPrice * orderProduct.productQty,
							product_barcode: orderProduct.Product?.productVariants[0].barcode || "Tidak ada barcode",
							product_variants: orderProduct.Product?.productVariants || [],
							price_type: customerType.toLowerCase(),
						};
					}) || [];

				// Mengekstrak informasi biaya lainnya
				let insuranceFee = 0;
				let packagingFee = 0;
				let shippingCost = 0;
				let shippingName = "";
				let shippingType = "";
				let shippingService = "";
				let installmentInfo = null;
				let productDiscount = null;
				let weight = 0;
				const discount = {
					type: "",
					value: 0,
					persen: 0,
					nominal: 0,
				};

				if (order.OrderDetail?.otherFees && typeof order.OrderDetail.otherFees === "object") {
					const otherFees = order.OrderDetail.otherFees;

					if ("insurance" in otherFees && typeof otherFees.insurance === "number") {
						insuranceFee = otherFees.insurance;
					}

					if ("packaging" in otherFees && typeof otherFees.packaging === "number") {
						packagingFee = otherFees.packaging;
					}

					if ("weight" in otherFees && typeof otherFees.weight === "number") {
						weight = otherFees.weight;
					}

					if ("discount" in otherFees && typeof otherFees.discount === "object" && otherFees.discount !== null) {
						if ("type" in otherFees.discount && typeof otherFees.discount.type === "string") {
							discount.type = otherFees.discount.type;
						}
						if ("value" in otherFees.discount && typeof otherFees.discount.value === "number") {
							discount.value = otherFees.discount.value;

							// Hitung nominal discount berdasarkan tipe
							if (discount.type === "percentage" || discount.type === "percent") {
								discount.persen = discount.value;
								discount.nominal = ((order.OrderDetail?.finalPrice || 0) * discount.value) / 100;
							} else if (discount.type === "fixed") {
								discount.nominal = discount.value;
								const finalPrice = order.OrderDetail?.finalPrice || 0;
								discount.persen = finalPrice > 0 ? (discount.value / finalPrice) * 100 : 0;
							}
						}
					}

					if (
						"installments" in otherFees &&
						typeof otherFees.installments === "object" &&
						otherFees.installments !== null
					) {
						installmentInfo = {
							paymentMethodId:
								"paymentMethodId" in otherFees.installments ? otherFees.installments.paymentMethodId || "" : "",
							paymentDate: "paymentDate" in otherFees.installments ? otherFees.installments.paymentDate || "" : "",
							amount: "amount" in otherFees.installments ? otherFees.installments.amount || 0 : 0,
						};
					}

					// Proses product discount jika ada
					if (
						"productDiscount" in otherFees &&
						Array.isArray(otherFees.productDiscount) &&
						otherFees.productDiscount.length > 0
					) {
						// Proses setiap diskon produk
						const productDiscounts = otherFees.productDiscount.map((discount) => {
							const discountObj = typeof discount === "object" && discount !== null ? discount : {};
							return {
								produkVariantId: "produkVariantId" in discountObj ? discountObj.produkVariantId : "",
								discountAmount: "discountAmount" in discountObj ? discountObj.discountAmount : 0,
								discountType: "discountType" in discountObj ? discountObj.discountType : "nominal",
							};
						});

						// Tambahkan informasi diskon produk ke produk yang sesuai
						productDiscount = products.map((product) => {
							const productVariantId = product?.product_variants?.[0]?.id;
							const matchingDiscount = productDiscounts.find(
								(discount) => discount.produkVariantId === productVariantId,
							);

							const updatedProduct = { ...product };
							if (matchingDiscount && updatedProduct) {
								// biome-ignore lint/suspicious/noExplicitAny: <explanation>
								(updatedProduct as any).discount = {
									amount: matchingDiscount.discountAmount,
									type: matchingDiscount.discountType,
								};

								// Hitung nominal diskon jika tipe persentase
								if (matchingDiscount.discountType === "percent" || matchingDiscount.discountType === "percentage") {
									const productPrice = updatedProduct.product_price || 0;
									// biome-ignore lint/suspicious/noExplicitAny: <explanation>
									(updatedProduct as any).discountNominal =
										(productPrice * Number(matchingDiscount?.discountAmount)) / 100;
								} else {
									// biome-ignore lint/suspicious/noExplicitAny: <explanation>
									(updatedProduct as any).discountNominal = matchingDiscount.discountAmount;
								}
							}

							return updatedProduct;
						});
					}

					if (
						"shippingCost" in otherFees &&
						typeof otherFees.shippingCost === "object" &&
						otherFees.shippingCost !== null
					) {
						if ("cost" in otherFees.shippingCost && typeof otherFees.shippingCost.cost === "number") {
							shippingCost = otherFees.shippingCost.cost;
						}

						if ("type" in otherFees.shippingCost && typeof otherFees.shippingCost.type === "string") {
							shippingType = otherFees.shippingCost.type;
						}

						if (
							"shippingService" in otherFees.shippingCost &&
							typeof otherFees.shippingCost.shippingService === "string"
						) {
							shippingService = otherFees.shippingCost.shippingService;
						}

						// Untuk kompatibilitas dengan kode lama
						if ("name" in otherFees.shippingCost && typeof otherFees.shippingCost.name === "string") {
							shippingName = otherFees.shippingCost.name;
						} else {
							shippingName = `${shippingService} ${shippingType}`.trim();
						}
					}
				}

				const receiptData = {
					order_id: order.id,
					order_code: order.OrderDetail?.code || "Tidak ada kode",
					admin_name: order.OrdererCustomer?.name || "Tidak ada nama admin",
					order_date: order.createdAt,
					tracking_number: order.OrderDetail?.receiptNumber || "Tidak ada nomor resi",
					payment_status: order.OrderDetail?.paymentStatus || "UNKNOWN",
					payment_method: order.OrderDetail?.PaymentMethod?.name || "Tidak ada metode pembayaran",
					products: products,
					total_items: orderTotalItems,
					total_product_price: orderTotalPrice,
					final_price: order.OrderDetail?.finalPrice || 0,
					notes: order.note || "",
					weight: weight,
					discount: discount,
					productDiscount: productDiscount,
					installments: installmentInfo,
					insurance_fee: insuranceFee,
					packaging_fee: packagingFee,
					shipping_cost: shippingCost,
					shipping_name: shippingName,
					shipping_type: shippingType,
					shipping_service: shippingService,
					sales_channel: order.SalesChannel?.name || "Tidak ada channel",
					delivery_place: order.DeliveryPlace?.name || "Tidak ada tempat",
					delivery_target: order.DeliveryTargetCustomer?.name || "Tidak ada target",
					customer_type: order.DeliveryTargetCustomer?.category || "CUSTOMER",
					customer_info: {
						name: order.DeliveryTargetCustomer?.name || "Tidak ada nama",
						address: order.DeliveryTargetCustomer?.address || "Tidak ada alamat",
						phone: order.DeliveryTargetCustomer?.phoneNumber || "Tidak ada nomor telepon",
						email: order.DeliveryTargetCustomer?.email || "Tidak ada email",
					},
					dropship_info: (() => {
						const isDropshipper = order.OrdererCustomer?.category === ("DROPSHIPPER" as CustomerCategories);
						return {
							sender: {
								name: isDropshipper ? order.OrdererCustomer?.name || "Tidak ada nama" : "",
								address: isDropshipper ? order.OrdererCustomer?.address || "Tidak ada alamat" : "",
								phone: isDropshipper ? order.OrdererCustomer?.phoneNumber || "Tidak ada nomor telepon" : "",
							},
							recipient: {
								name: isDropshipper ? order.DeliveryTargetCustomer?.name || "Tidak ada nama" : "",
								address: isDropshipper ? order.DeliveryTargetCustomer?.address || "Tidak ada alamat" : "",
								phone: isDropshipper ? order.DeliveryTargetCustomer?.phoneNumber || "Tidak ada nomor telepon" : "",
							},
						};
					})(),
				};

				return ServiceResponse.success("Berhasil mendapatkan data receipt", receiptData, StatusCodes.OK);
			} catch (error) {
				logger.error(error);
				return ServiceResponse.failure("Gagal mendapatkan data receipt", null, StatusCodes.INTERNAL_SERVER_ERROR);
			}
		} catch (error) {
			logger.error(error);
			return ServiceResponse.failure("Gagal mendapatkan report orders", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	};
}

export const reportService = new ReportService();
