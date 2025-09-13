// // components/Navbar.js
// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import Image from "next/image";
// import { useAppContext } from "@/context/AppContext";
// import { useRouter } from "next/router";

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

// // Lazy account menu
// const AccountDropdown = React.lazy(() => import("@/components/AccountDropdown"));

// // Normalizer for product rows
// const normRow = (p) => {
//   const id = p?.sku_id || p?._id || p?.id || Math.random().toString(36).slice(2);
//   const name = p?.name || "Untitled";
//   const thumb = p?.thumbnail_img || p?.thumbnail || "";
//   return { _id: id, name, thumb };
// };

// export default function Navbar() {
//   const { getCartCount, cashbackData, userData } = useAppContext(); // ⬅️ get userData
//   const router = useRouter();

//   const isLoggedIn = Boolean(userData && (userData._id || userData.id));
//   const cartCount = getCartCount();

//   // helper: gated navigation
//   const goGated = (targetPath, redirectKey) => {
//     if (isLoggedIn) {
//       router.push(targetPath);
//     } else {
//       router.push(`/login?redirect=${encodeURIComponent(redirectKey)}`);
//     }
//   };

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

//         {/* Search */}
//         <SearchBox
//           onChoose={(id) => router.push(`/product/${id}`)}
//           onSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
//         />

//         {/* Right cluster */}
//         <div className="ml-auto flex items-center gap-2 md:gap-3">
//           <React.Suspense fallback={<div className="h-9 w-28 rounded-xl bg-gray-100" />}>
//             <AccountDropdown />
//           </React.Suspense>

//           {/* Cashback (gate to /rewards) */}
//           <button
//             onClick={() => goGated("/rewards", "rewards")}
//             className="relative hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-50 text-gray-800"
//             aria-label="Rewards"
//           >
//             <span className="hidden md:block text-sm">Cashback</span>
//             <span className="ml-1 grid place-items-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
//               {Math.max(0, Math.floor(cashbackData))}
//             </span>
//           </button>

//           {/* Cart (gate to /cart) */}
//           <button
//             onClick={() => goGated("/cart", "cart")}
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

// /* ---------------- Search box ---------------- */

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
//       if (!popRef.current.contains(e.target) && e.target !== inputRef.current) setOpen(false);
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

//       try {
//         const res = await fetch("/api/product/getAllProducts", { signal: ctrl.signal });
//         const data = await res.json();

//         const arr = data?.data || data?.products || data || [];
//         const list = (Array.isArray(arr) ? arr : []).slice(0, 6).map(normRow);
//         setRows(list);
//       } catch {
//         setRows([]);
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
//                   <span className="truncate text-sm text-gray-800">{r.name}</span>
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



"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/router";

/* ===================== Icons ===================== */
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

/* Black wallet icon for Cashback */
const CashbackIcon = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <rect x="3" y="6.5" width="18" height="11" rx="2.5" />
    <path d="M16 6.5v4H21" />
    <circle cx="16" cy="12" r="1.6" />
  </svg>
);

/* Lazy account menu (first in sequence) */
const AccountDropdown = React.lazy(() => import("@/components/AccountDropdown"));

/* For search result normalization */
const normRow = (p) => {
  const id = p?.sku_id || p?._id || p?.id || Math.random().toString(36).slice(2);
  const name = p?.name || "Untitled";
  const thumb = p?.thumbnail_img || p?.thumbnail || "";
  return { _id: id, name, thumb };
};

const formatCount = (n) => {
  const v = Number.isFinite(+n) ? Math.max(0, Math.floor(+n)) : 0;
  return v > 99 ? "99+" : String(v);
};

/* ===================== Navbar ===================== */
export default function Navbar() {
  const { getCartCount, cashbackData = 0, userData } = useAppContext();
  const router = useRouter();

  const isLoggedIn = Boolean(userData && (userData._id || userData.id));
  const cartCount = getCartCount();

  const goGated = (targetPath, redirectKey) => {
    if (isLoggedIn) router.push(targetPath);
    else router.push(`/login?redirect=${encodeURIComponent(redirectKey)}`);
  };

  return (
    <nav
      className="sticky top-0 z-[200] w-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 ring-1 ring-black/5"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      role="navigation"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-2 md:py-3">
        {/* ===== Bar: on md+ everything is a single row; on mobile it splits into two rows ===== */}
        <div className="flex flex-col gap-2 md:gap-0">
          {/* Row A: logo + (desktop search) + actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Logo */}
            <button
              onClick={() => router.push("/")}
              className="shrink-0 focus:outline-none h-9 md:h-10"
              aria-label="Go home"
            >
              <Image
                src="/1.png"
                alt="CartKoro"
                width={120}
                height={36}
                className="h-9 w-auto md:h-10"
                priority
              />
            </button>

            {/* Desktop search (inline) */}
            <div className="hidden md:block flex-1">
              <SearchBox
                onChoose={(id) => router.push(`/product/${id}`)}
                onSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
              />
            </div>

            {/* Actions cluster — ORDER: Account → Cashback → Cart */}
            <div className="ml-auto flex items-center gap-1.5 md:gap-3">
              {/* Account first */}
              <React.Suspense fallback={<div className="h-9 w-28 rounded-xl bg-gray-100" />}>
                <AccountDropdown />
              </React.Suspense>

              {/* Cashback second (wallet icon + top-right badge) */}
              <button
                onClick={() => goGated("/rewards", "rewards")}
                className="relative inline-flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-gray-50 text-gray-900"
                aria-label="Rewards"
              >
                <CashbackIcon className="h-5 w-5 text-black" />
                <span className="hidden md:block text-sm">Cashback</span>
                <span className="ml-1 grid place-items-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {Math.max(0, Math.floor(cashbackData))}
                </span>
              </button>

              {/* Cart third */}
              <button
                onClick={() => goGated("/cart", "cart")}
                className="relative inline-flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-gray-50 text-gray-800 min-h-[40px] min-w-[40px]"
                aria-label="Cart"
              >
                <CartIcon className="h-5 w-5" />
                <span className="hidden md:block text-sm">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
                    {formatCount(cartCount)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row B (mobile only): full-width search */}
          <div className="md:hidden">
            <SearchBox
              onChoose={(id) => router.push(`/product/${id}`)}
              onSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ===================== Search Box ===================== */
function SearchBox({ onChoose, onSubmit }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const popRef = useRef(null);
  const inputRef = useRef(null);

  // close popover on outside click
  useEffect(() => {
    const h = (e) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target) && e.target !== inputRef.current) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

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
        const res = await fetch("/api/product/getAllProducts", { signal: ctrl.signal });
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
    <div className="relative" ref={popRef}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(q);
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
          className="w-full h-11 md:h-12 rounded-2xl bg-blue-50/70 pl-10 pr-4 text-[15px]
                     ring-1 ring-inset ring-blue-100 placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Search"
        />
      </form>

      {open && rows.length > 0 && (
        <div
          className="absolute z-[210] mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
          style={{ maxHeight: "min(60vh, 480px)" }}
          role="listbox"
          aria-label="Search suggestions"
        >
          <ul className="divide-y divide-gray-100 overflow-auto" style={{ maxHeight: "inherit" }}>
            {rows.map((r) => (
              <li key={r._id}>
                <button
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                    onChoose?.(r._id);
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
                  <span className="truncate text-sm text-gray-800">{r.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ===================== Utils ===================== */
function useDebounce(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
