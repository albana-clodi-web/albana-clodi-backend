import { ServiceResponse } from "@/common/models/serviceResponse";
import prismaClient from "@/config/prisma";
import { StatusCodes } from "http-status-codes";
import type { Prisma } from "../../../generated/prisma";
import type {
	RequestQueryCityType,
	RequestQueryDistrictType,
	RequestQueryProvinceType,
	RequestQueryVillageType,
} from "./regionModel";
class RegionService {
	public getAllProvince = async (reqQuery: RequestQueryProvinceType) => {
		try {
			const query: Prisma.ProvinceFindManyArgs = {};
			if (reqQuery.name) {
				query.where = {
					name: {
						contains: reqQuery.name,
						mode: "insensitive",
					},
				};
			}
			const findAllProvinces = await prismaClient.province.findMany(query);
			const responseMap = findAllProvinces.map((data) => ({
				...data,
				id: data.id.toString(),
			}));

			return ServiceResponse.success("Province retrieved successfully.", responseMap, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error get all province: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while get all province.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public getCityByProvinceId = async (provinceId: bigint, reqQuery: RequestQueryCityType) => {
		try {
			const query: Prisma.CityFindManyArgs = { where: { provinceId } };
			if (reqQuery.name) {
				query.where = {
					...query.where,
					name: {
						contains: reqQuery.name,
						mode: "insensitive",
					},
				};
			}
			const findAllCities = await prismaClient.city.findMany(query);
			const responseMap = findAllCities.map((data) => ({
				...data,
				id: data.id.toString(),
				provinceId: data.provinceId?.toString(),
			}));

			return ServiceResponse.success("Cities retrieved successfully.", responseMap, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error get all city: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while get all city.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public getDistrictByCityId = async (cityId: bigint, reqQuery: RequestQueryDistrictType) => {
		try {
			const query: Prisma.DistrictFindManyArgs = { where: { cityId } };
			if (reqQuery.name) {
				query.where = {
					...query.where,
					name: {
						contains: reqQuery.name,
						mode: "insensitive",
					},
				};
			}

			const findAllDistricts = await prismaClient.district.findMany(query);
			const responseMap = findAllDistricts.map((data) => ({
				...data,
				id: data.id.toString(),
				cityId: data.cityId?.toString(),
			}));

			return ServiceResponse.success("Districts retrieved successfully.", responseMap, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error get all district: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while get all district.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};

	public getVillageByDistrictId = async (districtId: bigint, reqQuery: RequestQueryVillageType) => {
		try {
			console.log(districtId);

			const query: Prisma.VillageFindManyArgs = { where: { districtId } };
			if (reqQuery.name) {
				query.where = {
					...query.where,
					name: {
						contains: reqQuery.name,
						mode: "insensitive",
					},
				};
			}
			const findAllDistricts = await prismaClient.village.findMany(query);
			const responseMap = findAllDistricts.map((data) => ({
				...data,
				id: data.id.toString(),
				districtId: data.districtId?.toString(),
			}));

			return ServiceResponse.success("Villages retrieved successfully.", responseMap, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error get all village: ${(ex as Error).message}`;
			return ServiceResponse.failure(
				"An error occurred while get all village.",
				errorMessage,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	};
}

export const regionService = new RegionService();
