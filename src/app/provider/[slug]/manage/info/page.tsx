import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { ProviderInfoScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../_metadata";

export async function generateMetadata({ params }: PageProps<"/provider/[slug]/manage/info">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Provider Information");
}

export default async function ProviderInfoPage({ params }: PageProps<"/provider/[slug]/manage/info">) {
  const { slug } = await params;
  return <AuthGuard><ProviderInfoScreen slug={decodeURIComponent(slug)} /></AuthGuard>;
}
