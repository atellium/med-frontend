import type { Metadata } from "next";
import { ProviderProductsPage } from "@/features/providers";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ params }: PageProps<"/provider/[slug]/products">) {
  const { slug } = await params;
  return <ProviderProductsPage providerSlug={decodeURIComponent(slug)} />;
}
