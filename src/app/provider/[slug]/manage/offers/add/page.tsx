import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { ProviderOfferEditorScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../../_metadata";

export async function generateMetadata({ params }: PageProps<"/provider/[slug]/manage/offers/add">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Add Offer");
}

export default async function AddOfferPage({ params }: PageProps<"/provider/[slug]/manage/offers/add">) {
  const { slug } = await params;
  return <AuthGuard><ProviderOfferEditorScreen providerSlug={decodeURIComponent(slug)} /></AuthGuard>;
}
