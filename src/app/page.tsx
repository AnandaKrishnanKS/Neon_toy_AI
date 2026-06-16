import { getProductsPaged, isDbConnected, getActiveOffers, getCategories } from '@/lib/db';
import StoreClient from '@/components/StoreClient';

export const revalidate = 0; // Dynamic rendering, always fetch fresh data on request

export default async function Home() {
  const INITIAL_PAGE_SIZE = 6;
  let products: any[] = [];
  let totalProducts = 0;
  let offers: any[] = [];
  let categories: string[] = [];

  const pagedRes = await getProductsPaged(0, INITIAL_PAGE_SIZE);
  products = pagedRes.products;
  totalProducts = pagedRes.total;
  
  if (isDbConnected) {
    offers = await getActiveOffers();
    categories = await getCategories();
  }

  return (
    <StoreClient 
      initialProducts={products} 
      dbConnected={isDbConnected}
      totalProducts={totalProducts}
      offers={offers}
      categories={categories}
    />
  );
}

