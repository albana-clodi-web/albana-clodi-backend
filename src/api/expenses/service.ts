import { ServiceResponse } from "@/common/models/serviceResponse";
import { exportData } from "@/common/utils/dataExporter";
import { importData } from "@/common/utils/dataImporter";
import { logger } from "@/server";
import type { Expense, Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import type { CreateExpensesType, UpdateExpensesType } from "./model";
import { type ExpenseRepository, expenseRepository } from "./repository";

interface GetAllExpensesParams {
	startDate?: string;
	endDate?: string;
	month?: string;
	year?: string;
	week?: string;
	keyword?: string;
}

class ExpenseService {
	private readonly expenseRepo: ExpenseRepository;

	constructor() {
		this.expenseRepo = expenseRepository;
	}

	public createExpense = async (data: CreateExpensesType["body"]) => {
		try {
			const itemPrice = data?.itemPrice || 0;
			const qty = data?.qty || 0;
			const totalPrice = itemPrice * qty;
			const expenseDate = data.expenseDate ? new Date(data.expenseDate) : undefined;

			const result = await this.expenseRepo.client.expense.create({
				data: {
					...data,
					expenseDate,
					totalPrice,
				},
			});

			return ServiceResponse.success("Berhasil menambahkan data pengeluaran", result, StatusCodes.CREATED);
		} catch (error) {
			logger.error(error);
			return ServiceResponse.failure("Gagal menambahkan data pengeluaran", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	};

	public updateExpense = async (id: string, data: Partial<UpdateExpensesType["body"]>) => {
		try {
			const itemPrice = data?.itemPrice || 0;
			const qty = data?.qty || 0;
			const totalPrice = itemPrice * qty;
			const expenseDate = data.expenseDate ? new Date(data.expenseDate) : undefined;

			const updatedExpense = await this.expenseRepo.client.expense.update({
				where: { id },
				data: {
					...data,
					expenseDate,
					totalPrice,
					updatedAt: new Date(),
				},
			});

			return ServiceResponse.success("Berhasil mengubah data pengeluaran", updatedExpense, StatusCodes.OK);
		} catch (error) {
			logger.error(error);
			return ServiceResponse.failure("Gagal mengubah data pengeluaran", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	};

	public deleteExpense = async (id: string) => {
		try {
			await this.expenseRepo.client.expense.delete({
				where: { id },
			});

			return ServiceResponse.success("Berhasil menghapus data pengeluaran", null, StatusCodes.OK);
		} catch (error) {
			logger.error(error);
			return ServiceResponse.failure("Gagal menghapus data pengeluaran", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	};

	public getExpenseDetail = async (id: string) => {
		try {
			const expense = await this.expenseRepo.client.expense.findUnique({
				where: { id },
			});

			if (!expense) {
				return ServiceResponse.failure("Data pengeluaran tidak ditemukan", null, StatusCodes.NOT_FOUND);
			}

			return ServiceResponse.success("Berhasil mendapatkan detail pengeluaran", expense, StatusCodes.OK);
		} catch (error) {
			logger.error(error);
			return ServiceResponse.failure("Gagal mendapatkan detail pengeluaran", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	};

	public getAllExpenses = async (params: GetAllExpensesParams) => {
		try {
			const { startDate, endDate, month, year, week, keyword } = params;

			let where: {
				createdAt?: { gte?: Date; lte?: Date; lt?: Date };
				personResponsible?: { contains?: string; mode?: "insensitive" };
				itemName?: { contains?: string; mode?: "insensitive" };
				OR?: Array<{
					personResponsible?: { contains?: string; mode?: "insensitive" };
					itemName?: { contains?: string; mode?: "insensitive" };
				}>;
			} = {};

			// Filter by date range
			if (startDate && endDate) {
				where = {
					...where,
					createdAt: {
						...(where.createdAt || {}),
						gte: new Date(`${startDate}T00:00:00`),
						lte: new Date(`${endDate}T23:59:59`),
					},
				};
			}

			if (month) {
				const monthNumber = Number.parseInt(month, 10);
				const yearValue = year ? Number.parseInt(year, 10) : new Date().getFullYear();

				where = {
					...where,
					createdAt: {
						...(where.createdAt || {}),
						gte: new Date(yearValue, monthNumber - 1, 1),
						lte: new Date(yearValue, monthNumber, 0),
					},
				};
			}

			if (year && !month && !week) {
				const yearNumber = Number.parseInt(year, 10);
				console.log(yearNumber);
				where = {
					...where,
					createdAt: {
						...(where.createdAt || {}),
						gte: new Date(yearNumber, 0, 1),
						lt: new Date(yearNumber + 1, 0, 1),
					},
				};
			}

			if (week) {
				const weekNumber = Number.parseInt(week, 10);
				const yearNumber = year ? Number.parseInt(year, 10) : new Date().getFullYear();

				const firstDayOfYear = new Date(yearNumber, 0, 1);

				const daysToAdd = (weekNumber - 1) * 7;

				// Calculate start and end dates for the week
				const weekStart = new Date(firstDayOfYear);
				weekStart.setDate(firstDayOfYear.getDate() + daysToAdd);

				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekStart.getDate() + 6);

				where = {
					...where,
					createdAt: {
						...(where.createdAt || {}),
						gte: weekStart,
						lte: weekEnd,
					},
				};
			}

			if (keyword) {
				where = {
					...where,
					OR: [
						{
							personResponsible: {
								contains: keyword,
								mode: "insensitive",
							},
						},
						{
							itemName: {
								contains: keyword,
								mode: "insensitive",
							},
						},
					],
				};
			}

			console.log(where);
			const [expenses, totalExpenses, count] = await Promise.all([
				this.expenseRepo.client.expense.findMany({
					where: where as Prisma.ExpenseWhereInput,
					orderBy: {
						createdAt: "desc" as const,
					},
				}),
				this.expenseRepo.client.expense.aggregate({
					where: where as Prisma.ExpenseWhereInput,
					_sum: {
						totalPrice: true,
					},
				}),
				this.expenseRepo.client.expense.count({
					where: where as Prisma.ExpenseWhereInput,
				}),
			]);

			// Mendapatkan informasi filter yang digunakan
			let filterInfo = "Semua data";
			if (startDate && endDate) {
				filterInfo = `Data dari ${startDate} sampai ${endDate}`;
			} else if (month && year) {
				const monthNames = [
					"Januari",
					"Februari",
					"Maret",
					"April",
					"Mei",
					"Juni",
					"Juli",
					"Agustus",
					"September",
					"Oktober",
					"November",
					"Desember",
				];
				filterInfo = `Data bulan ${monthNames[Number(month) - 1]} ${year}`;
			} else if (year) {
				filterInfo = `Data tahun ${year}`;
			} else if (week) {
				filterInfo = `Data minggu ke-${week} tahun ${year || new Date().getFullYear()}`;
			}

			return ServiceResponse.success(
				"Berhasil mendapatkan data pengeluaran",
				{
					filterInfo,
					totalExpenses: totalExpenses._sum.totalPrice || 0,
					totalData: count,
					data: expenses,
				},
				StatusCodes.OK,
			);
		} catch (error) {
			logger.error(error);
			return ServiceResponse.failure("Gagal mendapatkan data pengeluaran", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	};

	public exportExpenses = async (params: GetAllExpensesParams) => {
		try {
			const formatter = new Intl.DateTimeFormat("id-ID", {
				timeZone: "Asia/Jakarta",
				dateStyle: "short",
			});

			return exportData<Expense>(
				params,
				async (where) => {
					return this.expenseRepo.client.expense.findMany({
						where: where as Prisma.ExpenseWhereInput,
						orderBy: { createdAt: "desc" },
					});
				},
				(expense, index) => ({
					No: index + 1,
					"Nama Item": expense.itemName ?? "",
					"Harga Item": expense.itemPrice ?? "",
					Jumlah: expense.qty ?? 0,
					"Total Harga": expense.totalPrice ?? 0,
					"Penanggung Jawab": expense.personResponsible ?? "",
					Catatan: expense.note ?? "",
					"Tanggal Pengeluaran": expense.expenseDate ? formatter.format(new Date(expense.expenseDate)) : "",
					"Tanggal Dibuat": expense.createdAt ? formatter.format(new Date(expense.createdAt)) : "",
				}),
				"Pengeluaran",
				"Tidak ada data pengeluaran untuk diekspor",
			);
		} catch (error) {
			logger.error(error);
			return ServiceResponse.failure("Gagal mengekspor data pengeluaran", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	};

	public importExpenses = async (file: Buffer) => {
		try {
			const importResult = await importData<Prisma.ExpenseCreateInput>(
				file,
				(row, index) => ({
					itemName: row["Nama Item"] as string,
					itemPrice: Number(row["Harga Item"]),
					qty: Number(row.Jumlah),
					totalPrice: Number(row["Total Harga"]),
					personResponsible: row["Penanggung Jawab"] as string,
					note: row.Catatan as string,
					expenseDate:
						row["Tanggal Pengeluaran"] && row["Tanggal Pengeluaran"] !== ""
							? (() => {
									try {
										const dateParts = String(row["Tanggal Pengeluaran"]).split("/");
										if (dateParts.length === 3) {
											// Format dd/mm/yyyy to yyyy-mm-dd
											const day = dateParts[0].padStart(2, "0");
											const month = dateParts[1].padStart(2, "0");
											const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
											return new Date(`${year}-${month}-${day}`);
										}
										return new Date(String(row["Tanggal Pengeluaran"]));
									} catch (error) {
										return null;
									}
								})()
							: null,
				}),
				async (data) => {
					return this.expenseRepo.client.expense.createMany({
						data,
						skipDuplicates: true,
					});
				},
			);

			return ServiceResponse.success(
				"Berhasil mengimpor data pengeluaran",
				importResult.responseObject,
				StatusCodes.OK,
			);
		} catch (error) {
			logger.error(error);
			return ServiceResponse.failure("Gagal mengimpor data pengeluaran", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	};
}

export const expenseService = new ExpenseService();
