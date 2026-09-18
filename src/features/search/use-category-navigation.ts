"use client";

import { useRouter } from "next/navigation";
import { getCategoryDisplayName, type CategorySearchItem } from "@/features/categories";
import {
	providerListingPath,
	doctorSpecialtyListingPath,
} from "@/lib/provider-listing-url";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addRecentCategory } from "./search.slice";

export function useCategoryNavigation() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { city, locality } = useAppSelector((state) => state.location);

	return (category: CategorySearchItem) => {
		if (!city || !locality) return false;
		dispatch(addRecentCategory({ ...category, label: getCategoryDisplayName(category) }));
		const href = category.type === "doctor_specialty"
			? doctorSpecialtyListingPath({
				city,
				locality,
				specialtySlug: category.slug,
			})
			: providerListingPath({ city, locality, categorySlug: category.slug });
		router.push(href);
		return true;
	};
}
