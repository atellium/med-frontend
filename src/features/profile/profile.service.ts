import { protectedApiClient } from "@/lib/api";
import { normalizeProviderHours } from "@/features/providers/provider.utils";
import type { ProviderApiItem } from "@/features/providers/provider.types";
import type { ProviderCategoryOption, ProviderCityOption, ProviderGalleryImage, ProviderGalleryResponse, ProviderGalleryUpload, ProviderGalleryUploadTicket, ProviderHoursUpdatePayload, ProviderUpdatePayload, OwnedProviderInfo, OwnedProviderInfoResponse, OwnedProvider, OwnedProvidersApiResponse, OwnedProvidersResponse, DoctorUpsertPayload } from "./profile.types";
import type { CatalogCategorySearchResponse, CatalogDetailResponse, CatalogGalleryImage, CatalogGalleryResponse, CatalogImageUpload, CatalogImageUploadTicket, CatalogPayload } from "./catalog.types";
import type { ProviderOfferResponse, ProviderOffersResponse } from "./offer.types";

type OwnedProviderInfoPayload = Omit<OwnedProviderInfo, "seo"> & { seo: OwnedProviderInfo["seo"] | null };

function normalizeOwnedProviderInfo(provider: OwnedProviderInfoPayload) {
  return {
    ...provider,
    seo: provider.seo ?? {
      title: null,
      description: null,
      keywords: null,
    },
  };
}

export async function getOwnedProviders() {
  const { data } = await protectedApiClient.get<OwnedProvidersApiResponse>(
    "/api/providers/my/",
  );

  return {
    pagination: {
      page: data.pagination.page,
      page_size: data.pagination.page_size,
      total_pages: data.pagination.total_pages,
      total_items: data.pagination.count,
      has_next: data.pagination.next_page !== null,
      has_previous: data.pagination.previous_page !== null,
    },
    category: null,
    results: (data.results ?? []).filter(
      (provider): provider is NonNullable<typeof provider> => provider !== null,
    ).map(apiProviderToOwnedProvider),
  } satisfies OwnedProvidersResponse;
}

function providerCategoryLabel(category: { label?: string | null; name: string }) {
  return category.label?.trim() || category.name;
}

function apiProviderToOwnedProvider(provider: ProviderApiItem): OwnedProvider {
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
        latitude: provider.address.latitude ?? 0,
        longitude: provider.address.longitude ?? 0,
        distance_km: provider.distance_km,
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

function providerInfoFromResponse(data: OwnedProviderInfoResponse | OwnedProviderInfoPayload) {
  return "result" in data ? data.result : data;
}

export async function searchCatalogCategories(search: string, type?: "product" | "specialty") {
  const { data } = await protectedApiClient.get<CatalogCategorySearchResponse>("/api/catalogs/categories/", { params: { search, type } });
  return (data.results ?? []).map((category) => ({
    ...category,
    display_name: category.name,
  }));
}

function providerDoctorsUrl(providerId: string) {
  return `/api/providers/my/${encodeURIComponent(providerId)}/doctors/`;
}

export async function createDoctor(providerId: string, payload: DoctorUpsertPayload | FormData) {
  const { data } = await protectedApiClient.post(providerDoctorsUrl(providerId), payload);
  return data;
}

export async function updateDoctor(providerId: string, doctorId: string, payload: DoctorUpsertPayload | FormData) {
  const { data } = await protectedApiClient.patch(`${providerDoctorsUrl(providerId)}${encodeURIComponent(doctorId)}/`, payload);
  return data;
}

export async function deleteDoctor(providerId: string, doctorId: string) {
  await protectedApiClient.delete(`${providerDoctorsUrl(providerId)}${encodeURIComponent(doctorId)}/`);
}

export async function createCatalog(providerSlug: string, payload: CatalogPayload) {
  const { data } = await protectedApiClient.post(`/api/providers/mine/${encodeURIComponent(providerSlug)}/catalogs/`, payload);
  return data;
}

export async function getCatalogDetails(providerSlug: string, catalogSlug: string) {
  const { data } = await protectedApiClient.get<CatalogDetailResponse>(`/api/providers/mine/${encodeURIComponent(providerSlug)}/catalogs/${encodeURIComponent(catalogSlug)}/details/`);
  if (!data.result) throw new Error("Catalog details returned no result.");
  return {
    ...data.result,
    categories: (data.result.categories ?? []).map((category) => ({
      ...category,
      display_name: category.display_name || category.label || category.name,
    })),
  };
}

export async function updateCatalog(providerSlug: string, catalogSlug: string, payload: CatalogPayload) {
  const { data } = await protectedApiClient.patch(`/api/providers/mine/${encodeURIComponent(providerSlug)}/catalogs/${encodeURIComponent(catalogSlug)}/`, payload);
  return data;
}

export async function updateCatalogViaEditEndpoint(providerSlug: string, catalogSlug: string, payload: CatalogPayload) {
  const { data } = await protectedApiClient.patch(`/api/providers/mine/${encodeURIComponent(providerSlug)}/catalogs/${encodeURIComponent(catalogSlug)}/edit/`, payload);
  return data;
}

export async function deleteCatalog(providerSlug: string, catalogSlug: string) {
  await protectedApiClient.delete(`/api/providers/mine/${encodeURIComponent(providerSlug)}/catalogs/${encodeURIComponent(catalogSlug)}/`);
}

function catalogImagesUrl(providerSlug: string, catalogSlug: string) {
  return `/api/providers/mine/${encodeURIComponent(providerSlug)}/catalogs/${encodeURIComponent(catalogSlug)}/images/`;
}

export async function getCatalogImages(providerSlug: string, catalogSlug: string) {
  const { data } = await protectedApiClient.get<CatalogGalleryResponse>(catalogImagesUrl(providerSlug, catalogSlug));
  return [...(data.results ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function createCatalogImages(providerSlug: string, catalogSlug: string, formData: FormData) {
  const { data } = await protectedApiClient.post<CatalogGalleryResponse>(catalogImagesUrl(providerSlug, catalogSlug), formData);
  return data.results ?? [];
}

export async function updateCatalogImages(providerSlug: string, catalogSlug: string, formData: FormData) {
  const { data } = await protectedApiClient.patch<CatalogGalleryResponse>(catalogImagesUrl(providerSlug, catalogSlug), formData);
  return data.results ?? [];
}

function catalogImageUploadsUrl(providerSlug: string, catalogSlug: string) {
  return `${catalogImagesUrl(providerSlug, catalogSlug)}uploads/`;
}

export async function uploadCatalogImage(providerSlug: string, catalogSlug: string, file: File): Promise<CatalogGalleryImage> {
  const baseUrl = catalogImageUploadsUrl(providerSlug, catalogSlug);
  const { data: ticket } = await protectedApiClient.post<CatalogImageUploadTicket>(baseUrl, { content_type: file.type });
  const response = await fetch(ticket.upload_url, { method: "PUT", headers: { "Content-Type": ticket.content_type }, body: file });
  if (!response.ok) throw new Error("Direct product image upload failed.");
  await protectedApiClient.post(`${baseUrl}${ticket.id}/complete/`);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const { data } = await protectedApiClient.get<CatalogImageUpload>(`${baseUrl}${ticket.id}/`);
    if (data.status === "ready" && data.image) return data.image;
    if (data.status === "failed") throw new Error(data.error || "Product image processing failed.");
    await wait(750);
  }
  throw new Error("Product image processing is taking longer than expected.");
}

export async function uploadCatalogImages(providerSlug: string, catalogSlug: string, files: File[]) {
  if (files.length > 20) throw new Error("You can upload a maximum of 20 product images.");
  const results: CatalogGalleryImage[] = new Array(files.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < files.length) {
      const index = nextIndex++;
      results[index] = await uploadCatalogImage(providerSlug, catalogSlug, files[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, files.length) }, () => worker()));
  return results;
}

export async function getOwnedProviderInfo(slug: string) {
  const { data } = await protectedApiClient.get<OwnedProviderInfoResponse>(
    `/api/providers/mine/${encodeURIComponent(slug)}/`,
  );
  if (!data.result) throw new Error("Provider not found.");
  return normalizeOwnedProviderInfo(data.result);
}

export async function updateOwnedProvider(providerId: string, payload: ProviderUpdatePayload | FormData) {
  const { data } = await protectedApiClient.patch<OwnedProviderInfoResponse | OwnedProviderInfoPayload>(`/api/providers/my/${encodeURIComponent(providerId)}/`, payload);
  const provider = providerInfoFromResponse(data);
  if (!provider) throw new Error("Provider update returned no result.");
  return normalizeOwnedProviderInfo(provider);
}

export async function updateProviderHours(slug: string, payload: ProviderHoursUpdatePayload) {
  await protectedApiClient.patch(
    `/api/providers/${encodeURIComponent(slug)}/hours/`,
    payload,
  );
}

function providerGalleryUrl(slug: string) {
  return `/api/providers/mine/${encodeURIComponent(slug)}/gallery/`;
}

export async function getProviderGallery(slug: string) {
  const { data } = await protectedApiClient.get<ProviderGalleryResponse>(providerGalleryUrl(slug));
  return data.results ?? [];
}

export async function updateProviderGallery(slug: string, payload: FormData) {
  const { data } = await protectedApiClient.patch<ProviderGalleryResponse>(providerGalleryUrl(slug), payload);
  return data.results ?? [];
}

function providerGalleryUploadsUrl(slug: string) {
  return `${providerGalleryUrl(slug)}uploads/`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export async function uploadProviderGalleryImage(slug: string, file: File): Promise<ProviderGalleryImage> {
  const { data: ticket } = await protectedApiClient.post<ProviderGalleryUploadTicket>(
    providerGalleryUploadsUrl(slug),
    { content_type: file.type },
  );
  const uploadResponse = await fetch(ticket.upload_url, {
    method: "PUT",
    headers: { "Content-Type": ticket.content_type },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error("Direct image upload failed.");
  await protectedApiClient.post(`${providerGalleryUploadsUrl(slug)}${ticket.id}/complete/`);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const { data } = await protectedApiClient.get<ProviderGalleryUpload>(
      `${providerGalleryUploadsUrl(slug)}${ticket.id}/`,
    );
    if (data.status === "ready" && data.image) return data.image;
    if (data.status === "failed") throw new Error(data.error || "Image processing failed.");
    await wait(750);
  }
  throw new Error("Image processing is taking longer than expected. Refresh the gallery shortly.");
}

export async function uploadProviderGalleryImages(slug: string, files: File[]) {
  const results: ProviderGalleryImage[] = new Array(files.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < files.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await uploadProviderGalleryImage(slug, files[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, files.length) }, () => worker()));
  return results;
}

async function uploadProviderAsset(slug: string, file: File, initiateUrl: string) {
  const { data: ticket } = await protectedApiClient.post<ProviderGalleryUploadTicket>(initiateUrl, { content_type: file.type });
  const response = await fetch(ticket.upload_url, { method: "PUT", headers: { "Content-Type": ticket.content_type }, body: file });
  if (!response.ok) throw new Error("Direct image upload failed.");
  const statusUrl = `${providerGalleryUploadsUrl(slug)}${ticket.id}/`;
  await protectedApiClient.post(`${statusUrl}complete/`);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const { data } = await protectedApiClient.get<ProviderGalleryUpload>(statusUrl);
    if (data.status === "ready") return data;
    if (data.status === "failed") throw new Error(data.error || "Image processing failed.");
    await wait(750);
  }
  throw new Error("Image processing is taking longer than expected.");
}

export async function uploadProviderThumbnail(slug: string, file: File) {
  await uploadProviderAsset(slug, file, `/api/providers/mine/${encodeURIComponent(slug)}/thumbnail/uploads/`);
  return getOwnedProviderInfo(slug);
}

export async function uploadProviderOfferImage(slug: string, offerId: string, file: File) {
  return uploadProviderAsset(slug, file, `${providerOffersUrl(slug)}${encodeURIComponent(offerId)}/image/uploads/`);
}

function providerOffersUrl(slug: string) {
  return `/api/providers/mine/${encodeURIComponent(slug)}/offers/`;
}

export async function getProviderOffers(slug: string) {
  const { data } = await protectedApiClient.get<ProviderOffersResponse>(providerOffersUrl(slug));
  return data.results ?? [];
}

export async function createProviderOffer(slug: string, payload: FormData) {
  const { data } = await protectedApiClient.post<ProviderOfferResponse>(providerOffersUrl(slug), payload);
  if (!data.result) throw new Error("Offer creation returned no result.");
  return data.result;
}

export async function updateProviderOffer(slug: string, offerId: string, payload: FormData) {
  const { data } = await protectedApiClient.patch<ProviderOfferResponse>(`${providerOffersUrl(slug)}${encodeURIComponent(offerId)}/`, payload);
  if (!data.result) throw new Error("Offer update returned no result.");
  return data.result;
}

export async function deleteProviderOffer(slug: string, offerId: string) {
  await protectedApiClient.delete(`${providerOffersUrl(slug)}${encodeURIComponent(offerId)}/`);
}

export async function searchProviderCategories(search: string) {
  const { data } = await protectedApiClient.get<{ results: ProviderCategoryOption[] | null }>("/api/categories/provider/", { params: { search } });
  return (data.results ?? []).map((category) => ({
    ...category,
    display_name: category.name,
  }));
}

export async function searchProviderCities(search: string) {
  const { data } = await protectedApiClient.get<ProviderCityOption[]>("/api/locations/cities/", { params: { search } });
  return data;
}
