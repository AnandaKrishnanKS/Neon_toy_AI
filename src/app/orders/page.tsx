import { getUser, getUserOrders, getUserCustomEnquiries } from '../actions';
import { redirect } from 'next/navigation';
import OrdersClient from '@/components/OrdersClient';

export default async function OrdersPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const [orders, customEnquiries] = await Promise.all([
    getUserOrders(),
    getUserCustomEnquiries()
  ]);

  return <OrdersClient user={user} orders={orders} customEnquiries={customEnquiries} />;
}
