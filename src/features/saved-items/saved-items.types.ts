import type { ProviderListItem, ProviderProduct } from "@/features/providers/provider.types";

export type SavedItemType = "provider" | "product" | (string & {});

export type SavedProvider = Omit<ProviderListItem, "display_as_store" | "location"> & {
  display_as_store?: boolean;
  location: Omit<ProviderListItem["location"], "coordinates" | "state"> & {
    state?: string;
    coordinates: Omit<ProviderListItem["location"]["coordinates"], "distance_km"> & { distance_km: number | null };
  };
};

export type SavedProduct = Omit<ProviderProduct, "short_description"> & {
  public_id?: string;
  short_description?: string;
};

export type SavedItemPayload = SavedProvider | SavedProduct | (Record<string, unknown> & { id?: string; name?: string; slug?: string });

export type SavedItem = {
  id: string;
  item_type: SavedItemType;
  object_id: string;
  created_at: string;
  item: SavedItemPayload;
};

export type SavedItemsResponse = { count: number; next: string | null; previous: string | null; results: SavedItem[] };
export type SaveItemResponse = { result: SavedItem };
