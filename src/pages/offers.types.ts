export type OfferListing = {
  id: number;
  price?: number;
  game: {
    id: number;
    title?: string | null;
    coverImageUrl?: string | null;
  } | null;
  platform: {
    id: number;
    name?: string | null;
  } | null;
  pricing: {
    basePrice: number;
    finalPrice: number;
  };
};

export type OfferItem = {
  id: number;
  name: string;
  description?: string | null;
  discountPercentage: number;
  listings: OfferListing[];
};
