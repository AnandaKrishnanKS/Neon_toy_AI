import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'ToTstore';
    const price = searchParams.get('price') || '';
    const imageUrl = searchParams.get('image') || '';

    // If no specific image is provided, fall back to logo
    const fallbackImage = 'https://totstore.trippytot.online/logo-o.jpg';
    const finalImageUrl = imageUrl || fallbackImage;

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              width: '55%',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#f5c842',
                letterSpacing: '2px',
                display: 'flex',
              }}
            >
              ToTstore
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: '20px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: '1.2',
                  marginBottom: '15px',
                  display: 'flex',
                }}
              >
                {title}
              </div>

              {price && (
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#f5c842',
                    display: 'flex',
                  }}
                >
                  ₹{price}
                </div>
              )}
            </div>

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
                width: 200,
                boxShadow: '0 4px 14px rgba(245, 200, 66, 0.3)',
              }}
            >
              Shop Now →
            </div>
          </div>

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
            <img
              src={finalImageUrl}
              alt={title}
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
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error('OG API Route error:', err);
    return new ImageResponse(
      (
        <div
          style={{
            background: '#0f0f14',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'sans-serif',
            border: '8px solid #f5c842',
          }}
        >
          <div style={{ fontSize: '64px', color: '#f5c842', fontWeight: 'bold', marginBottom: '10px' }}>ToTstore</div>
          <div style={{ fontSize: '28px', color: '#888' }}>Handmade Crafts & Custom Gifts</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
