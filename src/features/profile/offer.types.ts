export type ProviderOffer = {
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

export type ProviderOffersResponse = {
  results: ProviderOffer[] | null;
};

export type ProviderOfferResponse = {
  result: ProviderOffer | null;
};
