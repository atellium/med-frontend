import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { getCategoryDisplayName, getFeaturedDoctorSpecialties, type DoctorSpecialty } from "@/features/categories";
import { doctorSpecialtyListingPath } from "@/lib/provider-listing-url";

type DoctorsSpecialtiesPageProps = {
	params: Promise<{ slug: string; locality: string }>;
};

function labelFromSlug(slug: string) {
	return decodeURIComponent(slug)
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export async function generateMetadata({
	params,
}: DoctorsSpecialtiesPageProps): Promise<Metadata> {
	const { locality } = await params;
	const localityLabel = labelFromSlug(locality);

	return {
		title: `Doctor specialties in ${localityLabel}`,
		description: `Browse doctor specialties near ${localityLabel} on MedNearby.`,
	};
}

export default async function Page({ params }: DoctorsSpecialtiesPageProps) {
	const { slug: city, locality } = await params;
	const specialties = await getFeaturedDoctorSpecialties().catch(() => []);

	return (
		<div className="min-h-dvh bg-white pb-[calc(env(safe-area-inset-bottom)+2rem)] dark:bg-background-dark">
			<MobileHeader
				title="Doctors"
				subtitle="Find doctors by specialty"
				rightActions={
					<Link
						href="/search"
						aria-label="Search"
						className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors active:scale-95 active:bg-surface-secondary dark:text-foreground-dark dark:active:bg-surface-dark-secondary"
					>
						<i className="fa-solid fa-magnifying-glass text-base" aria-hidden="true" />
					</Link>
				}
			/>

			<main className="mx-auto w-full max-w-5xl px-page pt-3">
				<section aria-label="Doctor specialties">
					<div className="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-xs dark:border-border-dark-subtle dark:bg-surface-dark">
						{specialties.map((specialty) => (
							<Link
								key={specialty.slug}
								href={doctorSpecialtyListingPath({
									city,
									locality,
									specialtySlug: specialty.slug,
								})}
								className="group flex min-w-0 items-center gap-2.5 border-b border-border-subtle px-3 py-2 transition-colors last:border-b-0 hover:bg-surface-secondary active:bg-brand-50 dark:border-border-dark-subtle dark:hover:bg-surface-dark-secondary dark:active:bg-brand-950"
							>
								<SpecialtyMedia specialty={specialty} />
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-extrabold text-foreground dark:text-foreground-dark">
										{getCategoryDisplayName(specialty)}
									</span>
								</span>
								<i className="fa-solid fa-chevron-right shrink-0 text-xs text-foreground-subtle transition-transform group-hover:translate-x-0.5 dark:text-foreground-dark-subtle" aria-hidden="true" />
							</Link>
						))}
						{specialties.length === 0 && (
							<div className="p-6 text-center">
								<span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand-950 dark:text-brand-300">
									<i className="fa-solid fa-user-doctor text-xl" aria-hidden="true" />
								</span>
								<p className="mt-3 text-sm font-extrabold text-foreground dark:text-foreground-dark">
									No featured specialties found
								</p>
							</div>
						)}
					</div>
				</section>
			</main>
		</div>
	);
}

function SpecialtyMedia({ specialty }: { specialty: DoctorSpecialty }) {
	if (!specialty.image) {
		return (
			<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand dark:bg-brand-950 dark:text-brand-300">
				<i className="fa-solid fa-user-doctor text-lg" aria-hidden="true" />
			</span>
		);
	}

	return (
		<span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary">
			<Image
				src={specialty.image}
				alt=""
				fill
				sizes="40px"
				className="object-contain p-1"
			/>
		</span>
	);
}
