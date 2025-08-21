// "use client";

// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import { useAppContext } from "@/context/AppContext";
// import AccountDropdown from "@/components/AccountDropdown";

// // simple icons (no external deps)
// const SearchIcon = (props) => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
//     <circle cx="11" cy="11" r="7" strokeWidth="2" />
//     <path d="M20 20l-3.5-3.5" strokeWidth="2" />
//   </svg>
// );
// const CartIcon = (props) => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
//     <path strokeWidth="2" d="M6 6h15l-1.5 8.5H8.5L7 6z" />
//     <circle cx="9.5" cy="19" r="1.5" />
//     <circle cx="18" cy="19" r="1.5" />
//   </svg>
// );
// const CoinIcon = (props) => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
//     <circle cx="12" cy="12" r="8" strokeWidth="2" />
//     <path strokeWidth="2" d="M8.5 12h7M12 8.5v7" />
//   </svg>
// );

// export default function Navbar() {
//   const { router } = useAppContext();

//   // optional: live numbers from your redis/user API (safe fallback to 0)
//   const [cartCount, setCartCount] = useState(0);
//   const [cashback, setCashback] = useState(0);

//   useEffect(() => {
//     let ignore = false;
//     (async () => {
//       try {
//         const res = await fetch("/api/user/getRedisUserData", {
//           method: "POST",
//           credentials: "include",
//           headers: { "Content-Type": "application/json" },
//         });
//         const data = await res.json().catch(() => ({}));
//         if (ignore) return;
//         setCartCount(Number(data?.cart_count || data?.cartItems || 0));
//         setCashback(Number(data?.cashback || data?.cashback_balance || 0));
//       } catch (_) {
//         // noop: show defaults
//       }
//     })();
//     return () => {
//       ignore = true;
//     };
//   }, []);

//   return (
//     <nav className="sticky top-0 z-[200] w-full bg-white/95 backdrop-blur border-b border-gray-200">
//       <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-8 py-3">
//         {/* Logo */}
//         <button
//           onClick={() => router.push("/")}
//           className="shrink-0 focus:outline-none"
//           aria-label="Go home"
//         >
//           <Image
//             src="/1.png"
//             alt="CartKoro"
//             width={120}
//             height={36}
//             style={{ height: "auto" }}
//             priority
//           />
//         </button>

//         {/* (optional) tiny link row like Flipkart doesn't show; we keep Home/Shop only */}
//         <div className="hidden lg:flex items-center gap-4 text-sm text-gray-700">
//           <button
//             onClick={() => router.push("/")}
//             className="hover:text-gray-900"
//           >
//             Home
//           </button>
//           <button
//             onClick={() => router.push("/all-products")}
//             className="hover:text-gray-900"
//           >
//             Shop
//           </button>
//         </div>

//         {/* SEARCH — big pill like Flipkart */}
//         <form
//           className="relative flex-1 max-w-3xl mx-auto"
//           onSubmit={(e) => {
//             e.preventDefault();
//             const q = new FormData(e.currentTarget).get("q")?.toString() || "";
//             router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/all-products");
//           }}
//         >
//           <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
//           <input
//             name="q"
//             type="search"
//             placeholder="Search for products, brands and more"
//             className="w-full h-11 rounded-2xl bg-blue-50/70 pl-10 pr-4 text-[15px]
//                        ring-1 ring-inset ring-blue-100 placeholder:text-gray-500
//                        focus:outline-none focus:ring-2 focus:ring-blue-300"
//           />
//         </form>

//         {/* RIGHT: Account, Cashback, Cart */}
//         <div className="ml-auto flex items-center gap-2 md:gap-4">
//           {/* Account dropdown */}
//           <AccountDropdown />

//           {/* Cashback (badge with amount) */}
//           <button
//             onClick={() => router.push("/rewards")}
//             className="relative hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2
//                        hover:bg-gray-50 text-gray-800"
//             aria-label="Rewards"
//           >
//             <CoinIcon className="h-5 w-5" />
//             <span className="hidden md:block text-sm">Cashback</span>
//             <span className="ml-1 grid place-items-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
//               {Math.max(0, Math.floor(cashback))}
//             </span>
//           </button>

//           {/* Cart with count */}
//           <button
//             onClick={() => router.push("/cart")}
//             className="relative inline-flex items-center gap-2 rounded-xl px-3 py-2
//                        hover:bg-gray-50 text-gray-800"
//             aria-label="Cart"
//           >
//             <CartIcon className="h-5 w-5" />
//             <span className="hidden md:block text-sm">Cart</span>
//             {cartCount > 0 && (
//               <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
//                 {cartCount > 99 ? "99+" : cartCount}
//               </span>
//             )}
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// }

////////////////////////////////////////////////////////////////////////////////////////

// components/Navbar.jsx
// "use client";

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import Image from "next/image";
// import { useAppContext } from "@/context/AppContext";
// import api from "@/lib/axios";

// // Minimal icons
// const SearchIcon = (p) => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
//     <circle cx="11" cy="11" r="7" strokeWidth="2" />
//     <path d="M20 20l-3.5-3.5" strokeWidth="2" />
//   </svg>
// );
// const CartIcon = (p) => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
//     <path strokeWidth="2" d="M6 6h15l-1.5 8.5H8.5L7 6z" />
//     <circle cx="9.5" cy="19" r="1.5" />
//     <circle cx="18" cy="19" r="1.5" />
//   </svg>
// );
// const CoinIcon = (p) => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
//     <circle cx="12" cy="12" r="8" strokeWidth="2" />
//     <path strokeWidth="2" d="M8.5 12h7M12 8.5v7" />
//   </svg>
// );

// // Lazy account menu (unchanged)
// const AccountDropdown = React.lazy(() =>
//   import("@/components/AccountDropdown")
// );

// // Normalizer for product rows from different endpoints
// const normRow = (p) => {
//   const id =
//     p?._id ||
//     p?.id ||
//     p?.product_id ||
//     p?.slug ||
//     p?.sku ||
//     Math.random().toString(36).slice(2);
//   const name = p?.name || p?.title || p?.product_name || "Untitled";
//   const thumb =
//     p?.thumbnail_img ||
//     p?.thumbnail ||
//     (Array.isArray(p?.images) && p.images[0]) ||
//     (Array.isArray(p?.image) && p.image[0]) ||
//     p?.side_imgs?.[0] ||
//     "";
//   return { _id: id, name, thumb };
// };

// export default function Navbar() {
//   const { router } = useAppContext();
//   const [cartCount, setCartCount] = useState(0);
//   const [cashback, setCashback] = useState(0);

//   // Fetch counters from Redis via Next proxy using axios
//   useEffect(() => {
//     let active = true;
//     const ctrl = new AbortController();

//     (async () => {
//       try {
//         // If your api baseURL hits the Next app, keep /api/*
//         // If it hits the backend directly, change to /api/user/getUserRedisData -> /user/getUserRedisData
//         const { data } = await api.post(
//           "/api/user/getUserRedisData",
//           {},
//           { withCredentials: true, signal: ctrl.signal }
//         );

//         if (!active) return;

//         const cart =
//           data?.cart_count ??
//           data?.cartItems ??
//           data?.cart?.count ??
//           (Array.isArray(data?.cart?.items) ? data.cart.items.length : 0);

//         const cb =
//           data?.cashback ??
//           data?.cashback_balance ??
//           data?.rewards?.cashback ??
//           0;

//         setCartCount(Number(cart) || 0);
//         setCashback(Number(cb) || 0);
//       } catch {
//         // leave defaults
//       }
//     })();

//     return () => {
//       active = false;
//       ctrl.abort();
//     };
//   }, []);

//   return (
//     <nav className="sticky top-0 z-[200] w-full bg-white/95 backdrop-blur border-b border-gray-200">
//       <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-8 py-3">
//         {/* Logo */}
//         <button
//           onClick={() => router.push("/")}
//           className="shrink-0 focus:outline-none"
//           aria-label="Go home"
//         >
//           <Image
//             src="/1.png"
//             alt="CartKoro"
//             width={120}
//             height={36}
//             style={{ height: "auto" }}
//             priority
//           />
//         </button>

//         {/* Search with live suggestions */}
//         <SearchBox
//           onChoose={(id) => router.push(`/product/${id}`)}
//           onSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
//         />

//         {/* Right cluster */}
//         <div className="ml-auto flex items-center gap-2 md:gap-3">
//           <React.Suspense
//             fallback={<div className="h-9 w-28 rounded-xl bg-gray-100" />}
//           >
//             <AccountDropdown />
//           </React.Suspense>

//           <button
//             onClick={() => router.push("/rewards")}
//             className="relative hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-50 text-gray-800"
//             aria-label="Rewards"
//           >
//             <CoinIcon className="h-5 w-5" />
//             <span className="hidden md:block text-sm">Cashback</span>
//             <span className="ml-1 grid place-items-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
//               {Math.max(0, Math.floor(cashback))}
//             </span>
//           </button>

//           <button
//             onClick={() => router.push("/cart")}
//             className="relative inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-50 text-gray-800"
//             aria-label="Cart"
//           >
//             <CartIcon className="h-5 w-5" />
//             <span className="hidden md:block text-sm">Cart</span>
//             {cartCount > 0 && (
//               <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
//                 {cartCount > 99 ? "99+" : cartCount}
//               </span>
//             )}
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// }

// /* ---------------- Search box with live results (axios version) ---------------- */

// function SearchBox({ onChoose, onSubmit }) {
//   const [q, setQ] = useState("");
//   const [open, setOpen] = useState(false);
//   const [rows, setRows] = useState([]);
//   const popRef = useRef(null);
//   const inputRef = useRef(null);

//   // Close popover on outside click
//   useEffect(() => {
//     const h = (e) => {
//       if (!popRef.current) return;
//       if (!popRef.current.contains(e.target) && e.target !== inputRef.current)
//         setOpen(false);
//     };
//     document.addEventListener("mousedown", h);
//     return () => document.removeEventListener("mousedown", h);
//   }, []);

//   // Debounce
//   const debouncedQ = useDebounce(q, 220);

//   useEffect(() => {
//     const ctrl = new AbortController();

//     async function search() {
//       if (!debouncedQ || debouncedQ.trim().length < 2) {
//         setRows([]);
//         return;
//       }
//       setOpen(true);

//       // Try a few proxy endpoints; first one that returns OK wins
//       const tryEndpoints = [
//         { url: "/api/product/search", params: { q: debouncedQ } },
//         { url: "/api/product/searchByName", params: { q: debouncedQ } },
//         { url: "/api/product/getAllProducts", params: { query: debouncedQ } },
//       ];

//       for (const { url, params } of tryEndpoints) {
//         try {
//           const { data } = await api.get(url, {
//             params,
//             withCredentials: true,
//             signal: ctrl.signal,
//           });

//           const arr = data?.data || data?.products || data?.items || data || [];
//           const list = (Array.isArray(arr) ? arr : []).slice(0, 6).map(normRow);
//           if (list.length) {
//             setRows(list);
//             break;
//           }
//         } catch {
//           // try next endpoint
//         }
//       }
//     }

//     search();
//     return () => ctrl.abort();
//   }, [debouncedQ]);

//   return (
//     <div className="relative flex-1 max-w-3xl mx-auto" ref={popRef}>
//       <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           if (onSubmit) onSubmit(q);
//           setOpen(false);
//         }}
//       >
//         <input
//           ref={inputRef}
//           value={q}
//           onChange={(e) => setQ(e.target.value)}
//           onFocus={() => q.length >= 2 && setOpen(true)}
//           type="search"
//           placeholder="Search for products, brands and more"
//           className="w-full h-11 rounded-2xl bg-blue-50/70 pl-10 pr-4 text-[15px]
//                      ring-1 ring-inset ring-blue-100 placeholder:text-gray-500
//                      focus:outline-none focus:ring-2 focus:ring-blue-300"
//         />
//       </form>

//       {open && rows.length > 0 && (
//         <div className="absolute z-[210] mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
//           <ul className="divide-y divide-gray-100">
//             {rows.map((r) => (
//               <li key={r._id}>
//                 <button
//                   onClick={() => {
//                     setOpen(false);
//                     setQ("");
//                     onChoose && onChoose(r._id);
//                   }}
//                   className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 text-left"
//                 >
//                   {r.thumb ? (
//                     <Image
//                       src={r.thumb}
//                       alt={r.name}
//                       width={36}
//                       height={36}
//                       className="rounded object-cover"
//                     />
//                   ) : (
//                     <div className="h-9 w-9 rounded bg-gray-100" />
//                   )}
//                   <span className="truncate text-sm text-gray-800">
//                     {r.name}
//                   </span>
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// function useDebounce(value, delay = 200) {
//   const [v, setV] = useState(value);
//   useEffect(() => {
//     const id = setTimeout(() => setV(value), delay);
//     return () => clearTimeout(id);
//   }, [value, delay]);
//   return v;
// }

/////////////////////////////////////////////////////////////////////////

"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/router";

// Minimal icons
const SearchIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <circle cx="11" cy="11" r="7" strokeWidth="2" />
    <path d="M20 20l-3.5-3.5" strokeWidth="2" />
  </svg>
);
const CartIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" d="M6 6h15l-1.5 8.5H8.5L7 6z" />
    <circle cx="9.5" cy="19" r="1.5" />
    <circle cx="18" cy="19" r="1.5" />
  </svg>
);
const CoinIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <circle cx="12" cy="12" r="8" strokeWidth="2" />
    <path strokeWidth="2" d="M8.5 12h7M12 8.5v7" />
  </svg>
);

// Lazy account menu
const AccountDropdown = React.lazy(() =>
  import("@/components/AccountDropdown")
);

// Normalizer for product rows
const normRow = (p) => {
  const id =
    p?.sku_id || p?._id || p?.id || Math.random().toString(36).slice(2);
  const name = p?.name || "Untitled";
  const thumb = p?.thumbnail_img || p?.thumbnail || "";
  return { _id: id, name, thumb };
};

export default function Navbar() {
  const { getCartCount, cashbackData } = useAppContext();
  const router = useRouter();

  const cartCount = getCartCount();
  const cashback = cashbackData?.balance || 0;

  return (
    <nav className="sticky top-0 z-[200] w-full bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-8 py-3">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="shrink-0 focus:outline-none"
          aria-label="Go home"
        >
          <Image
            src="/1.png"
            alt="CartKoro"
            width={120}
            height={36}
            style={{ height: "auto" }}
            priority
          />
        </button>

        {/* Search */}
        <SearchBox
          onChoose={(id) => router.push(`/product/${id}`)}
          onSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
        />

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <React.Suspense
            fallback={<div className="h-9 w-28 rounded-xl bg-gray-100" />}
          >
            <AccountDropdown />
          </React.Suspense>

          {/* Cashback */}
          <button
            onClick={() => router.push("/rewards")}
            className="relative hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-50 text-gray-800"
            aria-label="Rewards"
          >
            <CoinIcon className="h-5 w-5" />
            <span className="hidden md:block text-sm">Cashback</span>
            <span className="ml-1 grid place-items-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
              {Math.max(0, Math.floor(cashback))}
            </span>
          </button>

          {/* Cart */}
          <button
            onClick={() => router.push("/cart")}
            className="relative inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-50 text-gray-800"
            aria-label="Cart"
          >
            <CartIcon className="h-5 w-5" />
            <span className="hidden md:block text-sm">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ---------------- Search box ---------------- */

function SearchBox({ onChoose, onSubmit }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const popRef = useRef(null);
  const inputRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    const h = (e) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target) && e.target !== inputRef.current)
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Debounce
  const debouncedQ = useDebounce(q, 220);

  useEffect(() => {
    const ctrl = new AbortController();

    async function search() {
      if (!debouncedQ || debouncedQ.trim().length < 2) {
        setRows([]);
        return;
      }
      setOpen(true);

      try {
        const res = await fetch("/api/product/getAllProducts", {
          signal: ctrl.signal,
        });
        const data = await res.json();

        const arr = data?.data || data?.products || data || [];
        const list = (Array.isArray(arr) ? arr : []).slice(0, 6).map(normRow);
        setRows(list);
      } catch {
        setRows([]);
      }
    }

    search();
    return () => ctrl.abort();
  }, [debouncedQ]);

  return (
    <div className="relative flex-1 max-w-3xl mx-auto" ref={popRef}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onSubmit) onSubmit(q);
          setOpen(false);
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.length >= 2 && setOpen(true)}
          type="search"
          placeholder="Search for products, brands and more"
          className="w-full h-11 rounded-2xl bg-blue-50/70 pl-10 pr-4 text-[15px]
                     ring-1 ring-inset ring-blue-100 placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </form>

      {open && rows.length > 0 && (
        <div className="absolute z-[210] mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li key={r._id}>
                <button
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                    onChoose && onChoose(r._id);
                  }}
                  className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 text-left"
                >
                  {r.thumb ? (
                    <Image
                      src={r.thumb}
                      alt={r.name}
                      width={36}
                      height={36}
                      className="rounded object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded bg-gray-100" />
                  )}
                  <span className="truncate text-sm text-gray-800">
                    {r.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function useDebounce(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
