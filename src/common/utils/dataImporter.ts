import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { StatusCodes } from "http-status-codes";
import xlsx from "xlsx";

/**
 * Fungsi untuk mengimpor data dari file Excel
 * @param file Buffer file Excel yang akan diimpor
 * @param mapFunction Fungsi untuk mengubah data dari Excel menjadi objek yang sesuai dengan model
 * @param saveIntoDB Fungsi untuk menyimpan data ke database
 * @param sheetName Nama sheet yang akan diimpor (opsional, default: sheet pertama)
 * @returns ServiceResponse dengan hasil impor data
 */
export const importData = async <T>(
	file: Buffer,
	mapFunction: (row: Record<string, unknown>, index: number) => T,
	saveIntoDB: (data: T[]) => Promise<unknown>,
) => {
	try {
		const workbook = xlsx.read(file, { type: "buffer" });
		const sheetToUse = workbook.SheetNames[0];

		if (!workbook.SheetNames.includes(sheetToUse)) {
			return ServiceResponse.failure(
				`Sheet "${sheetToUse}" tidak ditemukan dalam file Excel`,
				null,
				StatusCodes.BAD_REQUEST,
			);
		}

		const worksheet = workbook.Sheets[sheetToUse];
		const jsonData = xlsx.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

		if (jsonData.length === 0) {
			return ServiceResponse.failure("File Excel tidak berisi data", null, StatusCodes.BAD_REQUEST);
		}
		console.log(mapFunction);

		const mappedData = jsonData.map(mapFunction);

		console.log("====================================");
		console.log(mappedData);
		console.log("====================================");

		// Validasi data yang telah di-map
		const validateMappedData = (data: T[]) => {
			for (let i = 0; i < data.length; i++) {
				const item = data[i];

				// Periksa apakah item adalah objek yang valid
				if (!item || typeof item !== "object") {
					logger.error(`Data pada baris ${i + 1} tidak valid: format data tidak sesuai`);
					return {
						isValid: false,
						errorMessage: `Data pada baris ${i + 1} tidak valid: format data tidak sesuai`,
					};
				}

				// Periksa nilai-nilai yang tidak valid (undefined, null, NaN)
				// Fungsi rekursif untuk memeriksa nilai yang tidak valid di dalam objek bersarang
				const checkInvalidValue = (value: unknown): boolean => {
					if (typeof value === "number" && Number.isNaN(value)) {
						return true;
					}

					if (Array.isArray(value) && value.length === 0) {
						return true;
					}

					if (typeof value === "object" && value !== null) {
						// Periksa properti dalam objek bersarang
						for (const [_, propValue] of Object.entries(value as Record<string, unknown>)) {
							if (checkInvalidValue(propValue)) {
								return true;
							}
						}
					}

					return false;
				};

				const invalidValues = Object.entries(item).filter(([_, value]) => checkInvalidValue(value));

				if (invalidValues.length > 0) {
					const invalidFields = invalidValues.map(([key]) => key).join(", ");
					logger.error(`Data tidak valid pada baris ${i + 1}. Field yang bermasalah: ${invalidFields}`);
					return {
						isValid: false,
						errorMessage: `Data pada baris ${i + 1} tidak valid: ${invalidFields} memiliki nilai yang tidak sesuai`,
					};
				}
			}

			return { isValid: true };
		};

		// Jalankan validasi
		const validationResult = validateMappedData(mappedData);
		if (!validationResult.isValid) {
			return ServiceResponse.failure(
				validationResult.errorMessage || "Data tidak valid",
				null,
				StatusCodes.BAD_REQUEST,
			);
		}

		// Simpan data dalam batch untuk menghindari overload database
		const BATCH_SIZE = 100;
		let saveResult: unknown;

		for (let i = 0; i < mappedData.length; i += BATCH_SIZE) {
			const batch = mappedData.slice(i, i + BATCH_SIZE);
			saveResult = await saveIntoDB(batch);
		}

		return ServiceResponse.success("Berhasil mengimpor data", mappedData, StatusCodes.OK);
	} catch (error) {
		logger.error(error);
		return ServiceResponse.failure("Gagal mengimpor data", null, StatusCodes.INTERNAL_SERVER_ERROR);
	}
};

/**
 * Contoh penggunaan importData:
 *
 * ```typescript
 * ! Contoh penggunaan di service
 * public importExpenses = async (file: Buffer) => {
 *   return importData<Prisma.ExpenseCreateInput>(
 *     file,
 *     (row, index) => ({
 *       itemName: row["Nama Item"] as string,
 *       itemPrice: Number(row["Harga Item"]),
 *       qty: Number(row.Jumlah),
 *       totalPrice: Number(row["Total Harga"]),
 *       personResponsible: row["Penanggung Jawab"] as string,
 *       note: row.Catatan as string,
 *     }),
 *     async (data) => {
 *       return this.expenseRepo.client.expense.createMany({
 *         data,
 *         skipDuplicates: true,
 *       });
 *     }
 *   );
 * };
 * ```
 *
 * ! Contoh penggunaan di controller:
 *
 * ```typescript
 * public importExpenses: RequestHandler = async (req: Request, res: Response) => {
 *   if (!req.file) {
 *     return res.status(StatusCodes.BAD_REQUEST).send(
 *       ServiceResponse.failure("File tidak ditemukan", null, StatusCodes.BAD_REQUEST)
 *     );
 *   }
 *
 *   const serviceResponse = await expenseService.importExpenses(req.file.buffer);
 *   res.status(serviceResponse.statusCode).send(serviceResponse);
 * };
 * ```
 */
