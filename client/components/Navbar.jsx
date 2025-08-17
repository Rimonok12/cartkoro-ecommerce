'use client';
import React from 'react';
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from '@/assets/assets';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import LogoutButton from '@/components/logout.jsx';


const Navbar = () => {
  // clerkProviding:
  const { userName } = useAppContext();
  console.log("userName::", userName)

  const { isSeller, router } = useAppContext();


  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
      <Image
        className="cursor-pointer w-28 md:w-32"
        onClick={() => router.push('/')}
        // src={assets.logo_cartKoro}
        src="/logo_cartKoro.png"
        width={112} // Add the appropriate width
        height={32} // Add the appropriate height
        alt="ss1"
      />
      <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
        <Link href="/" className="hover:text-gray-900 transition">
          Home
        </Link>
        <Link href="/all-products" className="hover:text-gray-900 transition">
          Shop
        </Link>
        <Link href="/" className="hover:text-gray-900 transition">
          About Us
        </Link>
        <Link href="/" className="hover:text-gray-900 transition">
          Contact
        </Link>

        {isSeller && (
          <button
            onClick={() => router.push('/seller/layout')}
            className="text-xs border px-4 py-1.5 rounded-full"
          >
            Seller Dashboard
          </button>
        )}

        <LogoutButton />
      </div>

      <ul className="hidden md:flex items-center gap-4 ">
        <Image className="w-4 h-4" src={assets.search_icon} alt="search icon" />
     
        <button
          className="flex items-center gap-2 hover:text-gray-900 transition"
        >
          <Image src={assets.user_icon} alt="user icon" />
          {userName ? <p>Hi, {userName}</p> : <p>Account</p>}
        </button>

      </ul>

    </nav>
  );
};

export default Navbar;
