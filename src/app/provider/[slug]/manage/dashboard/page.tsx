import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { ProviderDashboardScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../_metadata";

export async function generateMetadata({ params }: PageProps<"/provider/[slug]/manage/dashboard">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Provider dashboard");
}

export default async function ProviderDashboardPage({
  params,
}: PageProps<"/provider/[slug]/manage/dashboard">) {
  const { slug } = await params;

  return <AuthGuard>
    <ProviderDashboardScreen slug={decodeURIComponent(slug)} />
  </AuthGuard>;
}
