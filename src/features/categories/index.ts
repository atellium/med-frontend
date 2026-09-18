export { default as categoriesReducer, fetchCategories } from "./category.slice";
export { CategoryCacheRefresher } from "./category-cache-refresher";
export { getCategories, getFeaturedCategories, getFeaturedDoctorSpecialties, getPopularCategories } from "./category.service";
export {
	useFeaturedCategories,
	usePopularCategories,
} from "./use-category-collections";
export type {
	CategoriesState,
	CategorySearchItem,
	DoctorSpecialty,
	FeaturedCategory,
} from "./category.types";

import type { CategorySearchItem } from "./category.types";

export function getCategoryDisplayName(category: Pick<CategorySearchItem, "label" | "name">) {
	return category.label?.trim() || category.name.trim() || "Unnamed category";
}

function normalize(value: unknown) {
	return typeof value === "string"
		? value.trim().toLocaleLowerCase()
		: "";
}

function categorySearchValues(category: CategorySearchItem) {
	const aliases = Array.isArray(category.aliases)
		? category.aliases
		: category.aliases?.split(",") ?? [];

	return [category.name, category.label, ...aliases]
		.map(normalize)
		.filter(Boolean);
}

export function matchesCategoryPrefix(
	category: CategorySearchItem,
	query: string,
) {
	const values = categorySearchValues(category);

	return values.some((value) =>
		value.split(/\s+/).some((word) => word.startsWith(query)),
	);
}

export function getCategorySearchRank(category: CategorySearchItem, query: string) {
	const normalizedQuery = normalize(query);
	const values = categorySearchValues(category);

	if (values.some((value) => value === normalizedQuery)) return 0;
	if (values.some((value) => value.split(/\s+/).some((word) => word === normalizedQuery))) return 1;
	if (values.some((value) => value.startsWith(normalizedQuery))) return 2;
	if (values.some((value) => value.split(/\s+/).some((word) => word.startsWith(normalizedQuery)))) return 3;
	return 4;
}

export function getCategorySearchMatchLength(category: CategorySearchItem, query: string) {
	const normalizedQuery = normalize(query);
	const values = categorySearchValues(category);
	const rank = getCategorySearchRank(category, normalizedQuery);
	const matchingLengths = values.flatMap((value) => {
		if (rank === 0 && value === normalizedQuery) return [value.length];
		if (rank === 1) {
			return value
				.split(/\s+/)
				.filter((word) => word === normalizedQuery)
				.map((word) => word.length);
		}
		if (rank === 2 && value.startsWith(normalizedQuery)) return [value.length];
		if (rank === 3) {
			return value
				.split(/\s+/)
				.filter((word) => word.startsWith(normalizedQuery))
				.map((word) => word.length);
		}
		return [];
	});

	return matchingLengths.length > 0 ? Math.min(...matchingLengths) : Number.MAX_SAFE_INTEGER;
}
