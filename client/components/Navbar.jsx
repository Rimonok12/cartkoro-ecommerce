// 'use client';
// import React from 'react';
// import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from '@/assets/assets';
// import Link from 'next/link';
// import { useAppContext } from '@/context/AppContext';
// import Image from 'next/image';
// // import LogoutButton from '@/components/Logout.js';
// import LogoutButton from './logout';

// const Navbar = () => {
//   // clerkProviding:
//   const { userName } = useAppContext();
//   console.log('userName::', userName);

//   const { isSeller, router } = useAppContext();

//   return (
//     <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
//       <Image
//         className="cursor-pointer w-28 md:w-32"
//         onClick={() => router.push('/')}
//         // src={assets.logo_cartKoro}
//         src="/logo_cartKoro.png"
//         width={112} // Add the appropriate width
//         height={32} // Add the appropriate height
//         alt="ss1"
//       />
//       <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
//         <Link href="/" className="hover:text-gray-900 transition">
//           Home
//         </Link>
//         <Link href="/all-products" className="hover:text-gray-900 transition">
//           Shop
//         </Link>
//         <Link href="/" className="hover:text-gray-900 transition">
//           About Us
//         </Link>
//         <Link href="/" className="hover:text-gray-900 transition">
//           Contact
//         </Link>

//         {isSeller && (
//           <button
//             onClick={() => router.push('/seller/layout')}
//             className="text-xs border px-4 py-1.5 rounded-full"
//           >
//             Seller Dashboard
//           </button>
//         )}

//         <LogoutButton />
//       </div>

//       <ul className="hidden md:flex items-center gap-4 ">
//         <Image className="w-4 h-4" src={assets.search_icon} alt="search icon" />

//         <button className="flex items-center gap-2 hover:text-gray-900 transition">
//           <Image src={assets.user_icon} alt="user icon" />
//           {userName ? <p>Hi, {userName}</p> : <p>Account</p>}
//         </button>
//       </ul>
//     </nav>
//   );
// };

// export default Navbar;

// 'use client';
// import React from 'react';
// import { assets } from '@/assets/assets';
// import Link from 'next/link';
// import { useAppContext } from '@/context/AppContext';
// import Image from 'next/image';
// import LogoutButton from './logout';

// const Navbar = () => {
//   const { userName, isSeller, router } = useAppContext();

//   const onAccountClick = () => {
//     if (userName) {
//       // optional: router.push('/account');
//     } else {
//       router.push('/login'); // ⬅️ go to the login page
//     }
//   };

//   return (
//     <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
//       <Image
//         className="cursor-pointer w-28 md:w-32"
//         onClick={() => router.push('/')}
//         src="/logo_cartKoro.png"
//         width={112}
//         height={32}
//         alt="CartKoro"
//       />

//       <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
//         <Link href="/" className="hover:text-gray-900 transition">
//           Home
//         </Link>
//         <Link href="/all-products" className="hover:text-gray-900 transition">
//           Shop
//         </Link>
//         <Link href="/" className="hover:text-gray-900 transition">
//           About Us
//         </Link>
//         <Link href="/" className="hover:text-gray-900 transition">
//           Contact
//         </Link>

//         {isSeller && (
//           <button
//             onClick={() => router.push('/seller/layout')}
//             className="text-xs border px-4 py-1.5 rounded-full"
//           >
//             Seller Dashboard
//           </button>
//         )}

//         {/* show Logout only when logged in */}
//         {userName && <LogoutButton />}
//       </div>

//       <ul className="hidden md:flex items-center gap-4 ">
//         <Image className="w-4 h-4" src={assets.search_icon} alt="search icon" />
//         <button
//           className="flex items-center gap-2 hover:text-gray-900 transition"
//           onClick={onAccountClick}
//         >
//           <Image src={assets.user_icon} alt="user icon" />
//           {userName ? <p>Hi, {userName}</p> : <p>Account</p>}
//         </button>
//       </ul>
//     </nav>
//   );
// };

// export default Navbar;

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import { assets } from '@/assets/assets';
import AccountDropdown from '@/components/AccountDropdown';

const Navbar = () => {
  const { isSeller, router } = useAppContext();

  return (
    <nav
      className="sticky top-0 z-[200] bg-white flex items-center justify-between
                px-6 md:px-16 lg:px-32 py-3 border-b border-gray-200 text-gray-700"
    >
      {/* // <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700"> */}
      {/* Logo */}
      <Image
        className="cursor-pointer w-28 md:w-32"
        onClick={() => router.push('/')}
        src="/1.png"
        width={112}
        height={32}
        alt="CartKoro"
        style={{ height: 'auto' }} // prevent aspect-ratio warning
        priority
      />

      {/* Left nav links */}
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
      </div>

      {/* Right tools */}
      <ul className="hidden md:flex items-center gap-4 relative">
        {/* search icon */}
        <Image
          src={assets.search_icon}
          alt="search icon"
          width={16}
          height={16}
          className="shrink-0"
        />

        {/* click-only dropdown (Account / Hi, {username}) */}
        <AccountDropdown userIcon={assets.user_icon} />
      </ul>
    </nav>
  );
};

export default Navbar;
