import { Pool } from 'pg';

// If DATABASE_URL is not set, we'll indicate that the app is in "mock" mode
const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

if (connectionString) {
  pool = new Pool({ connectionString });
}

export const isDbConnected = !!pool;

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
};

export async function getProductsPaged(offset: number, limit: number): Promise<{ products: Product[], total: number }> {
  const totalRes = await query('SELECT COUNT(*) FROM products');
  const productsRes = await query(
    'SELECT * FROM products ORDER BY id ASC LIMIT $1 OFFSET $2', 
    [limit, offset]
  );
  return { 
    products: productsRes.rows, 
    total: parseInt(totalRes.rows[0].count) 
  };
}

export async function getProduct(id: number): Promise<Product | null> {
  const res = await query('SELECT * FROM products WHERE id = $1', [id]);
  if (res.rows.length > 0) return res.rows[0];
  return null;
}

export async function query(sql: string, params?: any[]) {
  if (!pool) {
    throw new Error('Database is not configured. Missing DATABASE_URL.');
  }
  return pool.query(sql, params);
}
