export type AdminOfferListingOption = {
  id: number;
  price?: number | string;
  isActive?: boolean;
  game?: {
    id?: number;
    title?: string;
  };
  platform?: {
    id?: number;
    name?: string;
    slug?: string;
  };
};

export type AdminOfferListing = {
  id: number;
  price: number;
  isActive: boolean;
  game: {
    id: number;
    title?: string | null;
    coverImageUrl?: string | null;
  } | null;
  platform: {
    id: number;
    name?: string | null;
    slug?: string | null;
  } | null;
  pricing: {
    basePrice: number;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
    hasDiscount: boolean;
  };
};

export type AdminOfferItem = {
  id: number;
  name: string;
  description?: string | null;
  discountPercentage: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  listingIds: number[];
  listings: AdminOfferListing[];
};

export type AdminOfferFormState = {
  name: string;
  description: string;
  discountPercentage: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  platformId: string;
};

export function createEmptyOfferFormState(): AdminOfferFormState {
  return {
    name: "",
    description: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    isActive: true,
    platformId: "",
  };
}
