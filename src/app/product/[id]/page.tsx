import { getProduct, isDbConnected } from '@/lib/db';
import { getCart, getUser } from '@/app/actions';
import ProductClient from '@/components/ProductClient';
import { notFound } from 'next/navigation';
import { extractIdFromSlug } from '@/lib/utils';

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

  const user = await getUser();
  let cartItems = [];

  if (isDbConnected) {
    try {
      const cartRes = await getCart();
      cartItems = cartRes.items || [];
    } catch (e) {
      console.error('Failed to fetch from db:', e);
    }
  }

  return (
    <ProductClient 
      product={product} 
      initialCart={cartItems} 
      dbConnected={isDbConnected}
      user={user}
    />
  );
}
