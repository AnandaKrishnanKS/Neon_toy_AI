import { getProduct, isDbConnected, query } from '@/lib/db';
import ProductClient from '@/components/ProductClient';
import { notFound } from 'next/navigation';
import { extractIdFromSlug, createProductSlug } from '@/lib/utils';

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
