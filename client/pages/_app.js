// import "@/styles/globals.css";
// import { AppContextProvider } from "@/context/AppContext";

// export default function App({ Component, pageProps }) {
//   return (
//     <AppContextProvider>
//       <Component {...pageProps} />
//     </AppContextProvider>
//   );
// }

// pages/_app.js
// import { ClerkProvider } from '@clerk/nextjs';
import { AppContextProvider } from '@/context/AppContext';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

// const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function MyApp({ Component, pageProps }) {
  return (
    // <ClerkProvider>
    <>
      <Toaster />
      <AppContextProvider>
        <Component {...pageProps} />
      </AppContextProvider>
    </>
  );
}
