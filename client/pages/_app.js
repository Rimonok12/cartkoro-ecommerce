import "@/styles/globals.css";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { Outfit } from "next/font/google";
import { AppContextProvider } from "@/context/AppContext";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>CartKoro - Online Shopping Site For Fashion, Electronics</title>
        <meta
          name="description"
          content="CartKoro - Online Trusted Shopping Site For You, easy purchasing online site"
        />
        <meta
          name="keywords"
          content="CartKoro, online shopping, gadgets, electronics, watch, earphone, fashion, cloth"
        />
        <link rel="canonical" href="https://www.cartkoro.com/" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="CartKoro Online Shop" />
        <meta property="og:description" content="Buy gadgets, electronics, and more online at CartKoro." />
        <meta property="og:url" content="https://www.cartkoro.com/" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/1.png" />
      </Head>

      {/* Apply font + global text styles app-wide */}
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
