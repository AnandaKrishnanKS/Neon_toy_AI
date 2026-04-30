import { getProductsPaged, isDbConnected } from '@/lib/db';
import StoreClient from '@/components/StoreClient';
import { getCart, getUser } from './actions';

export default async function Home() {
  const INITIAL_PAGE_SIZE = 6;
  let products: any[] = [];
  let totalProducts = 0;
  let cartItems: any[] = [];
  const user = await getUser();

  const pagedRes = await getProductsPaged(0, INITIAL_PAGE_SIZE);
  products = pagedRes.products;
  totalProducts = pagedRes.total;
  
  if (isDbConnected) {
    const cartRes = await getCart();
    cartItems = cartRes.items || [];
  }

  return (
    <StoreClient 
      initialProducts={products} 
      initialCart={cartItems} 
      dbConnected={isDbConnected}
      user={user}
      totalProducts={totalProducts}
    />
  );
}
