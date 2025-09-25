// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import Image from "next/image";
// import { useAppContext } from "@/context/AppContext";
// import { useRouter } from "next/router";

// /* ===================== Icons ===================== */
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

// /* Black wallet icon for Cashback */
// const CashbackIcon = (p) => (
//   <svg
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     aria-hidden="true"
//     {...p}
//   >
//     <rect x="3" y="6.5" width="18" height="11" rx="2.5" />
//     <path d="M16 6.5v4H21" />
//     <circle cx="16" cy="12" r="1.6" />
//   </svg>
// );

// /* Lazy account menu (first in sequence) */
// const AccountDropdown = React.lazy(() => import("@/components/AccountDropdown"));

// /* For search result normalization */
// const normRow = (p) => {
//   const id = p?.sku_id || p?._id || p?.id || Math.random().toString(36).slice(2);
//   const name = p?.name || "Untitled";
//   const thumb = p?.thumbnail_img || p?.thumbnail || "";
//   return { _id: id, name, thumb };
// };

// const formatCount = (n) => {
//   const v = Number.isFinite(+n) ? Math.max(0, Math.floor(+n)) : 0;
//   return v > 99 ? "99+" : String(v);
// };

// /* ===================== Navbar ===================== */
// export default function Navbar() {
//   const { getCartCount, cashbackData = 0, userData } = useAppContext();
//   const router = useRouter();

//   const isLoggedIn = Boolean(userData && (userData._id || userData.id));
//   const cartCount = getCartCount();

//   const goGated = (targetPath, redirectKey) => {
//     if (isLoggedIn) router.push(targetPath);
//     else router.push(`/login?redirect=${encodeURIComponent(redirectKey)}`);
//   };

//   return (
//     <nav
//       className="sticky top-0 z-[200] w-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 ring-1 ring-black/5"
//       style={{ paddingTop: "env(safe-area-inset-top)" }}
//       role="navigation"
//       aria-label="Primary"
//     >
//       <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-2 md:py-3">
//         {/* ===== Bar: on md+ everything is a single row; on mobile it splits into two rows ===== */}
//         <div className="flex flex-col gap-2 md:gap-0">
//           {/* Row A: logo + (desktop search) + actions */}
//           <div className="flex items-center gap-2 md:gap-3">
//             {/* Logo */}
//             <button
//               onClick={() => router.push("/")}
//               className="shrink-0 focus:outline-none h-9 md:h-10"
//               aria-label="Go home"
//             >
//               <Image
//                 src="/1.png"
//                 alt="CartKoro"
//                 width={120}
//                 height={36}
//                 className="h-9 w-auto md:h-10"
//                 priority
//               />
//             </button>

//             {/* Desktop search (inline) */}
//             <div className="hidden md:block flex-1">
//               <SearchBox
//                 onChoose={(id) => router.push(`/product/${id}`)}
//                 onSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
//               />
//             </div>

//             {/* Actions cluster — ORDER: Account → Cashback → Cart */}
//             <div className="ml-auto flex items-center gap-1.5 md:gap-3">
//               {/* Account first */}
//               <React.Suspense fallback={<div className="h-9 w-28 rounded-xl bg-gray-100" />}>
//                 <AccountDropdown />
//               </React.Suspense>

//               {/* Cashback second (wallet icon + top-right badge) */}
//               <button
//                 onClick={() => goGated("/rewards", "rewards")}
//                 className="relative inline-flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-gray-50 text-gray-900"
//                 aria-label="Rewards"
//               >
//                 <CashbackIcon className="h-5 w-5 text-black" />
//                 <span className="hidden md:block text-sm">Cashback</span>
//                 <span className="ml-1 grid place-items-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
//                   {Math.max(0, Math.floor(cashbackData))}
//                 </span>
//               </button>

//               {/* Cart third */}
//               <button
//                 onClick={() => goGated("/cart", "cart")}
//                 className="relative inline-flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-gray-50 text-gray-800 min-h-[40px] min-w-[40px]"
//                 aria-label="Cart"
//               >
//                 <CartIcon className="h-5 w-5" />
//                 <span className="hidden md:block text-sm">Cart</span>
//                 {cartCount > 0 && (
//                   <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
//                     {formatCount(cartCount)}
//                   </span>
//                 )}
//               </button>
//             </div>
//           </div>

//           {/* Row B (mobile only): full-width search */}
//           <div className="md:hidden">
//             <SearchBox
//               onChoose={(id) => router.push(`/product/${id}`)}
//               onSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
//             />
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// /* ===================== Search Box ===================== */
// function SearchBox({ onChoose, onSubmit }) {
//   const [q, setQ] = useState("");
//   const [open, setOpen] = useState(false);
//   const [rows, setRows] = useState([]);
//   const popRef = useRef(null);
//   const inputRef = useRef(null);

//   // close popover on outside click
//   useEffect(() => {
//     const h = (e) => {
//       if (!popRef.current) return;
//       if (!popRef.current.contains(e.target) && e.target !== inputRef.current) setOpen(false);
//     };
//     document.addEventListener("mousedown", h);
//     return () => document.removeEventListener("mousedown", h);
//   }, []);

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
//     <div className="relative" ref={popRef}>
//       <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           onSubmit?.(q);
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
//           className="w-full h-11 md:h-12 rounded-2xl bg-blue-50/70 pl-10 pr-4 text-[15px]
//                      ring-1 ring-inset ring-blue-100 placeholder:text-gray-500
//                      focus:outline-none focus:ring-2 focus:ring-blue-300"
//           aria-label="Search"
//         />
//       </form>

//       {open && rows.length > 0 && (
//         <div
//           className="absolute z-[210] mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
//           style={{ maxHeight: "min(60vh, 480px)" }}
//           role="listbox"
//           aria-label="Search suggestions"
//         >
//           <ul className="divide-y divide-gray-100 overflow-auto" style={{ maxHeight: "inherit" }}>
//             {rows.map((r) => (
//               <li key={r._id}>
//                 <button
//                   onClick={() => {
//                     setOpen(false);
//                     setQ("");
//                     onChoose?.(r._id);
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

// /* ===================== Utils ===================== */
// function useDebounce(value, delay = 200) {
//   const [v, setV] = useState(value);
//   useEffect(() => {
//     const id = setTimeout(() => setV(value), delay);
//     return () => clearTimeout(id);
//   }, [value, delay]);
//   return v;
// }


/////////////////////



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

/* Lazy account menu */
const AccountDropdown = React.lazy(() => import("@/components/AccountDropdown"));

/* Normalize Meili hits */
const normRow = (hit) => {
  const id = hit?.id || hit?._id || hit?.sku_id || Math.random().toString(36).slice(2);
  const name = hit?.title || hit?.name || "Untitled";
  const thumb = hit?.thumbnail || hit?.thumbnail_img || "";
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
        <div className="flex flex-col gap-2 md:gap-0">
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

            {/* Desktop search */}
            <div className="hidden md:block flex-1">
              <SearchBox
                onChoose={(id) => router.push(`/product/${id}`)}
                onSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
              />
            </div>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-1.5 md:gap-3">
              <React.Suspense fallback={<div className="h-9 w-28 rounded-xl bg-gray-100" />}>
                <AccountDropdown />
              </React.Suspense>

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

          {/* Mobile search */}
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
      const term = (debouncedQ || "").trim();
      if (term.length === 0) {
        setRows([]);
        setOpen(false);
        return;
      }

      setOpen(true);

      const params = new URLSearchParams();
      if (term.length === 1) {
        params.set("size", term.toUpperCase());
        params.set("hitsPerPage", "6");
      } else {
        params.set("q", term);
        params.set("hitsPerPage", "6");
      }

      const url = `/api/product/searchProducts?${params.toString()}`;

      try {
        const res = await fetch(url, { signal: ctrl.signal, credentials: "include" });
        if (!res.ok) throw new Error("search_failed");
        const json = await res.json();
        const hits = Array.isArray(json?.hits) ? json.hits : [];
        setRows(hits.slice(0, 6).map(normRow));
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
          onFocus={() => q.trim().length >= 1 && setOpen(true)}
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
                  <span className="text-sm font-medium text-gray-900">{r.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
// for no product also some msg-----
// function SearchBox({ onChoose, onSubmit }) {
//   const [q, setQ] = useState("");
//   const [open, setOpen] = useState(false);
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [touched, setTouched] = useState(false); // has the user typed yet?
//   const popRef = useRef(null);
//   const inputRef = useRef(null);

//   // close popover on outside click
//   useEffect(() => {
//     const h = (e) => {
//       if (!popRef.current) return;
//       if (!popRef.current.contains(e.target) && e.target !== inputRef.current) setOpen(false);
//     };
//     document.addEventListener("mousedown", h);
//     return () => document.removeEventListener("mousedown", h);
//   }, []);

//   const debouncedQ = useDebounce(q, 220);

//   useEffect(() => {
//     const ctrl = new AbortController();

//     async function search() {
//       const term = (debouncedQ || "").trim();
//       if (!touched) return;              // do nothing before user types
//       if (term.length === 0) {
//         setRows([]);
//         setOpen(false);
//         setLoading(false);
//         return;
//       }

//       setOpen(true);
//       setLoading(true);

//       const params = new URLSearchParams();
//       if (term.length === 1) {
//         params.set("size", term.toUpperCase()); // S/M/L
//         params.set("hitsPerPage", "6");
//       } else {
//         params.set("q", term);
//         params.set("hitsPerPage", "6");
//       }

//       const url = `/api/product/searchProducts?${params.toString()}`;

//       try {
//         const res = await fetch(url, { signal: ctrl.signal, credentials: "include" });
//         if (!res.ok) throw new Error("search_failed");
//         const json = await res.json();
//         const hits = Array.isArray(json?.hits) ? json.hits : [];
//         setRows(hits.slice(0, 6).map(normRow));
//       } catch {
//         setRows([]); // show “no results” UI on error as well
//       } finally {
//         setLoading(false);
//       }
//     }

//     search();
//     return () => ctrl.abort();
//   }, [debouncedQ, touched]);

//   // Popular quick chips (customize!)
//   const popular = ["kurti set", "tshirt", "saree", "shoes", "watch"];

//   const term = q.trim();
//   const showNoResults = open && !loading && term.length > 0 && rows.length === 0;

//   return (
//     <div className="relative" ref={popRef}>
//       <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           if (!term) return;
//           onSubmit?.(term);
//           setOpen(false);
//         }}
//       >
//         <input
//           ref={inputRef}
//           value={q}
//           onChange={(e) => {
//             setTouched(true);
//             setQ(e.target.value);
//           }}
//           onFocus={() => term.length >= 1 && setOpen(true)}
//           type="search"
//           placeholder="Search for products, brands and more"
//           className={`w-full h-11 md:h-12 rounded-2xl bg-blue-50/70 pl-10 pr-10 text-[15px]
//                       ring-1 ring-inset ring-blue-100 placeholder:text-gray-500
//                       focus:outline-none focus:ring-2 focus:ring-blue-300`}
//           aria-label="Search"
//         />
//         {/* spinner on the right inside input */}
//         {loading && (
//           <span className="absolute right-3 top-1/2 -translate-y-1/2">
//             <svg className="h-4 w-4 animate-spin text-gray-500" viewBox="0 0 24 24">
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
//               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 004 12z"/>
//             </svg>
//           </span>
//         )}
//       </form>

//       {/* Results */}
//       {open && rows.length > 0 && (
//         <div
//           className="absolute z-[210] mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
//           style={{ maxHeight: "min(60vh, 480px)" }}
//           role="listbox"
//           aria-label="Search suggestions"
//         >
//           <ul className="divide-y divide-gray-100 overflow-auto" style={{ maxHeight: "inherit" }}>
//             {rows.map((r) => (
//               <li key={r._id}>
//                 <button
//                   onClick={() => {
//                     setOpen(false);
//                     setQ("");
//                     onChoose?.(r._id);
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
//                   <span className="truncate text-sm text-gray-900">{r.name}</span>
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* No results UI */}
//       {showNoResults && (
//         <div
//           className="absolute z-[210] mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-4"
//           role="dialog"
//           aria-label="No results"
//         >
//           <div className="space-y-3">
//             <div className="text-sm text-gray-700">
//               No results for <span className="font-semibold text-gray-900">“{term}”</span>.
//             </div>

//             <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
//               <li>Check your spelling.</li>
//               <li>Try fewer or different keywords.</li>
//               <li>Use broader terms (e.g. “kurti” instead of “purple kurti set”).</li>
//             </ul>

//             <div className="pt-1">
//               <div className="text-xs font-semibold text-gray-700 mb-1">Popular searches</div>
//               <div className="flex flex-wrap gap-2">
//                 {popular.map((p) => (
//                   <button
//                     key={p}
//                     onClick={() => setQ(p)}
//                     className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
//                   >
//                     {p}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="pt-1">
//               <button
//                 onClick={() => {
//                   onSubmit?.(term);
//                   setOpen(false);
//                 }}
//                 className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
//               >
//                 Search “{term}”
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


/* ===================== Utils ===================== */
function useDebounce(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
