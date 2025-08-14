import { Outfit } from 'next/font/google';
import '@/styles/globals.css';
import { AppContextProvider } from '@/context/AppContext';
import { Toaster } from 'react-hot-toast';
// import { ClerkProvider } from '@clerk/nextjs';
// import Navbar from '@/components/Navbar';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500'] });

export const metadata = {
  title: 'CartKoro - GreatStack',
  description: 'E-Commerce with Next.js ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased text-gray-700`}>
        {/* <ClerkProvider> */}
        <Toaster />
        <AppContextProvider>
          {/* <Navbar /> ✅ Now Navbar is inside ClerkProvider */}
          {children}
        </AppContextProvider>
        {/* </ClerkProvider> */}
      </body>
    </html>
  );
}
