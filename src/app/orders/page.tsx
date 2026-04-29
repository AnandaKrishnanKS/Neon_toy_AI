import { getUser, getUserOrders } from '../actions';
import { redirect } from 'next/navigation';
import OrdersClient from '@/components/OrdersClient';

export default async function OrdersPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const orders = await getUserOrders();

  return <OrdersClient user={user} orders={orders} />;
}
