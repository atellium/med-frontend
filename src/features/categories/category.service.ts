import { publicApiClient } from "@/lib/api";
import type {
	CategorySearchItem,
	DoctorSpecialtiesResponse,
	FeaturedCategoriesResponse,
	PopularCategoriesResponse,
} from "./category.types";

export async function getCategories() {
	const { data } = await publicApiClient.get<CategorySearchItem[]>(
		"/api/search/",
	);

	return data;
}

export async function getFeaturedCategories(signal?: AbortSignal) {
	const { data } = await publicApiClient.get<FeaturedCategoriesResponse>(
		"/api/categories/provider/",
		{ params: { is_featured: true }, signal },
	);

	return data.results;
}

export async function getPopularCategories(signal?: AbortSignal) {
	const { data } = await publicApiClient.get<PopularCategoriesResponse>(
		"/api/categories/",
		{ params: { is_popular: true }, signal },
	);

	return data.results;
}

export async function getFeaturedDoctorSpecialties(signal?: AbortSignal) {
	const { data } = await publicApiClient.get<DoctorSpecialtiesResponse>(
		"/api/doctors/specialties/",
		{ params: { is_featured: true, page_size: 50 }, signal },
	);

	return data.results;
}
