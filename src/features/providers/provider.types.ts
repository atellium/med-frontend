export type ProviderCategory = {
  id?: number;
  slug: string;
  display_name: string;
};

export type ProviderHoursStatus = {
  status: "open" | "closing_soon" | "closed";
  next_closing_time: string | null;
  remark: string | null;
  schedule?: ProviderSchedule;
};

export type ProviderApiHourSlot = {
  opens_at: string;
  closes_at: string;
};

export type ProviderApiHourDay = {
  day: number;
  day_name: string;
  slots: ProviderApiHourSlot[];
};

export type ProviderApiHour = {
  current_opening_status: ProviderHoursStatus["status"];
  next_closing_time: string | null;
  opening_remark: string | null;
  schedule: ProviderApiHourDay[];
};

export type ProviderCity = string | {
  id?: number;
  name: string;
  state?: string;
  state_id?: number;
} | null;

export type ProviderListItem = {
  id: string;
  name: string;
  handle: string;
  slug: string;
  established_year: number | null;
  is_active: boolean;
  display_as_store: boolean;
  publication_status: string;
  last_updated: string;
  is_medicine_enquiry?: boolean;
  is_test_book?: boolean;
  categories: ProviderCategory[] | null;
  offerings: string[] | null;
  media: { thumbnail: string | null; gallery?: string[] };
  is_verified: boolean;
  hours: ProviderHoursStatus | null;
  location: {
    address: string | null;
    landmark: string;
    locality: string;
    city: ProviderCity;
    state: string;
    postal_code: string;
    display_full_address?: boolean;
    coordinates: { latitude: number; longitude: number; distance_km: number };
  };
  contact: {
    phone: string;
    whatsapp: string;
    alternate_numbers: string[] | null;
    email: string;
    website: string;
    social_urls: Record<string, string> | null;
  };
};

export type ProviderListResponse = {
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    total_items: number;
    has_next: boolean;
    has_previous: boolean;
  };
  category: { name: string; display_name: string; label: string } | null;
  results: Array<ProviderListItem | null> | null;
};

export type ProviderApiCategory = {
  id?: number;
  name: string;
  label?: string | null;
  slug: string;
  aliases?: string[] | string | null;
};

export type ProviderApiItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  distance_km: number | null;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  is_medicine_enquiry?: boolean;
  is_test_book?: boolean;
  offerings: string[] | null;
  services: string[] | null;
  facilities: string[] | null;
  contact: {
    phone: string | null;
    alternate_numbers: string[] | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
  };
  address: {
    address: string | null;
    landmark: string | null;
    locality: string;
    pincode: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  city: {
    id?: number;
    name: string;
    slug?: string;
    state?: string;
  };
  categories: ProviderApiCategory[] | null;
  hour?: ProviderApiHour | null;
};

export type ProviderApiListResponse = {
  pagination: {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    next_page: number | null;
    previous_page: number | null;
  };
  category: ProviderApiCategory | null;
  results: Array<ProviderApiItem | null> | null;
};

export type ProviderDetailResponse = ProviderApiItem & {
  seo?: {
    title: string;
    description: string;
    keywords: string;
  };
};

export type ProviderScheduleSlot = {
  opens_at: string;
  closes_at: string;
};

export type ProviderSchedule = Record<string, ProviderScheduleSlot[]>;

export type ProviderProductCategory = {
  id: number;
  name: string;
  label: string;
  slug: string;
  type: string;
  display_name: string;
  image: string | null;
};

export type ProviderProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  price_type: "fixed" | "starts_from" | string;
  price: string;
  max_price: string | null;
  original_price: string | null;
  categories?: ProviderProductCategory[] | null;
  variants?: ProductVariant[] | null;
  specifications?: Record<string, string | number | boolean | null>;
  is_featured: boolean;
  primary_image: string | null;
  sort_order?: number;
};

export type ProviderProductsListResponse = {
  provider: {
    id: string;
    name: string;
    slug: string;
  };
  categories: ProviderProductCategory[] | null;
  pagination: ProviderListResponse["pagination"];
  results: ProviderProduct[] | null;
};

export type ProviderProductsListParams = {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  isFeatured?: boolean;
  sortBy?: "price" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type ProductDetailImage = {
  image: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
};

export type ProductVariantValue = {
  value: string | number;
  unit?: string;
};

export type ProductVariant = {
  name: string;
  type: "text" | "measurement" | string;
  values: ProductVariantValue[];
};

export type ProductCustomField = {
  title: string;
  value: string;
  is_highlight?: boolean;
};

export type ProductDetail = Omit<ProviderProduct, "primary_image"> & {
  type: string;
  description: string;
  variants: ProductVariant[];
  specifications: Record<string, string | number | boolean | null>;
  custom_fields: ProductCustomField[];
  categories: ProviderProductCategory[];
  images: ProductDetailImage[];
  provider: {
    id: string;
    name: string;
    handle: string;
    slug: string;
    thumbnail: string | null;
    locality: string;
    city: { id: number; name: string; state: string };
  };
};

export type ProductDetailResponse = { result: ProductDetail | null };

export type ProviderProducts = {
  categories: ProviderProductCategory[] | null;
  items: ProviderProduct[] | null;
};

export type ProviderDetailOffer = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  is_currently_active: boolean;
  status: string;
  sort_order: number;
  terms: string[];
  created_at: string;
  updated_at: string;
};

export type ProviderNameDetail = {
  id: string;
  name: string;
  handle: string;
  slug: string;
  description: string | null;
  services: string[] | null;
  offerings: string[] | null;
  is_active: boolean;
  is_verified: boolean;
  is_medicine_enquiry?: boolean;
  is_test_book?: boolean;
  categories: ProviderCategory[] | null;
  media: {
    thumbnail: string | null;
	gallery?: string[] | null;
  };
  location: {
    address: string | null;
    landmark: string | null;
    locality: string;
    city: {
      id: number;
      name: string;
      state_id: number;
      state: string;
    };
    postal_code: string | null;
    display_full_address: boolean;
    coordinates: {
      latitude: number;
      longitude: number;
      distance_km: number | null;
    };
  };
  contact: {
    phone: string | null;
    whatsapp: string | null;
    alternate_numbers: string[] | null;
    email: string | null;
    website: string | null;
    social_urls: Record<string, string> | null;
  };
  hours: (ProviderHoursStatus & { schedule: ProviderSchedule }) | null;
  product: ProviderProducts | null;
  offers: ProviderDetailOffer[] | null;
};

export type ProviderNameDetailResponse = {
  result: ProviderNameDetail | null;
};

export type NearbyOffer = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  is_currently_active: boolean;
  status: string;
  sort_order: number;
  terms: string[];
  created_at: string;
  updated_at: string;
  distance_km: number;
  provider: {
    id: string;
    name: string;
    handle: string;
    slug: string;
    thumbnail: string | null;
    locality: string;
    city: { id: number; name: string; state: string };
  };
};

export type NearbyOffersResponse = {
  pagination: ProviderListResponse["pagination"];
  results: NearbyOffer[] | null;
};

export type DoctorSpecialty = {
  id: number;
  name: string;
  label: string;
  slug: string;
  aliases: string | null;
  body_part: string | null;
};

export type DoctorListProvider = {
  id: string;
  name: string;
  slug: string;
  cover_image?: string | null;
  distance_km: number | null;
  is_verified: boolean;
  contact: {
    phone: string | null;
    alternate_numbers: string[] | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
  };
  address: {
    address: string | null;
    landmark: string | null;
    locality: string;
    pincode: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  city: {
    id?: number;
    name: string;
    slug?: string;
  };
};

export type DoctorScheduleEntry = {
  schedule_type: "weekly" | string;
  schedule_label: string;
  weekday: number | null;
  week_of_month: number | null;
  day_of_month: number | null;
  consultation_type?: "appointment" | "walk_in" | string | null;
  start_time: string;
  end_time: string;
};

export type DoctorSchedule = {
  is_available: boolean;
  next_available: string | null;
  is_today?: boolean;
  full_schedule: DoctorScheduleEntry[];
};

export type DoctorListItem = {
  id: string;
  name: string;
  slug: string;
  profile_image?: string | null;
  qualification: string | null;
  registration_number: string | null;
  registration_council: string | null;
  registration_year: number | null;
  consultation_fee: string | null;
  consultation_type: "appointment" | "walk_in" | string | null;
  gender: string | null;
  bio: string | null;
  languages: string[] | null;
  treatments: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  specialties: DoctorSpecialty[] | null;
  provider: DoctorListProvider;
  schedule: DoctorSchedule | null;
};

export type DoctorListResponse = {
  pagination: ProviderListResponse["pagination"];
  specialty: DoctorSpecialty | null;
  results: DoctorListItem[];
};

export type DoctorApiListResponse = {
  pagination: {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    next_page: number | null;
    previous_page: number | null;
  };
  specialty: DoctorSpecialty | null;
  results: Array<DoctorListItem | null> | null;
};

export type NearbyAvailableDoctorsResponse = {
  results: Array<DoctorListItem | null> | null;
};
