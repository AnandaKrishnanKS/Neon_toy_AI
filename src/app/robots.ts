import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://totstore.trippytot.online';


  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/checkout', '/orders', '/profile'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
