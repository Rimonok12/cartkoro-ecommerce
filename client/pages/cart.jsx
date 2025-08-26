// 'use client';

// import React from "react";
// import { assets } from "@/assets/assets";
// import OrderSummary from "@/components/OrderSummary";
// import Image from "next/image";
// import Navbar from "@/components/Navbar";
// import { useAppContext } from "@/context/AppContext";

// const Cart = () => {
//   const { cartData, addToCart, updateCartQuantity, getCartCount, currency } = useAppContext();

//   const items = cartData?.items || [];

//   return (
//     <>
//       <Navbar />
//       <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
//         <div className="flex-1">
//           <div className="flex items-center justify-between mb-8 border-b border-gray-500/30 pb-6">
//             <p className="text-2xl md:text-3xl text-gray-500">
//               Your <span className="font-medium text-orange-600">Cart</span>
//             </p>
//             <p className="text-lg md:text-xl text-gray-500/80">{getCartCount()} Items</p>
//           </div>

//           {items.length === 0 ? (
//             <div className="text-center py-20 text-gray-500">
//               Your cart is empty 🛒
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full table-auto">
//                 <thead className="text-left">
//                   <tr>
//                     <th className="text-nowrap pb-6 md:px-4 px-1 text-gray-600 font-medium">
//                       Product Details
//                     </th>
//                     <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
//                       Price
//                     </th>
//                     <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
//                       Quantity
//                     </th>
//                     <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
//                       Subtotal
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {items.map((item) => (
//                     <tr key={item.sku_id}>
//                       <td className="flex items-center gap-4 py-4 md:px-4 px-1">
//                         <div>
//                           <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2">
//                             <Image
//                               src={item.thumbnailImg}
//                               alt={item.name}
//                               className="w-16 h-auto object-cover mix-blend-multiply"
//                               width={1280}
//                               height={720}
//                             />
//                           </div>
//                           <button
//                             className="md:hidden text-xs text-orange-600 mt-1"
//                             onClick={() => updateCartQuantity(item.sku_id, 0)}
//                           >
//                             Remove
//                           </button>
//                         </div>
//                         <div className="text-sm hidden md:block">
//                           <p className="text-gray-800">{item.name}</p>
//                           <button
//                             className="text-xs text-orange-600 mt-1"
//                             onClick={() => updateCartQuantity(item.sku_id, 0)}
//                           >
//                             Remove
//                           </button>
//                         </div>
//                       </td>
//                       <td className="py-4 md:px-4 px-1 text-gray-600">
//                         {currency} {item.sp?.toFixed(2)}
//                       </td>
//                       <td className="py-4 md:px-4 px-1">
//                         <div className="flex items-center md:gap-2 gap-1">
//                           <button
//                             onClick={() =>
//                               updateCartQuantity(item.sku_id, item.quantity - 1)
//                             }
//                             disabled={item.quantity <= 1}
//                           >
//                             <Image
//                               src={assets.decrease_arrow}
//                               alt="decrease_arrow"
//                               className="w-4 h-4"
//                             />
//                           </button>
//                           <input
//                             onChange={(e) =>
//                               updateCartQuantity(item.sku_id, Number(e.target.value))
//                             }
//                             type="number"
//                             value={item.quantity}
//                             className="w-8 border text-center appearance-none"
//                           />
//                           <button onClick={() => addToCart(item.sku_id)}>
//                             <Image
//                               src={assets.increase_arrow}
//                               alt="increase_arrow"
//                               className="w-4 h-4"
//                             />
//                           </button>
//                         </div>
//                       </td>
//                       <td className="py-4 md:px-4 px-1 text-gray-600">
//                         {currency} {(item.sp * item.quantity).toFixed(2)}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           <button
//             onClick={() => window.location.href = "/all-products"}
//             className="group flex items-center mt-6 gap-2 text-orange-600"
//           >
//             <Image
//               className="group-hover:-translate-x-1 transition"
//               src={assets.arrow_right_icon_colored}
//               alt="arrow_right_icon_colored"
//             />
//             Continue Shopping
//           </button>
//         </div>

//         {/* Order summary */}
//         <OrderSummary />
//       </div>
//     </>
//   );
// };

// export default Cart;



"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import Navbar from "@/components/Navbar";
import OrderSummary from "@/components/OrderSummary";
import { useAppContext } from "@/context/AppContext";

// const FALLBACK_IMG =
  // "https://dummyimage.com/96x96/f3f4f6/97a3b6.png&text=%20";

// --- keep your imports & helpers ---

function normSkuRow(row) {
  const skuId = row?._id || row?.sku_id || row?.id;
  const price = Number(row?.SP ?? row?.sp ?? row?.price ?? row?.selling_price ?? 0);
  const name =
    row?.name ||
    row?.product_name ||
    row?.title ||
    (row?.product && (row.product.name || row.product.title)) ||
    "Product";
  const thumb =
    row?.thumbnail_img ||
    row?.thumb ||
    (Array.isArray(row?.images) ? row.images[0] : null) ||
    (Array.isArray(row?.side_imgs) ? row.side_imgs[0] : null);

  return { sku_id: skuId, name, sp: price, thumbnail_img: thumb };
}

async function fetchSkuBulk(ids) {
  if (!ids?.length) return {};
  try {
    const r = await fetch(`/api/product/skuByIds?ids=${encodeURIComponent(ids.join(","))}`, {
      credentials: "include",
    });
    if (!r.ok) return {};
    const raw = await r.json();
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : raw?.items || [];
    const map = {};
    for (const row of list) {
      const n = normSkuRow(row);
      if (n.sku_id) map[n.sku_id] = n;
    }
    return map;
  } catch {
    return {};
  }
}


export default function Cart() {
  const { cartData, addToCart, updateCartQuantity, getCartCount, currency } =
    useAppContext();
  const [enriched, setEnriched] = useState({}); // sku_id -> {name, sp, thumbnail_img}

  const items = useMemo(() => cartData?.items || [], [cartData?.items]);

  // Enrich cart rows once (or when it changes)
  useEffect(() => {
    let cancel = false;

    (async () => {
      // if items already carry details (when added from PDP), honor them
      const needsFetch = [];
      const prime = {};

      for (const it of items) {
        const hasDetails =
          it && (it.name || it.sp != null || it.thumbnail_img || it.price != null);
        if (hasDetails) {
          prime[it.sku_id] = {
            sku_id: it.sku_id,
            name: it.name || it.product_name || "Product",
            sp: Number(it.sp ?? it.price ?? 0),
            thumbnail_img: it.thumbnail_img || it.thumb ,
          };
        } else if (it?.sku_id) {
          needsFetch.push(it.sku_id);
        }
      }

      if (needsFetch.length) {
        const fetched = await fetchSkuBulk(needsFetch);
        if (!cancel) setEnriched({ ...fetched, ...prime });
      } else {
        if (!cancel) setEnriched({ ...prime });
      }
    })();

    return () => {
      cancel = true;
    };
  }, [items]);

  const displayRows = items.map((it) => {
    const enrich = enriched[it.sku_id] || {};
    return {
      sku_id: it.sku_id,
      quantity: Number(it.quantity) || 1,
      name: enrich.name ?? it.name ?? "Product",
      sp: Number(enrich.sp ?? it.sp ?? it.price ?? 0),
      thumbnail_img: enrich.thumbnail_img ?? it.thumbnail_img ,
    };
  });

  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
        {/* Left: table */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
            <p className="text-2xl md:text-3xl text-gray-700">
              Your <span className="font-semibold text-orange-600">Cart</span>
            </p>
            <p className="text-lg md:text-xl text-gray-500/90">
              {getCartCount()} Items
            </p>
          </div>

          {displayRows.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Your cart is empty 🛒
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl ring-1 ring-black/5">
              <table className="min-w-full table-auto bg-white">
                <thead className="text-left bg-slate-50/70">
                  <tr className="text-gray-700">
                    <th className="pb-4 md:px-4 px-2 font-medium">Product</th>
                    <th className="pb-4 md:px-4 px-2 font-medium">Price</th>
                    <th className="pb-4 md:px-4 px-2 font-medium">Qty</th>
                    <th className="pb-4 md:px-4 px-2 font-medium">Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {displayRows.map((item) => (
                    <tr
                      key={item.sku_id}
                      className="border-t border-slate-100 text-sm text-slate-700"
                    >
                      <td className="py-4 md:px-4 px-2">
  <div className="flex items-center gap-4">
    <div className="rounded-lg overflow-hidden bg-slate-100 p-2">
      {item.thumbnail_img ? (
        <Image
          src={item.thumbnail_img}
          alt={item.name}
          width={64}
          height={64}
          className="h-16 w-16 object-cover"
        />
      ) : (
        <div className="h-16 w-16 rounded bg-gray-100 border border-gray-200" />
      )}
    </div>
    <div>
      <p className="font-medium text-slate-900">{item.name}</p>
      <button
        className="mt-1 text-xs text-orange-600 hover:underline"
        onClick={() => updateCartQuantity(item.sku_id, 0)}
      >
        Remove
      </button>
    </div>
  </div>
</td>

                      <td className="py-4 md:px-4 px-2">
                        {currency} {Number(item.sp).toFixed(2)}
                      </td>

                      <td className="py-4 md:px-4 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.sku_id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            disabled={item.quantity <= 1}
                            title="Decrease"
                          >
                            <Image
                              src={assets.decrease_arrow}
                              alt="decrease"
                              className="h-4 w-4"
                            />
                          </button>

                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartQuantity(
                                item.sku_id,
                                Math.max(1, Number(e.target.value) || 1)
                              )
                            }
                            className="h-8 w-12 rounded border border-slate-300 text-center outline-none focus:ring-2 focus:ring-orange-300"
                          />

                          <button
                            onClick={() => updateCartQuantity(item.sku_id, item.quantity + 1)}
                            title="Increase"
                          >
                            <Image
                              src={assets.increase_arrow}
                              alt="increase"
                              className="h-4 w-4"
                            />
                          </button>
                        </div>
                      </td>

                      <td className="py-4 md:px-4 px-2 font-medium text-slate-900">
                        {currency} {(Number(item.sp) * Number(item.quantity)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* table footer mini-subtotal (optional) */}
              <div className="flex justify-end bg-white p-4 text-sm text-slate-700">
                <div className="rounded-xl bg-slate-50 px-4 py-2">
                  Subtotal:&nbsp;
                  <span className="font-semibold text-slate-900">
                    {currency}{" "}
                    {displayRows
                      .reduce((s, it) => s + (Number(it.sp) || 0) * (Number(it.quantity) || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => (window.location.href = "/all-products")}
            className="group mt-6 inline-flex items-center gap-2 text-orange-600"
          >
            <Image
              className="transition group-hover:-translate-x-1"
              src={assets.arrow_right_icon_colored}
              alt="arrow"
            />
            Continue Shopping
          </button>
        </div>

        {/* Right: summary */}
<OrderSummary items={displayRows} />
      </div>
    </>
  );
}
