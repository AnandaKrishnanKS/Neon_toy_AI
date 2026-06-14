import { MetadataRoute } from 'next';
import { query, isDbConnected } from '@/lib/db';
import { createProductSlug } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://totstore.trippytot.online';


  let productUrls: MetadataRoute.Sitemap = [];

  if (isDbConnected) {
    try {
      // Fetch all product IDs and names from the database
      const res = await query('SELECT id, name FROM products');
      
      productUrls = res.rows.map((product) => ({
        url: `${baseUrl}/product/${createProductSlug(product.id, product.name)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    } catch (error) {
      console.error('Failed to fetch products for sitemap:', error);
    }
  }

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Add other static routes as needed
  ];

  return [...routes, ...productUrls];
}
