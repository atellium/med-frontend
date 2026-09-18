import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { DoctorEditorScreen } from "@/features/profile";
import { getProviderManageMetadata } from "../../_metadata";

export async function generateMetadata({ params }: PageProps<"/provider/[slug]/manage/doctors/add">): Promise<Metadata> {
  const { slug } = await params;
  return getProviderManageMetadata(decodeURIComponent(slug), "Add Doctor");
}

export default async function AddDoctorPage({ params }: PageProps<"/provider/[slug]/manage/doctors/add">) {
  const { slug } = await params;
  return <AuthGuard><DoctorEditorScreen providerSlug={decodeURIComponent(slug)} /></AuthGuard>;
}
