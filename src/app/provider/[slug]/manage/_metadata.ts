import type { Metadata } from "next";
import { getProviderNameBySlug } from "@/features/providers/provider.service";

export async function getProviderManageMetadata(slug: string, section: string): Promise<Metadata> {
  try {
    const provider = await getProviderNameBySlug(slug);
    return {
      title: `${section} | ${provider.name}`,
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: section,
      robots: { index: false, follow: false },
    };
  }
}
