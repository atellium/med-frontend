import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { ProviderManageOffersScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../_metadata";

export async function generateMetadata({ params }: PageProps<"/[slug]/manage/offers">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Offers");
}

export default async function ProviderOffersPage({ params }: PageProps<"/[slug]/manage/offers">) {
  const { slug } = await params;
  return <AuthGuard><ProviderManageOffersScreen slug={decodeURIComponent(slug)} /></AuthGuard>;
}
