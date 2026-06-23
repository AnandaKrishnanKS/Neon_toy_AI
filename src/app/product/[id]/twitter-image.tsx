import { ImageResponse } from 'next/og';
import { getProduct } from '@/lib/db';
import { extractIdFromSlug } from '@/lib/utils';

export const alt = 'ToTstore Product Share';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: idParam } = await params;
  const id = extractIdFromSlug(idParam);
  
  if (isNaN(id)) {
    return new ImageResponse(<div>Invalid Product</div>, { ...size });
  }

  const product = await getProduct(id);
  if (!product) {
    return new ImageResponse(<div>Product Not Found</div>, { ...size });
  }

  // Ensure we have an absolute URL for the image
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://totstore.trippytot.online';
  let imageUrl = product.image_url;
  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${siteUrl}${imageUrl}`;
  } else if (!imageUrl) {
    imageUrl = `${siteUrl}/logo-o.jpg`; // Fallback image
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f0f14',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
          padding: '50px 60px',
          boxSizing: 'border-box',
          border: '8px solid #f5c842',
        }}
      >
        {/* Left Side: Text Details and CTA */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            width: '55%',
          }}
        >
          {/* Brand header */}
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#f5c842',
              letterSpacing: '2px',
            }}
          >
            ToTstore
          </div>

          {/* Product details */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: '20px',
              marginBottom: '20px',
            }}
          >
            {/* Headline */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: '1.2',
                marginBottom: '15px',
              }}
            >
              {product.name}
            </div>

            {/* Price tag */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#f5c842',
              }}
            >
              ₹{product.price}
            </div>
          </div>

          {/* Call-to-action button */}
          <div
            style={{
              background: '#f5c842',
              color: '#0f0f14',
              fontSize: '24px',
              fontWeight: 'bold',
              padding: '14px 32px',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'fit-content',
              boxShadow: '0 4px 14px rgba(245, 200, 66, 0.3)',
            }}
          >
            Shop Now →
          </div>
        </div>

        {/* Right Side: Product Image Card */}
        <div
          style={{
            width: '40%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '16px',
            border: '4px solid #1f1f2e',
            background: '#151520',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
