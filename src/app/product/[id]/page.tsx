import { getProduct, isDbConnected, query } from '@/lib/db';
import ProductClient from '@/components/ProductClient';
import { notFound } from 'next/navigation';
import { extractIdFromSlug, createProductSlug } from '@/lib/utils';
import type { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id: idParam } = await params;
  const id = extractIdFromSlug(idParam);
  
  if (isNaN(id)) return {};

  const product = await getProduct(id);
  if (!product) return {};

  const categoryName = product.category || 'Handmade Crafts';
  const productKeywords = [
    "totstore",
    product.name.toLowerCase(),
    categoryName.toLowerCase(),
    `buy ${product.name.toLowerCase()}`,
    `custom ${product.name.toLowerCase()}`,
    "handmade crafts",
    "custom gifts"
  ];

  // Ensure we have an absolute URL for the image
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://totstore.trippytot.online';
  let ogImageUrl = product.image_url;
  if (ogImageUrl && ogImageUrl.startsWith('/')) {
    ogImageUrl = `${siteUrl}${ogImageUrl}`;
  } else if (!ogImageUrl) {
    ogImageUrl = `${siteUrl}/logo-o.jpg`; // Fallback image
  }

  return {
    title: `${product.name} | ToTstore`,
    description: product.description.substring(0, 120),
    keywords: productKeywords,
    openGraph: {
      type: "website",
      siteName: "ToTstore",
      title: `${product.name} | ToTstore`,
      description: product.description.substring(0, 120),
      images: [
        {
          url: ogImageUrl,
          alt: `${product.name} - ToTstore`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ToTstore`,
      description: product.description.substring(0, 120),
      images: [ogImageUrl],
    },
  };
}

export async function generateStaticParams() {
  if (!isDbConnected) return [];
  try {
    const res = await query('SELECT id, name FROM products');
    return res.rows.map((product: { id: number; name: string }) => ({
      id: createProductSlug(product.id, product.name),
    }));
  } catch (e) {
    console.error('generateStaticParams error:', e);
    return [];
  }
}

export const revalidate = 0; // Dynamic rendering, always fetch fresh product info on request

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // In this version of Next.js, params MUST be awaited
  const { id: idParam } = await params;
  const id = extractIdFromSlug(idParam);
  
  if (isNaN(id)) {
    notFound();
  }

  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient 
        key={product.id}
        product={product} 
        dbConnected={isDbConnected}
      />
    </>
  );
}
