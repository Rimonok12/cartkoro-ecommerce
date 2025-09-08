// "use client";
// import ProductCard from "@/components/ProductCard";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import { useAppContext } from "@/context/AppContext";
// import { essentialsOnLoad } from "@/lib/ssrHelper";

// export async function getServerSideProps(context) {
//   const essentials = await essentialsOnLoad(context);
//   return {
//     props: {
//       ...essentials.props,
//     },
//   };
// }

// const AllProducts = () => {
//   const { products } = useAppContext();

//   return (
//     <>
//       <Navbar />
//       <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">
//         <div className="flex flex-col items-end pt-12">
//           <p className="text-2xl font-medium">All products</p>
//           <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
//         </div>
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-12 pb-14 w-full">
//           {products.map((product, index) => (
//             <ProductCard key={index} product={product} />
//           ))}
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default AllProducts;

// pages/all-products.js

// import React from "react";
// import ProductCard from "@/components/ProductCard";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import { essentialsOnLoad } from "@/lib/ssrHelper"; // keep your existing helper

// export async function getServerSideProps(context) {
//   const essentials = await essentialsOnLoad(context);

//   // Fetch products on the server (same API you already have)
//   let products = [];
//   try {
//     const url = `${process.env.NODE_HOST}/api/product/getAllProducts`;
//     const res = await fetch(url, {
//       headers: { "Content-Type": "application/json" },
//     });
//     const data = await res.json();
//     products = Array.isArray(data) ? data : data?.products || [];
//   } catch (e) {
//     // swallow error; render empty grid
//   }

//   return {
//     props: {
//       ...essentials.props,
//       products,
//     },
//   };
// }

// const AllProducts = ({ products = [] }) => {
//   return (
//     <>
//       <Navbar />
//       <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">
//         <div className="flex flex-col items-end pt-12">
//           <p className="text-2xl font-medium">All products</p>
//           <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-12 pb-14 w-full">
//           {products.map((product, index) => (
//             <ProductCard key={index} product={product} />
//           ))}
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default AllProducts;

// import React, { useMemo, useState, useEffect } from "react";
// import { useRouter } from "next/router";
// import ProductCard from "@/components/ProductCard";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import { essentialsOnLoad } from "@/lib/ssrHelper";

// // ---------- SERVER SIDE (keeps your current API exactly as-is) ----------
// export async function getServerSideProps(context) {
//   const essentials = await essentialsOnLoad(context);

//   // NOTE: We still fetch ALL (as your API is today). We paginate/filter on the client for now.
//   // When you upgrade the API, see the "Upgrade to backend pagination" section below.
//   let products = [];
//   try {
//     const url = `${process.env.NODE_HOST}/api/product/getAllProducts`;
//     const res = await fetch(url, {
//       headers: { "Content-Type": "application/json" },
//     });
//     const data = await res.json();
//     products = Array.isArray(data) ? data : data?.products || [];
//   } catch (e) {
//     // swallow error; render empty
//   }

//   return { props: { ...essentials.props, products } };
// }

// // ---------- HELPERS ----------
// const parseArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
// const numberOr = (v, fallback) => {
//   const n = parseInt(v, 10);
//   return Number.isFinite(n) ? n : fallback;
// };

// const BRANDS = ["HUAWEI", "SAMSUNG", "Xiaomi", "Zeblaze", "HONOR", "Fitbit"];
// const CATEGORIES = ["Smartband", "Smartwatch", "Accessories"];

// const Sidebar = ({ state, onChange, onSubmit, onReset }) => {
//   const { brands, minPrice, maxPrice, category } = state;
//   return (
//     <aside className="w-full lg:w-auto lg:sticky lg:top-20">
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           onSubmit();
//         }}
//         className="space-y-8"
//       >
//         {/* Brand */}
//         <div>
//           <p className="text-lg font-semibold mb-3">Filter by Brand</p>
//           <div className="space-y-2">
//             {BRANDS.map((b) => {
//               const checked = brands.includes(b);
//               return (
//                 <label
//                   key={b}
//                   className="flex items-center gap-3 cursor-pointer"
//                 >
//                   <input
//                     type="checkbox"
//                     className="h-4 w-4"
//                     checked={checked}
//                     onChange={(e) => {
//                       const next = checked
//                         ? brands.filter((x) => x !== b)
//                         : [...brands, b];
//                       onChange({ brands: next });
//                     }}
//                   />
//                   <span>{b}</span>
//                 </label>
//               );
//             })}
//           </div>
//         </div>

//         {/* Price */}
//         <div>
//           <p className="text-lg font-semibold mb-3">Filter by Price</p>
//           <div className="flex items-center gap-3">
//             <input
//               type="number"
//               placeholder="Min"
//               className="border rounded px-3 py-2 w-28"
//               value={minPrice ?? ""}
//               onChange={(e) =>
//                 onChange({
//                   minPrice: e.target.value ? Number(e.target.value) : undefined,
//                 })
//               }
//             />
//             <span>—</span>
//             <input
//               type="number"
//               placeholder="Max"
//               className="border rounded px-3 py-2 w-28"
//               value={maxPrice ?? ""}
//               onChange={(e) =>
//                 onChange({
//                   maxPrice: e.target.value ? Number(e.target.value) : undefined,
//                 })
//               }
//             />
//           </div>
//         </div>

//         {/* Category */}
//         <div>
//           <p className="text-lg font-semibold mb-3">Product Category</p>
//           <select
//             className="border rounded px-3 py-2 w-full"
//             value={category || ""}
//             onChange={(e) =>
//               onChange({ category: e.target.value || undefined })
//             }
//           >
//             <option value="">All</option>
//             {CATEGORIES.map((c) => (
//               <option key={c} value={c}>
//                 {c}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex items-center gap-3">
//           <button
//             type="submit"
//             className="bg-orange-600 text-white px-4 py-2 rounded-md hover:opacity-90"
//           >
//             Apply
//           </button>
//           <button
//             type="button"
//             className="border px-4 py-2 rounded-md"
//             onClick={() => onReset()}
//           >
//             Reset
//           </button>
//         </div>
//       </form>
//     </aside>
//   );
// };

// const Pagination = ({ total, page, limit, onPageChange }) => {
//   const totalPages = Math.max(1, Math.ceil(total / limit));
//   const prevDisabled = page <= 1;
//   const nextDisabled = page >= totalPages;

//   const pages = [];
//   for (let i = 1; i <= totalPages; i++) pages.push(i);

//   return (
//     <div className="flex items-center justify-center gap-2 mt-6">
//       <button
//         className="border rounded px-3 py-1 disabled:opacity-50"
//         disabled={prevDisabled}
//         onClick={() => onPageChange(page - 1)}
//       >
//         Prev
//       </button>

//       {pages.map((p) => (
//         <button
//           key={p}
//           className={`border rounded px-3 py-1 ${
//             p === page ? "bg-black text-white" : ""
//           }`}
//           onClick={() => onPageChange(p)}
//         >
//           {p}
//         </button>
//       ))}

//       <button
//         className="border rounded px-3 py-1 disabled:opacity-50"
//         disabled={nextDisabled}
//         onClick={() => onPageChange(page + 1)}
//       >
//         Next
//       </button>
//     </div>
//   );
// };

// // ---------- PAGE ----------
// const AllProducts = ({ products = [] }) => {
//   const router = useRouter();
//   const q = router.query;

//   // URL → UI state
//   const [filters, setFilters] = useState({
//     brands: parseArray(q.brand),
//     minPrice: q.min ? Number(q.min) : undefined,
//     maxPrice: q.max ? Number(q.max) : undefined,
//     category: q.category || undefined,
//   });

//   const page = numberOr(q.page, 1);
//   const limit = numberOr(q.limit, 12);

//   const updateURL = (next = {}) => {
//     const params = {
//       ...q,
//       ...next,
//     };

//     // normalize arrays & remove empty
//     const norm = {};
//     for (const [k, v] of Object.entries(params)) {
//       if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0))
//         continue;
//       norm[k] = v;
//     }
//     router.push({ pathname: router.pathname, query: norm }, undefined, {
//       shallow: true,
//       scroll: true,
//     });
//   };

//   // Apply filters locally (works with your current API)
//   const filtered = useMemo(() => {
//     let list = [...products];

//     if (filters.brands.length) {
//       list = list.filter((p) =>
//         filters.brands.some(
//           (b) => (p.brand || "").toLowerCase() === b.toLowerCase()
//         )
//       );
//     }
//     if (filters.category) {
//       list = list.filter(
//         (p) =>
//           (p.category || "").toLowerCase() === filters.category.toLowerCase()
//       );
//     }
//     if (filters.minPrice !== undefined) {
//       list = list.filter((p) => Number(p.price) >= filters.minPrice);
//     }
//     if (filters.maxPrice !== undefined) {
//       list = list.filter((p) => Number(p.price) <= filters.maxPrice);
//     }
//     return list;
//   }, [products, filters]);

//   // slice for pagination
//   const start = (page - 1) * limit;
//   const visible = filtered.slice(start, start + limit);

//   // Reset page to 1 when filters change
//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [filters]);

//   return (
//     <>
//       <Navbar />
//       <div className="px-6 md:px-16 lg:px-32">
//         {/* Header */}
//         <div className="flex flex-col items-end pt-12">
//           <p className="text-2xl font-medium">All products</p>
//           <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
//         </div>

//         {/* Layout: Sidebar (left) + Products (right) */}
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10 pb-14">
//           {/* LEFT: filters */}
//           <div className="lg:col-span-3">
//             <Sidebar
//               state={filters}
//               onChange={(patch) => setFilters((s) => ({ ...s, ...patch }))}
//               onSubmit={() => {
//                 // encode filters into URL; also reset page to 1
//                 updateURL({
//                   brand: filters.brands,
//                   min: filters.minPrice,
//                   max: filters.maxPrice,
//                   category: filters.category,
//                   page: 1,
//                 });
//               }}
//               onReset={() => {
//                 setFilters({
//                   brands: [],
//                   minPrice: undefined,
//                   maxPrice: undefined,
//                   category: undefined,
//                 });
//                 updateURL({
//                   brand: undefined,
//                   min: undefined,
//                   max: undefined,
//                   category: undefined,
//                   page: 1,
//                 });
//               }}
//             />
//           </div>

//           {/* RIGHT: product grid */}
//           <div className="lg:col-span-9">
//             <div className="flex items-center justify-between mb-4">
//               <p className="text-sm text-gray-600">
//                 Showing {filtered.length ? start + 1 : 0}–
//                 {Math.min(start + limit, filtered.length)} of {filtered.length}
//               </p>
//               <div className="flex items-center gap-2">
//                 <label className="text-sm text-gray-600">Per page</label>
//                 <select
//                   className="border rounded px-2 py-1"
//                   value={limit}
//                   onChange={(e) =>
//                     updateURL({ limit: Number(e.target.value), page: 1 })
//                   }
//                 >
//                   {[6, 12, 24, 48].map((n) => (
//                     <option key={n} value={n}>
//                       {n}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
//               {visible.map((product, index) => (
//                 <ProductCard key={product.id ?? index} product={product} />
//               ))}
//               {visible.length === 0 && (
//                 <div className="col-span-full text-center text-gray-500 py-10">
//                   No products match these filters.
//                 </div>
//               )}
//             </div>

//             <Pagination
//               total={filtered.length}
//               page={page}
//               limit={limit}
//               onPageChange={(p) => updateURL({ page: p })}
//             />
//           </div>
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default AllProducts;

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { essentialsOnLoad } from "@/lib/ssrHelper";

// --------------------- SERVER: same API as today ---------------------
export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);

  let products = [];
  try {
    const url = `${process.env.NODE_HOST}/api/product/getAllProducts`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    products = Array.isArray(data) ? data : data?.products || [];
  } catch (_) {}

  return { props: { ...essentials.props, products } };
}

// --------------------- HELPERS ---------------------
const parseArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const numberOr = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const BRANDS = ["HUAWEI", "SAMSUNG", "Xiaomi", "Zeblaze", "HONOR", "Fitbit"];
const CATEGORIES = ["Smartband", "Smartwatch", "Accessories"];

// map UI sort keys to in-memory sort logic
const SORTS = [
  { key: "recommended", label: "Recommended" }, // your default / manual ranking
  { key: "new", label: "What's New" }, // newest first by createdAt
  { key: "popular", label: "Popularity" }, // by popularity or sales
  { key: "discount", label: "Better Discount" }, // higher discount %
  { key: "price_desc", label: "Price: High to Low" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "rating", label: "Customer Rating" }, // higher rating first
];

const Sidebar = ({ state, onChange, onSubmit, onReset }) => {
  const { brands, minPrice, maxPrice, category } = state;
  return (
    <aside className="w-full lg:w-auto lg:sticky lg:top-20">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-8"
      >
        {/* Brand */}
        <div>
          <p className="text-lg font-semibold mb-3">Filter by Brand</p>
          <div className="space-y-2">
            {BRANDS.map((b) => {
              const checked = brands.includes(b);
              return (
                <label
                  key={b}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? brands.filter((x) => x !== b)
                        : [...brands, b];
                      onChange({ brands: next });
                    }}
                  />
                  <span>{b}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="text-lg font-semibold mb-3">Filter by Price</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Min"
              className="border rounded px-3 py-2 w-28"
              value={minPrice ?? ""}
              onChange={(e) =>
                onChange({
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <span>—</span>
            <input
              type="number"
              placeholder="Max"
              className="border rounded px-3 py-2 w-28"
              value={maxPrice ?? ""}
              onChange={(e) =>
                onChange({
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <p className="text-lg font-semibold mb-3">Product Category</p>
          <select
            className="border rounded px-3 py-2 w-full"
            value={category || ""}
            onChange={(e) =>
              onChange({ category: e.target.value || undefined })
            }
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:opacity-90"
          >
            Apply
          </button>
          <button
            type="button"
            className="border px-4 py-2 rounded-md"
            onClick={() => onReset()}
          >
            Reset
          </button>
        </div>
      </form>
    </aside>
  );
};

const Pagination = ({ total, page, limit, onPageChange, perPageControl }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      <div className="flex items-center justify-center gap-2">
        <button
          className="border rounded px-3 py-1 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`border rounded px-3 py-1 ${
              p === page ? "bg-black text-white" : ""
            }`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="border rounded px-3 py-1 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>

      {/* Per page moved DOWN here */}
      <div>{perPageControl}</div>
    </div>
  );
};

// --------------------- PAGE ---------------------
const AllProducts = ({ products = [] }) => {
  const router = useRouter();
  const q = router.query;

  // URL → UI state
  const [filters, setFilters] = useState({
    brands: parseArray(q.brand),
    minPrice: q.min ? Number(q.min) : undefined,
    maxPrice: q.max ? Number(q.max) : undefined,
    category: q.category || undefined,
  });

  // pagination + sort from URL
  const page = numberOr(q.page, 1);
  const limit = numberOr(q.limit, 12); // default 12
  const sortKey =
    typeof q.sort === "string"
      ? q.sort
      : Array.isArray(q.sort)
      ? q.sort[0]
      : "recommended";

  const updateURL = (next = {}) => {
    const params = { ...q, ...next };
    const norm = {};
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0))
        continue;
      norm[k] = v;
    }
    router.push({ pathname: router.pathname, query: norm }, undefined, {
      shallow: true,
      scroll: true,
    });
  };

  // 1) apply filters
  const filtered = useMemo(() => {
    let list = [...products];

    if (filters.brands.length) {
      list = list.filter((p) =>
        filters.brands.some(
          (b) => (p.brand || "").toLowerCase() === b.toLowerCase()
        )
      );
    }
    if (filters.category) {
      list = list.filter(
        (p) =>
          (p.category || "").toLowerCase() === filters.category.toLowerCase()
      );
    }
    if (filters.minPrice !== undefined) {
      list = list.filter((p) => Number(p.price) >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      list = list.filter((p) => Number(p.price) <= filters.maxPrice);
    }
    return list;
  }, [products, filters]);

  // 2) apply sort
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortKey) {
      case "price_desc":
        return list.sort((a, b) => Number(b.price) - Number(a.price));
      case "price_asc":
        return list.sort((a, b) => Number(a.price) - Number(b.price));
      case "new":
        return list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
      case "popular":
        return list.sort(
          (a, b) => Number(b.popularity || 0) - Number(a.popularity || 0)
        );
      case "discount":
        const disc = (p) =>
          p.mrp && p.price
            ? ((Number(p.mrp) - Number(p.price)) / Number(p.mrp)) * 100
            : 0;
        return list.sort((a, b) => disc(b) - disc(a));
      case "rating":
        return list.sort(
          (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
        );
      case "recommended":
      default:
        return list; // as-is
    }
  }, [filtered, sortKey]);

  // 3) slice for pagination
  const start = (page - 1) * limit;
  const visible = sorted.slice(start, start + limit);

  // Reset page to 1 when filters or sort change
  useEffect(() => {
    // whenever filters or sortKey change via URL, ensure we don't land on empty page
    if (page !== 1) updateURL({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortKey]);

  // dropdown UI (like your screenshot)
  const SortDropdown = () => {
    const [open, setOpen] = useState(false);
    const current = SORTS.find((s) => s.key === sortKey) || SORTS[0];

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="border rounded-md px-3 py-2 flex items-center gap-2 min-w-[240px] justify-between"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>
            <span className="text-gray-600">Sort by :</span>{" "}
            <span className="font-semibold">{current.label}</span>
          </span>
          <span className="i-chevron-down w-4 h-4" />
        </button>

        {open && (
          <ul
            className="absolute z-20 mt-2 w-full bg-white shadow-xl rounded-md border py-2"
            role="listbox"
          >
            {SORTS.map((opt) => (
              <li key={opt.key}>
                <button
                  type="button"
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                    opt.key === sortKey ? "font-medium" : ""
                  }`}
                  onClick={() => {
                    setOpen(false);
                    updateURL({ sort: opt.key, page: 1 });
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // per page selector moved below (rendered via Pagination prop)
  const PerPageControl = (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Per page</label>
      <select
        className="border rounded px-2 py-1"
        value={limit}
        onChange={(e) => updateURL({ limit: Number(e.target.value), page: 1 })}
      >
        {[6, 12, 24, 48].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32">
        {/* Header */}
        <div className="flex flex-col items-end pt-12">
          <p className="text-2xl font-medium">All products</p>
          <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
        </div>

        {/* Layout: Sidebar (left) + Products (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10 pb-14">
          {/* LEFT: filters */}
          <div className="lg:col-span-3">
            <Sidebar
              state={filters}
              onChange={(patch) => setFilters((s) => ({ ...s, ...patch }))}
              onSubmit={() =>
                updateURL({
                  brand: filters.brands,
                  min: filters.minPrice,
                  max: filters.maxPrice,
                  category: filters.category,
                  page: 1,
                })
              }
              onReset={() => {
                setFilters({
                  brands: [],
                  minPrice: undefined,
                  maxPrice: undefined,
                  category: undefined,
                });
                updateURL({
                  brand: undefined,
                  min: undefined,
                  max: undefined,
                  category: undefined,
                  page: 1,
                });
              }}
            />
          </div>

          {/* RIGHT: product grid */}
          <div className="lg:col-span-9">
            {/* Top row: results count + SORT DROPDOWN (per screenshot). Per page moved below. */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing {sorted.length ? start + 1 : 0}–
                {Math.min(start + limit, sorted.length)} of {sorted.length}
              </p>
              <SortDropdown />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {visible.map((product, index) => (
                <ProductCard key={product?.id ?? index} product={product} />
              ))}
              {visible.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10">
                  No products match these filters.
                </div>
              )}
            </div>

            <Pagination
              total={sorted.length}
              page={page}
              limit={limit}
              onPageChange={(p) => updateURL({ page: p })}
              perPageControl={PerPageControl} // 👈 per page goes *below* the grid now
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AllProducts;
