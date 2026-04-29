import { getUser, getCart } from '../actions';
import { redirect } from 'next/navigation';
import CheckoutClient from '@/components/CheckoutClient';
import { isDbConnected } from '@/lib/db';

export default async function CheckoutPage() {
  const user = await getUser();



  const cartRes = await getCart();
  const cartItems = cartRes.items || [];
  const cartTotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  if (cartItems.length === 0) {
    redirect('/');
  }

  return (
    <CheckoutClient 
      user={user} 
      cartItems={cartItems} 
      cartTotal={cartTotal} 
    />
  );
}
