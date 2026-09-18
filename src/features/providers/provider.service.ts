import { publicApiClient } from "@/lib/api";
import type {
  ProviderListItem,
  ProviderNameDetail,
  ProviderNameDetailResponse,
  ProviderProductsListParams,
  ProviderProductsListResponse,
  ProductDetailResponse,
  NearbyOffersResponse,
  NearbyAvailableDoctorsResponse,
  DoctorApiListResponse,
  DoctorListItem,
  ProviderApiListResponse,
  ProviderDetailResponse,
} from "./provider.types";
import { normalizeProviderHours } from "./provider.utils";

export async function getNearbyOffers({ lat, lng, page = 1 }: { lat: number; lng: number; page?: number }) {
  const { data } = await publicApiClient.get<NearbyOffersResponse>("/api/offers/nearby/", { params: { lat, lng, page } });
  return { ...data, results: data.results ?? [] };
}

function providerCategoryLabel(category: { label?: string | null; name: string }) {
  return category.label?.trim() || category.name;
}

function providerToProviderListItem(
  provider: ProviderDetailResponse,
  fallbackCoordinates: { lat: number; lng: number },
): ProviderListItem {
  return {
    id: provider.id,
    name: provider.name,
    handle: provider.slug,
    slug: provider.slug,
    established_year: null,
    is_active: provider.is_active,
    display_as_store: false,
    publication_status: provider.is_active ? "published" : "inactive",
    last_updated: "",
    is_medicine_enquiry: provider.is_medicine_enquiry,
    is_test_book: provider.is_test_book,
    categories: provider.categories?.map((category) => ({
      id: category.id,
      slug: category.slug,
      display_name: providerCategoryLabel(category),
    })) ?? null,
    offerings: provider.offerings ?? provider.services,
    media: { thumbnail: provider.cover_image || null, gallery: [] },
    is_verified: provider.is_verified,
    hours: normalizeProviderHours(provider.hour),
    location: {
      address: provider.address.address,
      landmark: provider.address.landmark ?? "",
      locality: provider.address.locality,
      city: provider.city,
      state: provider.city.state ?? "",
      postal_code: provider.address.pincode ?? "",
      display_full_address: true,
      coordinates: {
        latitude: provider.address.latitude ?? fallbackCoordinates.lat,
        longitude: provider.address.longitude ?? fallbackCoordinates.lng,
        distance_km: provider.distance_km ?? 0,
      },
    },
    contact: {
      phone: provider.contact.phone ?? "",
      whatsapp: provider.contact.whatsapp ?? "",
      alternate_numbers: provider.contact.alternate_numbers,
      email: provider.contact.email ?? "",
      website: provider.contact.website ?? "",
      social_urls: null,
    },
  };
}

function providerToProviderDetail(provider: ProviderDetailResponse): ProviderNameDetail {
  const listItem = providerToProviderListItem(provider, {
    lat: provider.address.latitude ?? 0,
    lng: provider.address.longitude ?? 0,
  });

  return {
    ...listItem,
    description: provider.description,
    services: provider.services ?? provider.facilities ?? null,
    media: {
      ...listItem.media,
      gallery: [],
    },
    location: {
      ...listItem.location,
      landmark: provider.address.landmark,
      postal_code: provider.address.pincode,
      display_full_address: true,
      city: {
        id: provider.city.id ?? 0,
        name: provider.city.name,
        state_id: 0,
        state: provider.city.state ?? "",
      },
    },
    contact: {
      ...listItem.contact,
      phone: provider.contact.phone,
      whatsapp: provider.contact.whatsapp,
      email: provider.contact.email,
      website: provider.contact.website,
    },
    hours: normalizeProviderHours(provider.hour),
    product: null,
    offers: null,
  };
}

export async function getProviders({
  lat,
  lng,
  category,
  page,
  isVerified,
  openNow,
  isFeatured,
  radiusKm = 5,
}: {
  lat: number;
  lng: number;
  category?: string;
  page: number;
  isVerified?: boolean;
  openNow?: boolean;
  isFeatured?: boolean;
  radiusKm?: number;
}) {
  const { data } = await publicApiClient.get<ProviderApiListResponse>("/api/providers/", {
    params: {
      lat,
      lng,
      category,
      page,
      is_verified: isVerified === true ? true : undefined,
      open_now: openNow === true ? true : undefined,
      is_featured: isFeatured === true ? true : undefined,
      radius_km: radiusKm,
    },
  });

  return {
    pagination: {
      page: data.pagination.page,
      page_size: data.pagination.page_size,
      total_pages: data.pagination.total_pages,
      total_items: data.pagination.count,
      has_next: data.pagination.next_page !== null,
      has_previous: data.pagination.previous_page !== null,
    },
    category: data.category
      ? {
        name: data.category.name,
        display_name: data.category.label?.trim() || data.category.name,
        label: data.category.label?.trim() || data.category.name,
      }
      : null,
    results: (data.results ?? [])
      .filter((provider): provider is NonNullable<typeof provider> => provider !== null)
      .map<ProviderListItem>((provider) =>
        providerToProviderListItem(provider, { lat, lng }),
      ),
  };
}

export async function getDoctors({
  lat,
  lng,
  specialty,
  availableToday,
  page,
}: {
  lat: number;
  lng: number;
  specialty?: string;
  availableToday?: boolean;
  page: number;
}) {
  const { data } = await publicApiClient.get<DoctorApiListResponse>("/api/doctors/", {
    params: {
      lat,
      lng,
      specialty,
      available_today: availableToday || undefined,
      page,
    },
  });

  return {
    pagination: {
      page: data.pagination.page,
      page_size: data.pagination.page_size,
      total_pages: data.pagination.total_pages,
      total_items: data.pagination.count,
      has_next: data.pagination.next_page !== null,
      has_previous: data.pagination.previous_page !== null,
    },
    specialty: data.specialty,
    results: (data.results ?? []).filter((doctor): doctor is NonNullable<typeof doctor> => doctor !== null),
  };
}

export async function getNearbyAvailableDoctors({ lat, lng }: { lat: number; lng: number }) {
  const { data } = await publicApiClient.get<NearbyAvailableDoctorsResponse>(
    "/api/doctors/nearby-available/",
    { params: { lat, lng } },
  );

  return {
    results: (data.results ?? []).filter((doctor): doctor is NonNullable<typeof doctor> => doctor !== null),
  };
}

export async function getDoctorBySlug(slug: string) {
  const { data } = await publicApiClient.get<DoctorListItem>(
    `/api/doctors/${encodeURIComponent(slug)}/`,
  );
  if (!data?.id) throw new Error("Doctor not found.");
  return data;
}

export async function getProviderDoctorList(providerSlug: string, page = 1) {
  const { data } = await publicApiClient.get<DoctorApiListResponse & {
    provider?: { id: string; name: string; slug: string };
  }>(`/api/providers/${encodeURIComponent(providerSlug)}/doctors/`, {
    params: { page },
  });

  return {
    pagination: {
      page: data.pagination.page,
      page_size: data.pagination.page_size,
      total_pages: data.pagination.total_pages,
      total_items: data.pagination.count,
      has_next: data.pagination.next_page !== null,
      has_previous: data.pagination.previous_page !== null,
    },
    specialty: data.specialty,
    provider: data.provider,
    results: (data.results ?? []).filter((doctor): doctor is NonNullable<typeof doctor> => doctor !== null),
  };
}

export async function getProductBySlug(slug: string) {
  const { data } = await publicApiClient.get<ProductDetailResponse>(
    `/api/catalogs/products/${encodeURIComponent(slug)}/`,
  );
  if (!data.result) throw new Error("Product not found.");
  return data.result;
}

export async function getProductById(id: string) {
  const { data } = await publicApiClient.get<ProductDetailResponse>(
    `/api/catalogs/products/${encodeURIComponent(id)}/`,
  );
  if (!data.result) throw new Error("Product not found.");
  return data.result;
}

export async function getProviderNameBySlug(slug: string) {
  const { data } = await publicApiClient.get<ProviderDetailResponse>(
    `/api/providers/${encodeURIComponent(slug)}/`,
  );
  if (!data?.id) throw new Error("Provider not found.");
  return providerToProviderDetail(data);
}

export async function getProviderById(id: string) {
  const { data } = await publicApiClient.get<ProviderNameDetailResponse>(
    `/api/providers/${encodeURIComponent(id)}/`,
  );
  if (!data.result) throw new Error("Provider not found.");
  return data.result;
}

export async function getProviderProducts(
  providerSlug: string,
  {
    category,
    minPrice,
    maxPrice,
    isFeatured,
    sortBy,
    sortOrder,
    page = 1,
    pageSize = 20,
  }: ProviderProductsListParams = {},
) {
  const { data } = await publicApiClient.get<ProviderProductsListResponse>(
    `/api/providers/${encodeURIComponent(providerSlug)}/catalogs/products/`,
    {
      params: {
        category,
        min_price: minPrice,
        max_price: maxPrice,
        is_featured: isFeatured || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
      },
    },
  );

  return {
    ...data,
    categories: data.categories ?? [],
    results: data.results ?? [],
  };
}

export async function getProviderDoctors(providerSlug: string, page = 1) {
  const { data } = await publicApiClient.get<ProviderProductsListResponse>(
    `/api/providers/${encodeURIComponent(providerSlug)}/catalogs/`,
    { params: { type: "doctor", page } },
  );

  return {
    ...data,
    categories: data.categories ?? [],
    results: data.results ?? [],
  };
}
