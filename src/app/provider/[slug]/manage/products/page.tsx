import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { ProviderManageProductsScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../_metadata";

export async function generateMetadata({ params }: PageProps<"/provider/[slug]/manage/products">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Products");
}

export default async function ProviderManageProductsPage({ params }: PageProps<"/provider/[slug]/manage/products">) {
  const { slug } = await params;
  return <AuthGuard><ProviderManageProductsScreen slug={decodeURIComponent(slug)} /></AuthGuard>;
}
