import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { CatalogEditorScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../../../_metadata";

export async function generateMetadata({ params }: PageProps<"/provider/[slug]/manage/products/[catalogSlug]/edit">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Edit Product");
}

export default async function EditProductPage({ params }: PageProps<"/provider/[slug]/manage/products/[catalogSlug]/edit">) {
  const { slug, catalogSlug } = await params;
  return <AuthGuard><CatalogEditorScreen providerSlug={decodeURIComponent(slug)} catalogSlug={decodeURIComponent(catalogSlug)} /></AuthGuard>;
}
