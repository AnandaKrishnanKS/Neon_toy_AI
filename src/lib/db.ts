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

// Mock data fallback
export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Galactic Voyager Spaceship',
    description: 'A highly detailed spaceship model with LED lights and sound effects. Perfect for young explorers.',
    price: 49.99,
    image_url: 'https://images.unsplash.com/photo-1585772964418-00d2cf187dfd?w=500&q=80',
  },
  {
    id: 2,
    name: 'Robo-Pup Interactive Pet',
    description: 'A cute robotic dog that responds to voice commands, walks, and does tricks. Your new best friend!',
    price: 34.50,
    image_url: 'https://images.unsplash.com/photo-1559715541-d4fc97b8d6dd?w=500&q=80',
  },
  {
    id: 3,
    name: 'Rainbow Unicorn Plush',
    description: 'Ultra-soft, magical unicorn plush toy with a shimmering rainbow mane and tail.',
    price: 19.99,
    image_url: 'https://images.unsplash.com/photo-1564470939458-1289338e2d85?w=500&q=80',
  },
  {
    id: 4,
    name: 'Mega Blocks Creator Set',
    description: '500+ colorful building blocks to unleash your imagination and build endless structures.',
    price: 29.99,
    image_url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&q=80',
  },
  {
    id: 5,
    name: 'Speedster RC Car',
    description: 'High-speed remote control car with off-road suspension and rechargeable battery.',
    price: 59.99,
    image_url: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500&q=80',
  },
  {
    id: 6,
    name: 'Enchanted Castle Playset',
    description: 'A huge folding castle playset complete with royal figures, furniture, and working drawbridge.',
    price: 75.00,
    image_url: 'https://images.unsplash.com/photo-1555701825-8ac696263116?w=500&q=80',
  },
  {
    id: 7,
    name: 'Star Gazer Telescope',
    description: 'High-power beginner telescope with adjustable tripod and professional lenses for night sky exploration.',
    price: 89.99,
    image_url: 'https://images.unsplash.com/photo-1616712134411-6b6ae89bc3ba?w=500&q=80',
  },
  {
    id: 8,
    name: 'Dino-Dig Excavation Kit',
    description: 'A hands-on archaeology kit where kids can dig up and assemble a glow-in-the-dark T-Rex skeleton.',
    price: 24.99,
    image_url: 'https://images.unsplash.com/photo-1525824236856-8c0a31dfe3be?w=500&q=80',
  },
  {
    id: 9,
    name: 'Neon Racer Slot Car Track',
    description: 'Fast-paced racing action with glow-in-the-dark track pieces and LED-equipped race cars.',
    price: 45.00,
    image_url: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=500&q=80',
  },
  {
    id: 10,
    name: 'Creative Pottery Wheel',
    description: 'A complete pottery studio for kids, including clay, tools, and a motorized spinning wheel.',
    price: 39.99,
    image_url: 'https://images.unsplash.com/photo-1565191999001-551c187427bb?w=500&q=80',
  },
  {
    id: 11,
    name: 'Master Magician Set',
    description: 'Learn over 50 professional magic tricks with this comprehensive set including a magic wand and hat.',
    price: 29.50,
    image_url: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?w=500&q=80',
  },
  {
    id: 12,
    name: 'Solar System Planetarium',
    description: 'Build and paint your own moving model of the solar system with glow-in-the-dark paint.',
    price: 22.99,
    image_url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bac4?w=500&q=80',
  },
  {
    id: 13,
    name: 'Retro Arcade Machine',
    description: 'A mini tabletop arcade machine featuring 200 classic built-in 16-bit games.',
    price: 55.00,
    image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
  },
  {
    id: 14,
    name: 'Aqua-Bot Submarine',
    description: 'Remote-controlled submarine with built-in camera and powerful LED headlights for pool exploration.',
    price: 120.00,
    image_url: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=500&q=80',
  },
  {
    id: 15,
    name: 'Magnetic Master Tiles',
    description: '100-piece magnetic building set for 3D architecture and geometric pattern learning.',
    price: 49.99,
    image_url: 'https://images.unsplash.com/photo-1515488411204-629007f9c2d6?w=500&q=80',
  }
];

export async function getProductsPaged(offset: number, limit: number): Promise<{ products: Product[], total: number }> {
  if (isDbConnected) {
    try {
      const totalRes = await query('SELECT COUNT(*) FROM products');
      const productsRes = await query(
        'SELECT * FROM products ORDER BY id ASC LIMIT $1 OFFSET $2', 
        [limit, offset]
      );
      return { 
        products: productsRes.rows, 
        total: parseInt(totalRes.rows[0].count) 
      };
    } catch (e) {
      console.error('Error fetching paged products:', e);
    }
  }
  
  return {
    products: mockProducts.slice(offset, offset + limit),
    total: mockProducts.length
  };
}

export async function getProduct(id: number): Promise<Product | null> {
  if (isDbConnected) {
    try {
      const res = await query('SELECT * FROM products WHERE id = $1', [id]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (e) {
      console.error('Error fetching product:', e);
    }
  }
  return mockProducts.find(p => p.id === id) || null;
}

export async function query(sql: string, params?: any[]) {
  if (!pool) {
    throw new Error('Database is not configured. Missing DATABASE_URL.');
  }
  return pool.query(sql, params);
}
