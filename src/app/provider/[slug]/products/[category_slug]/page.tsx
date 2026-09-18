import type { Metadata } from "next";
import { ProviderProductsPage } from "@/features/providers";

export const metadata: Metadata = { title: "Category products" };

export default async function CategoryProductsPage({ params }: PageProps<"/provider/[slug]/products/[category_slug]">) {
  const { slug, category_slug: categorySlug } = await params;
  return <ProviderProductsPage providerSlug={decodeURIComponent(slug)} categorySlug={decodeURIComponent(categorySlug)} />;
}
