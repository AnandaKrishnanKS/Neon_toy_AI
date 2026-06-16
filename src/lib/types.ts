export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  offer_id?: number | null;
  offer_title?: string | null;
  discount_percentage?: number | null;
  badge_text?: string | null;
  offer_active?: boolean | null;
  images?: string[] | null;
  stock_count?: number;
  category?: string;
};

export type CartItem = {
  cart_item_id: number;
  product_id: number;
  name: string;
  price: number; // Discounted price
  original_price?: number; // Original price before discount
  image_url: string;
  quantity: number;
  discount_percentage?: number | null;
  badge_text?: string | null;
};

export type User = {
  name: string;
  avatar: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
};
