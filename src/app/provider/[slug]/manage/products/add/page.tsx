import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { CatalogEditorScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../../_metadata";

export async function generateMetadata({ params }: PageProps<"/provider/[slug]/manage/products/add">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Add Product");
}

export default async function AddProductPage({ params }: PageProps<"/provider/[slug]/manage/products/add">) {
  const { slug } = await params;
  return <AuthGuard><CatalogEditorScreen providerSlug={decodeURIComponent(slug)} /></AuthGuard>;
}
