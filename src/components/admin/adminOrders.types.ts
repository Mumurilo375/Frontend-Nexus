export type AdminOrderUser = {
  id: number;
  username?: string | null;
  email?: string | null;
  fullName?: string | null;
  cpf?: string | null;
};

export type AdminOrderSummary = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt?: string;
  itemCount: number;
  user: AdminOrderUser | null;
};

export type AdminOrderItem = {
  id: number;
  listingId: number;
  price: number;
  createdAt?: string;
  listing: {
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
  } | null;
};

export type AdminOrderDetails = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod?: string;
  createdAt?: string;
  paymentConfirmedAt?: string | null;
  cancelledAt?: string | null;
  user: AdminOrderUser | null;
  items: AdminOrderItem[];
};
