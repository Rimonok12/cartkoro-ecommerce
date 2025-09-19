// import React from "react";
// import { assets } from "@/assets/assets";
// import Image from "next/image";

// const Footer = () => {
//   return (
//     <footer>
//       <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 text-gray-500">
//         <div className="w-4/5">
//           <Image className="w-28 md:w-32" src={assets.logo} alt="logo" />
//           <p className="mt-6 text-sm">
//             Lorem Ipsum is simply dummy text of the printing and typesetting
//             industry. Lorem Ipsum has been the industry's standard dummy text
//             ever since the 1500s, when an unknown printer took a galley of type
//             and scrambled it to make a type specimen book.
//           </p>
//         </div>

//         <div className="w-1/2 flex items-center justify-start md:justify-center">
//           <div>
//             <h2 className="font-medium text-gray-900 mb-5">Company</h2>
//             <ul className="text-sm space-y-2">
//               <li>
//                 <a className="hover:underline transition" href="#">Home</a>
//               </li>
//               <li>
//                 <a className="hover:underline transition" href="#">About us</a>
//               </li>
//               <li>
//                 <a className="hover:underline transition" href="#">Contact us</a>
//               </li>
//               <li>
//                 <a className="hover:underline transition" href="#">Privacy policy</a>
//               </li>
//             </ul>
//           </div>
//         </div>

//         <div className="w-1/2 flex items-start justify-start md:justify-center">
//           <div>
//             <h2 className="font-medium text-gray-900 mb-5">Get in touch</h2>
//             <div className="text-sm space-y-2">
//               <p>+1-234-567-890</p>
//               <p>contact@greatstack.dev</p>
//             </div>
//           </div>
//         </div>
//       </div>
//       <p className="py-4 text-center text-xs md:text-sm">
//         Copyright 2025 © GreatStack.dev All Right Reserved.
//       </p>
//     </footer>
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
          <Image src="/1.png" alt="CartKoro" width={140} height={40} style={{ height: "auto" }} />
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
              <a href="/" className="hover:text-gray-900">Home</a>
            </li>
            <li>
              <a href="/about" className="hover:text-gray-900">About us</a>
            </li>
            <li>
              <a href="/contact" className="hover:text-gray-900">Contact us</a>
            </li>
            <li>
              <a href="/terms" className="hover:text-gray-900">Terms of use</a>
            </li>
            <li>
              <a href="/privacy" className="hover:text-gray-900">Privacy policy</a>
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
