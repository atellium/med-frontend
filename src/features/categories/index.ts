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

function categoryAliases(category: CategorySearchItem) {
	const aliases = Array.isArray(category.aliases)
		? category.aliases
		: category.aliases?.split(",") ?? [];

	return aliases
		.map(normalize)
		.filter(Boolean);
}

function categoryPrimarySearchValues(category: CategorySearchItem) {
	return [category.name, category.label]
		.map(normalize)
		.filter(Boolean);
}

function categorySearchValues(category: CategorySearchItem) {
	return [...categoryPrimarySearchValues(category), ...categoryAliases(category)];
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
	const primaryValues = categoryPrimarySearchValues(category);
	const aliasValues = categoryAliases(category);

	if (primaryValues.some((value) => value === normalizedQuery)) return 0;
	if (primaryValues.some((value) => value.startsWith(normalizedQuery))) return 1;
	if (primaryValues.some((value) => value.split(/\s+/).some((word) => word === normalizedQuery))) return 2;
	if (primaryValues.some((value) => value.split(/\s+/).some((word) => word.startsWith(normalizedQuery)))) return 3;
	if (aliasValues.some((value) => value === normalizedQuery)) return 4;
	if (aliasValues.some((value) => value.startsWith(normalizedQuery))) return 5;
	if (aliasValues.some((value) => value.split(/\s+/).some((word) => word === normalizedQuery))) return 6;
	if (aliasValues.some((value) => value.split(/\s+/).some((word) => word.startsWith(normalizedQuery)))) return 7;
	return 8;
}

export function getCategorySearchMatchLength(category: CategorySearchItem, query: string) {
	const normalizedQuery = normalize(query);
	const rank = getCategorySearchRank(category, normalizedQuery);
	const values = rank < 4
		? categoryPrimarySearchValues(category)
		: categoryAliases(category);
	const matchingLengths = values.flatMap((value) => {
		if ((rank === 0 || rank === 4) && value === normalizedQuery) return [value.length];
		if ((rank === 1 || rank === 5) && value.startsWith(normalizedQuery)) return [value.length];
		if (rank === 2 || rank === 6) {
			return value
				.split(/\s+/)
				.filter((word) => word === normalizedQuery)
				.map((word) => word.length);
		}
		if (rank === 3 || rank === 7) {
			return value
				.split(/\s+/)
				.filter((word) => word.startsWith(normalizedQuery))
				.map((word) => word.length);
		}
		return [];
	});

	return matchingLengths.length > 0 ? Math.min(...matchingLengths) : Number.MAX_SAFE_INTEGER;
}
