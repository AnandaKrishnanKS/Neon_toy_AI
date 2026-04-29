export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
};

export type CartItem = {
  cart_item_id: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
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
