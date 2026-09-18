import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { ProviderManageServicesScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../_metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Services");
}

export default async function ProviderServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AuthGuard><ProviderManageServicesScreen slug={decodeURIComponent(slug)} /></AuthGuard>;
}

