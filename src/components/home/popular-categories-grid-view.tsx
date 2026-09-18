"use client";

import Image from "next/image";
import type { CategorySearchItem } from "@/features/categories";
import { useCategoryNavigation } from "@/features/search/use-category-navigation";

const staticCategories: Array<CategorySearchItem & { image: string }> = [
	{ id: 1, name: "Doctors", label: "Doctors", slug: "doctors", aliases: "doctor, physician, specialist", type: "provider_category", image: "/images/category/doctors.png" },
	{ id: 2, name: "Pharmacy", label: "Pharmacy", slug: "pharmacies", aliases: "pharmacy, medicines, medical store", type: "provider_category", image: "/images/category/medicine.png" },
	{ id: 3, name: "Diagnostics", label: "Diagnostics", slug: "diagnostic-centres", aliases: "diagnostic centre, lab, pathology", type: "provider_category", image: "/images/category/diagnostics.png" },
	{ id: 4, name: "Dental Care", label: "Dental", slug: "dental-clinics", aliases: "dentist, dental clinic", type: "provider_category", image: "/images/category/dentals.png" },
	{ id: 5, name: "Eye Care", label: "Eye Care", slug: "eye-care-centres", aliases: "eye clinic, ophthalmologist, optical", type: "provider_category", image: "/images/category/eye.png" },
	{ id: 6, name: "Homeopathy", label: "Homeopathy", slug: "homeopathy-clinics", aliases: "cardiology, cardiologist", type: "provider_category", image: "/images/category/homeopathy.png" },
	{ id: 7, name: "Nurse & Aya", label: "Nurse & Aya", slug: "nurse-aya-centres", aliases: "nursing care, aya, caregiver", type: "provider_category", image: "/images/category/nurse-aya.png" },
	{ id: 8, name: "Physiotherapist", label: "Physiotherapist", slug: "physiotherapy-centres", aliases: "physio, physiotherapy", type: "provider_category", image: "/images/category/physiotherapist.png" },
	{ id: 9, name: "Nursing Home", label: "Nursing Home", slug: "nursing-homes", aliases: "nursing home", type: "provider_category", image: "/images/category/nursing-home.png" },
	{ id: 10, name: "Hospitals", label: "Hospitals", slug: "hospitals", aliases: "hospital, nursing home", type: "provider_category", image: "/images/category/hospitals.png" },
	{ id: 11, name: "Blood Bank", label: "Blood Bank", slug: "blood-banks", aliases: "blood bank, blood donation", type: "provider_category", image: "/images/category/blood-bank.png" },
	{ id: 21, name: "Ambulance", label: "Ambulance", slug: "ambulance-services", aliases: "emergency ambulance", type: "provider_category", image: "/images/category/ambulance.png" },
	
];

export function PopularCategoriesGrid() {
	const openCategory = useCategoryNavigation();

	return (
		<section
			className="mx-auto w-full max-w-5xl pb-4 pt-2"
			aria-labelledby="popular-categories-title"
		>
			<div className="grid grid-cols-4 gap-x-3 bg-surface pb-2 pl-page pr-page dark:bg-surface-dark sm:grid-cols-5">
				{staticCategories.map((category) => (
					<button
						key={category.slug}
						type="button"
						onClick={() => openCategory(category)}
						className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl py-2 text-center transition-colors hover:bg-surface-secondary active:bg-brand-50 dark:hover:bg-surface-dark-secondary dark:active:bg-brand-950"
					>
						<span className="relative h-19 w-full overflow-hidden rounded-xl transition-transform group-hover:scale-105">
							<Image
								src={category.image}
								alt=""
								fill
								sizes="(max-width: 640px) 25vw, 96px"
								className="object-contain p-0.5"
							/>
						</span>
						<span className="w-full truncate text-xs font-semibold leading-4 text-foreground dark:text-foreground-dark">
							{category.name}
						</span>
					</button>
				))}
			</div>
		</section>
	);
}
