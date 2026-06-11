import { getProductsPaged, isDbConnected, getActiveOffers } from '@/lib/db';
import StoreClient from '@/components/StoreClient';

export default async function Home() {
  const INITIAL_PAGE_SIZE = 6;
  let products: any[] = [];
  let totalProducts = 0;
  let offers: any[] = [];

  const pagedRes = await getProductsPaged(0, INITIAL_PAGE_SIZE);
  products = pagedRes.products;
  totalProducts = pagedRes.total;
  
  if (isDbConnected) {
    offers = await getActiveOffers();
  }

  return (
    <StoreClient 
      initialProducts={products} 
      dbConnected={isDbConnected}
      totalProducts={totalProducts}
      offers={offers}
    />
  );
}
