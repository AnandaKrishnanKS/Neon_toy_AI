import { NextResponse } from 'next/server';
import { getCart } from '@/app/actions';

export async function GET() {
  const cartRes = await getCart();
  return NextResponse.json(cartRes, {
    headers: {
      'Cache-Control': 'private, no-cache, max-age=0, must-revalidate',
    },
  });
}
