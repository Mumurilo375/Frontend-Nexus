export type AdminPriceHistoryItem = {
  id: number;
  listingId: number;
  previousPrice: number | null;
  nextPrice: number;
  createdAt?: string;
  game: {
    id: number;
    title?: string | null;
  } | null;
  platform: {
    id: number;
    name?: string | null;
    slug?: string | null;
  } | null;
  changedBy: {
    id: number;
    username?: string | null;
    email?: string | null;
  } | null;
};
