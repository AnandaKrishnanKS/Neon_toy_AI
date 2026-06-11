import { NextResponse } from 'next/server';
import { getUser } from '@/app/actions';

export async function GET() {
  const user = await getUser();
  return NextResponse.json(user, {
    headers: {
      'Cache-Control': 'private, no-cache, max-age=0, must-revalidate',
    },
  });
}
