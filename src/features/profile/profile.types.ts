import type { ProviderApiListResponse, ProviderListItem } from "@/features/providers/provider.types";

export type OwnedProvider = Omit<ProviderListItem, "display_as_store" | "location"> & {
  display_as_store?: boolean;
  location: Omit<ProviderListItem["location"], "state" | "coordinates"> & {
    state?: string;
    coordinates: Omit<ProviderListItem["location"]["coordinates"], "distance_km"> & {
      distance_km: number | null;
    };
  };
};

export type OwnedProvidersApiResponse = ProviderApiListResponse;

export type OwnedProvidersResponse = {
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    total_items: number;
    has_next: boolean;
    has_previous: boolean;
  };
  category: null;
  results: OwnedProvider[];
};

export type OwnedProviderInfo = Omit<OwnedProvider, "hours" | "media"> & {
  description: string | null;
  services: string[] | null;
  offerings: string[] | null;
  media: OwnedProvider["media"] & { gallery: string[] };
  hours: (NonNullable<OwnedProvider["hours"]> & {
    schedule: Record<string, Array<{ opens_at: string; closes_at: string }>>;
  }) | null;
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
  };
  metadata: {
    created_at: string;
    updated_at: string;
  };
  owner_id: string;
  visibility: {
    display_full_address: boolean;
    display_provider_hours: boolean;
  };
};

export type OwnedProviderInfoResponse = {
  result: (Omit<OwnedProviderInfo, "seo"> & { seo: OwnedProviderInfo["seo"] | null }) | null;
};

export type ProviderGalleryImage = {
  id: string;
  image: string;
};

export type ProviderGalleryResponse = {
  results: ProviderGalleryImage[] | null;
};

export type ProviderGalleryUploadTicket = {
  id: string;
  upload_url: string;
  content_type: string;
  expires_in: number;
};

export type ProviderGalleryUpload = {
  id: string;
  status: "pending" | "processing" | "ready" | "failed";
  error: string;
  image: ProviderGalleryImage | null;
  asset_url?: string | null;
};

export type ProviderCategoryOption = { id: number; name: string; display_name: string; label: string; slug: string };
export type ProviderCityOption = { id: number; name: string; slug: string; tier: number; state: { id: number; name: string; slug: string; code: string } };
export type ProviderUpdatePayload = Partial<{
  name: string; handle: string; categories: number[]; address: string; landmark: string; locality: string; city: number; postal_code: string;
  latitude: number; longitude: number; phone: string; whatsapp: string; email: string; website: string; description: string;
  established_year: number; alternate_numbers: string[]; social_urls: Record<string, string>; is_active: boolean;
  display_full_address: boolean; display_provider_hours: boolean; seo_title: string; seo_description: string; seo_keywords: string;
  services: string[]; offerings: string[];
}>;

export type ProviderHoursUpdatePayload = {
  provider_hours: Array<{
    days: number[];
    opens_at: string;
    closes_at: string;
  }>;
};

export type DoctorSchedulePayload = {
  schedule_type: "weekly" | "monthly_weekday" | "monthly_date";
  weekday?: number | null;
  week_of_month?: number | null;
  day_of_month?: number | null;
  consultation_type?: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export type DoctorUpsertPayload = Partial<{
  name: string;
  specialty_ids: number[];
  qualification: string;
  registration_number: string;
  registration_council: string;
  registration_year: number | null;
  consultation_fee: string;
  gender: string;
  bio: string;
  languages: string[];
  treatments: string[];
  is_active: boolean;
  schedules: DoctorSchedulePayload[];
  profile_image: File | null;
}>;
