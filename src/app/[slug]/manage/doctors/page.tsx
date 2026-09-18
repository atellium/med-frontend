import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { ProviderManageDoctorsScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../_metadata";

export async function generateMetadata({ params }: PageProps<"/[slug]/manage/doctors">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Doctors");
}

export default async function ProviderManageDoctorsPage({ params }: PageProps<"/[slug]/manage/doctors">) {
  const { slug } = await params;
  return <AuthGuard><ProviderManageDoctorsScreen slug={decodeURIComponent(slug)} /></AuthGuard>;
}
