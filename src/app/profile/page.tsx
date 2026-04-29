import { getUser } from '../actions';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  return <ProfileClient user={user} />;
}
