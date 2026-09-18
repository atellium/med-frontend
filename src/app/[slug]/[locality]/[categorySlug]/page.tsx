import type { Metadata } from "next";
import { ProviderListPage } from "@/features/providers";

function labelFromSlug(slug: string) {
    return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

type ProviderListPageProps = {
    params: Promise<{ slug: string; locality: string; categorySlug: string }>;
    searchParams: Promise<{
        is_verified?: string | string[];
        open_now?: string | string[];
    }>;
};

function isTrueParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value.includes("true") : value === "true";
}

export async function generateMetadata({
    params,
}: ProviderListPageProps): Promise<Metadata> {
    const { categorySlug, locality } = await params;
    return {
        title: `${labelFromSlug(categorySlug)} in ${labelFromSlug(locality)}`,
        description: `Discover nearby ${labelFromSlug(categorySlug).toLocaleLowerCase()} on MedNearby.`,
    };
}

export default async function Page({
    params,
    searchParams,
}: ProviderListPageProps) {
    const [route, query] = await Promise.all([params, searchParams]);
    return (
        <ProviderListPage
            city={route.slug}
            locality={route.locality}
            categorySlug={route.categorySlug}
            initialVerifiedOnly={isTrueParam(query.is_verified)}
            initialOpenNowOnly={isTrueParam(query.open_now)}
        />
    );
}
