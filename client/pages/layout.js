import { Outfit } from 'next/font/google';
import '@/styles/globals.css';
import { AppContextProvider } from '@/context/AppContext';
import { Toaster } from 'react-hot-toast';
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
        <Toaster />
        <AppContextProvider>
          {/* <Navbar />*/}
          {children}
        </AppContextProvider>
      </body>
    </html>
  );
}
