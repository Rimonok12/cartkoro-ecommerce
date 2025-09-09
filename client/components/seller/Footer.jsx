// import React from "react";
// import { assets } from "@/assets/assets";
// import Image from "next/image";

// const Footer = () => {
//   return (
//     <div className="flex md:flex-row flex-col-reverse items-center justify-between text-left w-full px-10">
//       <div className="flex items-center gap-4">
//         <Image className="hidden md:block" src={assets.logo} alt="logo" />
//         <div className="hidden md:block h-7 w-px bg-gray-500/60"></div>
//         <p className="py-4 text-center text-xs md:text-sm text-gray-500">
//           Copyright 2025 © greatstack.dev All Right Reserved.
//         </p>
//       </div>
//       <div className="flex items-center gap-3">
//         <a href="#">
//           <Image src={assets.facebook_icon} alt="facebook_icon" />
//         </a>
//         <a href="#">
//           <Image src={assets.twitter_icon} alt="twitter_icon" />
//         </a>
//         <a href="#">
//           <Image src={assets.instagram_icon} alt="instagram_icon" />
//         </a>
//       </div>
//     </div>
//   );
// };

// export default Footer;

import React from "react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-16 bg-white border-t border-gray-200">
      <div className="h-1 w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400" />

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-3">
        {/* Brand */}
        <div>
          <Image
            src="/1.png"
            alt="CartKoro"
            width={140}
            height={40}
            style={{ height: "auto" }}
          />
          <p className="mt-4 text-sm text-gray-600">
            CartKoro is your trusted marketplace in Bangladesh — fast delivery,
            honest prices, and verified products.
          </p>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>
              <a href="/" className="hover:text-gray-900">
                Home
              </a>
            </li>
            <li>
              <a href="/about" className="hover:text-gray-900">
                About us
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-gray-900">
                Contact us
              </a>
            </li>
            <li>
              <a href="/privacy" className="hover:text-gray-900">
                Privacy policy
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Get in touch</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>+880 1540-670260</li>
            <li>support@cartkoro.com</li>
            <li>Comilla, Bangladesh</li>
          </ul>
          <div className="mt-4 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400" />
        </div>
      </div>

      <div className="border-t border-gray-200">
        <p className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 text-xs md:text-sm text-gray-500 text-center">
          Copyright © {new Date().getFullYear()} CartKoro. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
