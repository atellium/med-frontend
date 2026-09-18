import type { Metadata } from "next";
import { DoctorDetailPage as DoctorDetailScreen } from "@/features/providers";
import { getDoctorBySlug } from "@/features/providers/provider.service";
import { getSiteUrl } from "@/lib/site-url";

type DoctorDetailPageProps = {
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

function compact(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(", ");
}

export async function generateMetadata({ params }: DoctorDetailPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  try {
    const doctor = await getDoctorBySlug(slug);
    const specialties = doctor.specialties?.map((specialty) => specialty.label || specialty.name).filter(Boolean).slice(0, 3).join(", ");
    const location = compact([doctor.provider.address.locality, doctor.provider.city.name]);
    const providerName = doctor.provider.name;
    const titleParts = [
      doctor.name,
      specialties ? `${specialties} Doctor` : "Doctor",
      location ? `in ${location}` : null,
    ];
    const title = titleParts.filter(Boolean).join(" | ");
    const description = doctor.bio?.trim()
      || compact([
        `Book or contact ${doctor.name}`,
        specialties ? `${specialties} specialist` : null,
        doctor.qualification,
        providerName ? `at ${providerName}` : null,
        location ? `in ${location}` : null,
      ]);
    const images = doctor.provider.cover_image
      ? [{ url: getAbsoluteImageUrl(doctor.provider.cover_image), alt: `${doctor.name} at ${providerName}` }]
      : [appIconImage];
    const canonical = `/doctor/${encodeURIComponent(slug)}`;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        type: "profile",
        siteName: "MedNearby",
        title,
        description,
        url: canonical,
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
      title: "Doctor details",
      description: "View doctor details, clinic information, schedule, and contact options on MedNearby.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function DoctorDetailPage({ params }: DoctorDetailPageProps) {
  const { slug } = await params;

  return <DoctorDetailScreen slug={decodeURIComponent(slug)} />;
}
