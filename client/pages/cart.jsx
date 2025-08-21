// // pages/cart.js
// import { useAppContext } from "@/context/AppContext";
// import { useRouter } from "next/router";

// const Cart = () => {
//   const { cartData, updateCartQuantity, getCartCount } = useAppContext();
//   const router = useRouter();

//   // Handle empty cart
//   if (!cartData || cartData.length === 0) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold">Your Cart is Empty 🛒</h2>
//           <button
//             onClick={() => router.push("/")}
//             className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
//           >
//             Shop Now
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Calculate total price
//   const total = cartData.reduce(
//     (sum, item) => sum + item.sp * item.quantity,
//     0
//   );

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <h1 className="text-3xl font-bold mb-6">Your Cart ({getCartCount()})</h1>

//       <div className="space-y-4">
//         {cartData.map((item) => (
//           <div
//             key={item.skuId}
//             className="flex items-center justify-between border p-4 rounded-lg shadow-sm"
//           >
//             {/* Left - Image + Name */}
//             <div className="flex items-center space-x-4">
//               <img
//                 src={item.thumbnailImg}
//                 alt={item.name}
//                 className="w-20 h-20 object-cover rounded"
//               />
//               <div>
//                 <h2 className="text-lg font-semibold">{item.name}</h2>
//                 <p className="text-sm text-gray-600">
//                   ₹{item.sp.toLocaleString()}
//                 </p>
//               </div>
//             </div>

//             {/* Right - Quantity + Remove */}
//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={() =>
//                   updateCartQuantity(item.skuId, item.quantity - 1)
//                 }
//                 disabled={item.quantity <= 1}
//                 className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
//               >
//                 -
//               </button>
//               <span className="px-4">{item.quantity}</span>
//               <button
//                 onClick={() =>
//                   updateCartQuantity(item.skuId, item.quantity + 1)
//                 }
//                 className="px-3 py-1 bg-gray-200 rounded"
//               >
//                 +
//               </button>
//               <button
//                 onClick={() => updateCartQuantity(item.skuId, 0)} // remove item
//                 className="ml-4 text-red-600 hover:underline"
//               >
//                 Remove
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Cart Summary */}
//       <div className="mt-8 p-4 border rounded-lg shadow">
//         <h2 className="text-xl font-semibold">Cart Summary</h2>
//         <p className="mt-2 text-lg">
//           Total: <span className="font-bold">₹{total.toLocaleString()}</span>
//         </p>
//         <button
//           onClick={() => router.push("/checkout")}
//           className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg"
//         >
//           Proceed to Checkout
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Cart;
// pages/cart.jsx (or app/cart/page.jsx with the same component)
"use client";

import { useMemo } from "react";
import { useRouter } from "next/router";
import { useAppContext } from "@/context/AppContext";
import { essentialsOnLoad } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);
  // if no user data → send them home (or login page)
  if (!essentials.props.initialUserData) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }
  return {
    props: {
      ...essentials.props,
    },
  };
}

export default function Cart() {
  const { cartData, updateCartQuantity, getCartCount, currency } =
    useAppContext();
  const router = useRouter();

  // Your context stores items under cartData.items (array of { sku_id, quantity, ... })
  const items = Array.isArray(cartData?.items) ? cartData.items : [];

  const total = useMemo(() => {
    return items.reduce((sum, it) => {
      // normalize price field: SP / sp / price / offerPrice / MRP
      const price =
        Number(it.SP ?? it.sp ?? it.price ?? it.offerPrice ?? it.MRP ?? 0) || 0;
      const qty = Number(it.quantity ?? 0) || 0;
      return sum + price * qty;
    }, 0);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Your cart is empty 🛒</h2>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition"
          >
            Shop now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">
        Your Cart <span className="text-gray-500">({getCartCount()})</span>
      </h1>

      <div className="space-y-4">
        {items.map((it) => {
          const id =
            it.sku_id ||
            it.skuId ||
            it._id ||
            Math.random().toString(36).slice(2);
          const name = it.name || it.product_name || "Unnamed item";
          const thumb =
            it.thumbnailImg ||
            it.thumbnail_img ||
            (Array.isArray(it.images) && it.images[0]) ||
            (Array.isArray(it.image) && it.image[0]) ||
            it.side_imgs?.[0] ||
            "";
          const price =
            Number(
              it.SP ?? it.sp ?? it.price ?? it.offerPrice ?? it.MRP ?? 0
            ) || 0;
          const qty = Number(it.quantity ?? 0) || 0;

          return (
            <div
              key={id}
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* Left: image + meta */}
              <div className="flex items-center gap-4 min-w-0">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={name}
                    className="h-20 w-20 rounded object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded bg-gray-100" />
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-medium text-gray-900">
                    {name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {currency}
                    {price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Right: qty controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateCartQuantity(id, qty - 1)}
                  disabled={qty <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50"
                >
                  –
                </button>
                <span className="px-2 font-medium">{qty}</span>
                <button
                  onClick={() => updateCartQuantity(id, qty + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700"
                >
                  +
                </button>

                <button
                  onClick={() => updateCartQuantity(id, 0)} // remove item
                  className="ml-3 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-medium">Cart summary</h3>
        <div className="mt-3 flex items-center justify-between text-gray-700">
          <span>Subtotal</span>
          <span className="font-semibold">
            {currency}
            {total.toLocaleString()}
          </span>
        </div>

        <button
          onClick={() => router.push("/checkout")}
          className="mt-5 w-full rounded-xl bg-orange-600 py-2.5 text-white hover:bg-orange-700 transition"
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
