import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { ProviderOfferEditorScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../../../_metadata";

export async function generateMetadata({ params }: PageProps<"/provider/[slug]/manage/offers/[offerId]/edit">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Edit Offer");
}

export default async function EditOfferPage({ params }: PageProps<"/provider/[slug]/manage/offers/[offerId]/edit">) {
  const { slug, offerId } = await params;
  return <AuthGuard><ProviderOfferEditorScreen providerSlug={decodeURIComponent(slug)} offerId={decodeURIComponent(offerId)} /></AuthGuard>;
}
