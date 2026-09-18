import type { Metadata } from "next";
import { ProviderDetailPage } from "@/features/providers";
import { getProviderNameBySlug } from "@/features/providers/provider.service";
import { getSiteUrl } from "@/lib/site-url";

type ProviderPageProps = {
  params: Promise<{ slug: string }>;
};

const appIconImage = {
  url: new URL("/app-icons/app-icon-1024X1024.png", getSiteUrl()).toString(),
  width: 1024,
  height: 1024,
  alt: "MedNearby app icon",
  type: "image/png",
};

function getAbsoluteImageUrl(source: string) {
  return new URL(source, getSiteUrl()).toString();
}

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  try {
    const provider = await getProviderNameBySlug(slug);
    const location = [provider.location.locality, provider.location.city.name]
      .filter(Boolean)
      .join(", ");
    const title = location ? `${provider.name} in ${location} | MedNearby` : provider.name;
    const description = provider.description?.trim()
      || `Discover ${provider.name} in ${location}. View address, contact details, services, available doctors, timings, facilities and other information on MedNearby.`;
    const images = provider.media.thumbnail
      ? [{ url: getAbsoluteImageUrl(provider.media.thumbnail), alt: provider.name }]
      : [appIconImage];

    return {
      title,
      description,
      alternates: {
        canonical: `/${encodeURIComponent(slug)}`,
      },
      openGraph: {
        type: "website",
        siteName: "MedNearby",
        title,
        description,
        url: `/${encodeURIComponent(slug)}`,
        images,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images,
      },
    };
  } catch {
    return {
      title: "Provider details",
      description: "View local provider details, contact information, products, services, and opening hours on MedNearby.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params;
  return <ProviderDetailPage slug={decodeURIComponent(slug)} />;
}
