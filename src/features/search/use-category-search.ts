"use client";

import { useEffect, useMemo } from "react";
import { fetchCategories, getCategorySearchMatchLength, getCategorySearchRank, matchesCategoryPrefix } from "@/features/categories";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function useCategorySearch(query: string) {
	const dispatch = useAppDispatch();
	const { items, status, error } = useAppSelector(
		(state) => state.categories,
	);
	const normalizedQuery = query.trim().toLocaleLowerCase();
	const canSearch = normalizedQuery.length >= 2;

	useEffect(() => {
		if (canSearch && items.length === 0) dispatch(fetchCategories());
	}, [canSearch, dispatch, items.length]);

	const results = useMemo(() => {
		if (!canSearch) return [];
		return items
			.filter((category) => matchesCategoryPrefix(category, normalizedQuery))
			.map((category, index) => ({
				category,
				index,
				rank: getCategorySearchRank(category, normalizedQuery),
				matchLength: getCategorySearchMatchLength(category, normalizedQuery),
			}))
			.sort((a, b) => a.rank - b.rank || a.matchLength - b.matchLength || a.index - b.index)
			.map(({ category }) => category)
			.slice(0, 5);
	}, [canSearch, normalizedQuery, items]);

	return {
		results,
		canSearch,
		status: items.length > 0 ? "succeeded" as const : status,
		error,
		retry: () => dispatch(fetchCategories()),
	};
}
