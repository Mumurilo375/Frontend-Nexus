export type OfferItem = {
  id: number;
  name: string;
  description?: string | null;
  discountPercentage: number;
  listing: {
    id: number;
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
  } | null;
};
