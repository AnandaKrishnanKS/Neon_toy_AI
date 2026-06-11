import { Pool } from 'pg';

// If DATABASE_URL is not set, we'll indicate that the app is in "mock" mode
const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

if (connectionString) {
  pool = new Pool({ connectionString });
}

export const isDbConnected = !!pool;

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
};

export async function getActiveOffers(): Promise<any[]> {
  try {
    const res = await query('SELECT * FROM offers WHERE is_active = true ORDER BY id ASC');
    return res.rows;
  } catch (error) {
    console.error('Error fetching active offers:', error);
    return [];
  }
}

export async function getProductsPaged(offset: number, limit: number): Promise<{ products: Product[], total: number }> {
  const totalRes = await query('SELECT COUNT(*) FROM products');
  const productsRes = await query(
    `SELECT p.*, o.title as offer_title, o.discount_percentage, o.badge_text, o.is_active as offer_active
     FROM products p
     LEFT JOIN offers o ON p.offer_id = o.id
     ORDER BY p.id ASC LIMIT $1 OFFSET $2`, 
    [limit, offset]
  );
  return { 
    products: productsRes.rows, 
    total: parseInt(totalRes.rows[0].count) 
  };
}

export async function getProduct(id: number): Promise<Product | null> {
  const res = await query(
    `SELECT p.*, o.title as offer_title, o.discount_percentage, o.badge_text, o.is_active as offer_active
     FROM products p
     LEFT JOIN offers o ON p.offer_id = o.id
     WHERE p.id = $1`, 
    [id]
  );
  if (res.rows.length > 0) return res.rows[0];
  return null;
}

export async function getTermsAndConditions(): Promise<{ content: string; updated_at: Date } | null> {
  try {
    const res = await query('SELECT content, updated_at FROM terms_conditions ORDER BY id DESC LIMIT 1');
    if (res.rows.length > 0) {
      return {
        content: res.rows[0].content,
        updated_at: res.rows[0].updated_at
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching terms and conditions:', error);
    return null;
  }
}

export async function query(sql: string, params?: any[]) {
  if (!pool) {
    throw new Error('Database is not configured. Missing DATABASE_URL.');
  }
  return pool.query(sql, params);
}
