// "use client";
// import Navbar from "@/components/seller/Navbar";
// import Sidebar from "@/components/seller/Sidebar";
// // import Footer from "@/components/seller/Footer";
// import React from "react";

// const Layout = ({ children }) => {
//   return (
//     <div>
//       <Navbar />
//       <div className="flex w-full">
//         <Sidebar />
//         {children}
//       </div>
//     </div>
//   );
// };

// export default Layout;

"use client";
import Navbar from "@/components/seller/Navbar";
import Sidebar from "@/components/seller/Sidebar";
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { essentialsOnLoad, requireB2B } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  return requireB2B(context);
}

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/40 to-white">
      {/* subtle background blobs */}
      <div className="pointer-events-none fixed -top-16 -right-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 -left-24 h-72 w-72 rounded-full bg-orange-100/40 blur-3xl" />

      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          {/* glass surface for page bodies */}
          <div className="rounded-2xl bg-gradient-to-br from-white to-gray-50 p-[1px] ring-1 ring-black/5">
            <div className="rounded-2xl border border-white/70 bg-white/90 backdrop-blur-sm">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
