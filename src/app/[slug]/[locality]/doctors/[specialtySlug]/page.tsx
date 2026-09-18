import type { Metadata } from "next";
import { DoctorListPage } from "@/features/providers";

function labelFromSlug(slug: string) {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

type DoctorSpecialtyPageProps = {
	params: Promise<{ slug: string; locality: string; specialtySlug: string }>;
};

export async function generateMetadata({
	params,
}: DoctorSpecialtyPageProps): Promise<Metadata> {
	const { specialtySlug, locality } = await params;
	return {
		title: `${labelFromSlug(specialtySlug)} doctors in ${labelFromSlug(locality)}`,
		description: `Discover nearby ${labelFromSlug(specialtySlug).toLocaleLowerCase()} doctors on MedNearby.`,
	};
}

export default async function Page({
	params,
}: DoctorSpecialtyPageProps) {
	const route = await params;
	return (
		<DoctorListPage
			city={route.slug}
			locality={route.locality}
			specialtySlug={route.specialtySlug}
		/>
	);
}
