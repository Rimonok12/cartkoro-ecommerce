// 'use client'
// import React, { useEffect, useState } from "react";
// import { assets, productsDummyData } from "@/assets/assets";
// import Image from "next/image";
// import { useAppContext } from "@/context/AppContext";
// import Navbar from '@/components/seller/Navbar';
// import Sidebar from '@/components/seller/Sidebar';
// import Footer from "@/components/seller/Footer";
// import Loading from "@/components/Loading";

// const ProductList = () => {

//   const { router } = useAppContext()

//   const [products, setProducts] = useState([])
//   const [loading, setLoading] = useState(true)

//   const fetchSellerProduct = async () => {
//     setProducts(productsDummyData)
//     setLoading(false)
//   }

//   useEffect(() => {
//     fetchSellerProduct();
//   }, [])

//   return (
//     <div className="flex-1 min-h-screen flex flex-col justify-between">
//       {loading ? <Loading /> : <div className="w-full md:p-10 p-4">
//         <h2 className="pb-4 text-lg font-medium">All Product</h2>
//         <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
//           <table className=" table-fixed w-full overflow-hidden">
//             <thead className="text-gray-900 text-sm text-left">
//               <tr>
//                 <th className="w-2/3 md:w-2/5 px-4 py-3 font-medium truncate">Product</th>
//                 <th className="px-4 py-3 font-medium truncate max-sm:hidden">Category</th>
//                 <th className="px-4 py-3 font-medium truncate">
//                   Price
//                 </th>
//                 <th className="px-4 py-3 font-medium truncate max-sm:hidden">Action</th>
//               </tr>
//             </thead>
//             <tbody className="text-sm text-gray-500">
//               {products.map((product, index) => (
//                 <tr key={index} className="border-t border-gray-500/20">
//                   <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
//                     <div className="bg-gray-500/10 rounded p-2">
//                       <Image
//                         src={product.image[0]}
//                         alt="product Image"
//                         className="w-16"
//                         width={1280}
//                         height={720}
//                       />
//                     </div>
//                     <span className="truncate w-full">
//                       {product.name}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3 max-sm:hidden">{product.category}</td>
//                   <td className="px-4 py-3">${product.offerPrice}</td>
//                   <td className="px-4 py-3 max-sm:hidden">
//                     <button onClick={() => router.push(`/product/${product._id}`)} className="flex items-center gap-1 px-1.5 md:px-3.5 py-2 bg-orange-600 text-white rounded-md">
//                       <span className="hidden md:block">Visit</span>
//                       <Image
//                         className="h-3.5"
//                         src={assets.redirect_icon}
//                         alt="redirect_icon"
//                       />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>}
//       <Footer />
//     </div>
//   );
// };

// export default ProductList;
"use client";
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";

// --- helpers to normalize your backend shape ---
const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === "object") {
    if ("$numberInt" in v) return Number(v.$numberInt);
    if ("$numberDouble" in v) return Number(v.$numberDouble);
  }
  return Number(v);
};

const mapRowToUI = (p) => {
  const firstImg =
    p.thumbnail_img ||
    p.thumbnail ||
    (Array.isArray(p.image) && p.image[0]) ||
    (Array.isArray(p.images) && p.images[0]) ||
    null;

  const gallery =
    p.side_imgs || p.images || p.image || (firstImg ? [firstImg] : []);

  return {
    _id: p._id || p.id || p.product_id,
    name:
      p.name ||
      p.title ||
      p.product_name ||
      `Item ${String(p._id || "").slice(-4)}`,
    category: p?.category?.name || p?.category || p?.categoryName || "—",
    offerPrice: toNum(p.SP ?? p.offerPrice ?? p.price ?? p.MRP),
    image: Array.isArray(gallery) ? gallery : [gallery].filter(Boolean),
  };
};

export default function ProductList() {
  const { router } = useAppContext();

  // gate SSR/hydration to avoid sandbox 500s
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const fetchSellerProduct = async () => {
    try {
      setErrMsg("");
      const res = await fetch(`/api/product/getAllProducts`);
      // const text = await res.text();
      const response = await res.json();

      if (!res.ok) {
        console.error(
          // "API /api/product/getAllProducts failed",
          // res.status
          res
          // text
        );
        setProducts([]);
        setErrMsg(`Products unavailable (HTTP ${res.status}).`);
        return;
      }

      // const payload = text ? JSON.parse(text) : {};
      // const rows =
      //   payload?.data || payload?.products || payload?.items || payload || [];
      // const normalized = Array.isArray(rows) ? rows.map(mapRowToUI) : [];
      // setProducts(normalized);
      setProducts(response);
    } catch (e) {
      console.error("fetchSellerProduct:", e);
      setProducts([]);
      setErrMsg("Failed to load products. See console/network for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    fetchSellerProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) {
    // Render nothing (or a very small placeholder) during SSR to prevent sandbox 500s
    return <div className="min-h-screen" />;
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full md:p-10 p-4">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                All Product
              </h2>
              <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
            </div>

            <button
              onClick={() => {
                setLoading(true);
                fetchSellerProduct();
              }}
              className="rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm shadow-sm hover:bg-white"
            >
              Refresh
            </button>
          </div>

          {errMsg && (
            <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
              {errMsg}
            </div>
          )}

          <div className="flex flex-col items-center max-w-5xl w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 p-[1px] ring-1 ring-black/5">
            <div className="w-full rounded-2xl border border-white/70 bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
              <table className="w-full table-fixed">
                <thead className="text-gray-900 text-sm text-left">
                  <tr className="border-b border-gray-100/80">
                    <th className="w-2/3 md:w-2/5 px-4 py-3 font-medium">
                      Product
                    </th>
                    <th className="px-4 py-3 font-medium max-sm:hidden">
                      Category
                    </th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium max-sm:hidden">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="text-sm text-gray-600">
                  {products.map((product, index) => (
                    <tr
                      key={product._id || index}
                      className="border-t border-gray-100/80"
                    >
                      {/* {console.log("hello" + product)} */}
                      <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center gap-3">
                        <div className="bg-gray-100 rounded p-2">
                          <Image
                            src={product.thumbnail_img}
                            alt="product Image"
                            className="w-16 h-16 object-cover"
                            width={1280}
                            height={720}
                          />
                        </div>
                        <span className="truncate">{product.name}</span>
                      </td>
                      <td className="px-4 py-3 max-sm:hidden">
                        {product.category_name}
                      </td>
                      <td className="px-4 py-3">
                        ${Number(product.selling_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 max-sm:hidden">
                        <button
                          onClick={() => router.push(`${product.visitUrl}`)}
                          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-3.5 py-2 text-white shadow-sm transition hover:bg-orange-700"
                        >
                          <span className="hidden md:block">Visit</span>
                          <Image
                            className="h-3.5 w-3.5"
                            src={assets.redirect_icon}
                            alt="redirect_icon"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {products.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
