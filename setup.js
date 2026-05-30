require('dotenv').config();
const { Pool } = require('pg');

async function setup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not set in your .env file or environment variables.');
    console.error('Please create a .env file and set DATABASE_URL=postgresql://user:password@localhost:5432/toy_store');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  const pool = new Pool({ connectionString });
  
  try {
    const client = await pool.connect();
    
    // Create products table
    console.log('Creating products table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        image_url TEXT
      );
    `);

    // Create offers table
    console.log('Creating offers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        discount_percentage INTEGER NOT NULL DEFAULT 0,
        badge_text VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        banner_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add offer_id to products
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL;
    `);

    // Seed offers
    console.log('Checking for missing offers...');
    const offersList = [
      ['Super Galactic Sale', 'Get stellar discounts on out-of-this-world spacecrafts!', 25, '25% OFF', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80'],
      ['Robo Mania', 'High-tech robotic companions and tracks at crazy low prices.', 15, 'HOT DEAL', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80'],
      ['STEM Discovery Pack', 'Expand your mind with our science and building blocks collection.', 20, 'STEM DEAL', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80']
    ];

    for (const o of offersList) {
      const checkOffer = await client.query('SELECT id FROM offers WHERE title = $1', [o[0]]);
      if (checkOffer.rows.length === 0) {
        await client.query(
          'INSERT INTO offers (title, description, discount_percentage, badge_text, banner_url) VALUES ($1, $2, $3, $4, $5)',
          o
        );
        console.log(`Inserted offer: ${o[0]}`);
      }
    }

    // Create cart and cart_items tables
    console.log('Creating cart tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        UNIQUE(cart_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        avatar TEXT,
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        zipcode VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        items JSONB NOT NULL,
        shipping_details JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed mock data
    console.log('Checking for missing products...');
    const products = [
      ['Galactic Voyager Spaceship', 'A highly detailed spaceship model with LED lights and sound effects. Perfect for young explorers.', 49.99, 'https://images.unsplash.com/photo-1585772964418-00d2cf187dfd?w=500&q=80'],
      ['Robo-Pup Interactive Pet', 'A cute robotic dog that responds to voice commands, walks, and does tricks. Your new best friend!', 34.50, 'https://images.unsplash.com/photo-1559715541-d4fc97b8d6dd?w=500&q=80'],
      ['Rainbow Unicorn Plush', 'Ultra-soft, magical unicorn plush toy with a shimmering rainbow mane and tail.', 19.99, 'https://images.unsplash.com/photo-1564470939458-1289338e2d85?w=500&q=80'],
      ['Mega Blocks Creator Set', '500+ colorful building blocks to unleash your imagination and build endless structures.', 29.99, 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&q=80'],
      ['Speedster RC Car', 'High-speed remote control car with off-road suspension and rechargeable battery.', 59.99, 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500&q=80'],
      ['Enchanted Castle Playset', 'A huge folding castle playset complete with royal figures, furniture, and working drawbridge.', 75.00, 'https://images.unsplash.com/photo-1555701825-8ac696263116?w=500&q=80'],
      ['Star Gazer Telescope', 'High-power beginner telescope with adjustable tripod and professional lenses for night sky exploration.', 89.99, 'https://images.unsplash.com/photo-1616712134411-6b6ae89bc3ba?w=500&q=80'],
      ['Dino-Dig Excavation Kit', 'A hands-on archaeology kit where kids can dig up and assemble a glow-in-the-dark T-Rex skeleton.', 24.99, 'https://images.unsplash.com/photo-1525824236856-8c0a31dfe3be?w=500&q=80'],
      ['Neon Racer Slot Car track', 'Fast-paced racing action with glow-in-the-dark track pieces and LED-equipped race cars.', 45.00, 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=500&q=80'],
      ['Creative Pottery Wheel', 'A complete pottery studio for kids, including clay, tools, and a motorized spinning wheel.', 39.99, 'https://images.unsplash.com/photo-1565191999001-551c187427bb?w=500&q=80'],
      ['Master Magician Set', 'Learn over 50 professional magic tricks with this comprehensive set including a magic wand and hat.', 29.50, 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?w=500&q=80'],
      ['Solar System Planetarium', 'Build and paint your own moving model of the solar system with glow-in-the-dark paint.', 22.99, 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bac4?w=500&q=80'],
      ['Retro Arcade Machine', 'A mini tabletop arcade machine featuring 200 classic built-in 16-bit games.', 55.00, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80'],
      ['Aqua-Bot Submarine', 'Remote-controlled submarine with built-in camera and powerful LED headlights for pool exploration.', 120.00, 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=500&q=80'],
      ['Magnetic Master Tiles', '100-piece magnetic building set for 3D architecture and geometric pattern learning.', 49.99, 'https://images.unsplash.com/photo-1515488411204-629007f9c2d6?w=500&q=80']
    ];

    for (const p of products) {
      const checkResult = await client.query('SELECT id FROM products WHERE name = $1', [p[0]]);
      if (checkResult.rows.length === 0) {
        await client.query(
          'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4)',
          p
        );
        console.log(`Inserted: ${p[0]}`);
      }
    }
    console.log('Successfully completed database seeding check!');

    // Link products to offers
    console.log('Linking products to offers...');
    const productOfferMappings = {
      'Galactic Voyager Spaceship': 'Super Galactic Sale',
      'Robo-Pup Interactive Pet': 'Robo Mania',
      'Neon Racer Slot Car track': 'Robo Mania',
      'Star Gazer Telescope': 'STEM Discovery Pack',
      'Solar System Planetarium': 'STEM Discovery Pack'
    };

    for (const [prodName, offerTitle] of Object.entries(productOfferMappings)) {
      await client.query(`
        UPDATE products 
        SET offer_id = (SELECT id FROM offers WHERE title = $1)
        WHERE name = $2 AND (offer_id IS NULL OR offer_id != (SELECT id FROM offers WHERE title = $1))
      `, [offerTitle, prodName]);
      console.log(`Linked product "${prodName}" to offer "${offerTitle}"`);
    }

    client.release();
    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error settling up database:', error);
    process.exit(1);
  }
}

setup();
