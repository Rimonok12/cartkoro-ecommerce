// pages/_app.js (or _app.tsx)
import '@/styles/globals.css';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Outfit } from 'next/font/google';
import { AppContextProvider } from '@/context/AppContext';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500'] });

// Your Pixel ID
const FB_PIXEL_ID = '687447924417053';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Track a PageView on route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    <>
      <Head>
        <title>
          {productName ? `${productName} | CartKoro` : 'CartKoro Product'}
        </title>
        <meta
          name="description"
          content={(productDesc || 'Buy online at CartKoro.').slice(0, 155)}
        />
        <link
          rel="canonical"
          href={`https://www.cartkoro.com/product/${selectedSku?._id || ''}`}
        />

        {/* Open Graph */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={productName || 'CartKoro Product'} />
        <meta
          property="og:description"
          content={(productDesc || 'Buy online at CartKoro.').slice(0, 200)}
        />
        {mainImage && <meta property="og:image" content={mainImage} />}
        <meta
          property="og:url"
          content={`https://www.cartkoro.com/product/${selectedSku?._id || ''}`}
        />

        {/* JSON-LD Product schema */}
        <script
          key="product-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: productName,
              description: productDesc,
              image: mainImage ? [mainImage] : undefined,
              sku: selectedSku?._id,
              brand: { '@type': 'Brand', name: brandName || 'CartKoro' },
              offers: {
                '@type': 'Offer',
                url: `https://www.cartkoro.com/product/${
                  selectedSku?._id || ''
                }`,
                priceCurrency: 'BDT',
                price: selectedSku?.SP ?? undefined,
                availability:
                  selectedSku?.left_stock > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
              },
            }),
          }}
        />
      </Head>

      {/* Meta Pixel base code */}
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){
            if(f.fbq) return; n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq) f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0';
            n.queue=[]; t=b.createElement(e); t.async=!0;
            t.src=v; s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
          }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      {/* noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      <div className={`${outfit.className} antialiased text-gray-700`}>
        <AppContextProvider
          initialUserData={pageProps.initialUserData}
          initialCartData={pageProps.initialCartData}
          initialCashbackData={pageProps.initialCashbackData}
          initialRecentAddress={pageProps.initialRecentAddress}
        >
          <Toaster />
          <Component {...pageProps} />
        </AppContextProvider>
      </div>
    </>
  );
}
