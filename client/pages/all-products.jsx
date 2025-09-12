import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { essentialsOnLoad } from "@/lib/ssrHelper";

/* --------------------- SERVER: products only (fast SSR) --------------------- */
export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);

  const { categoryId } = context.query;
  const cat = Array.isArray(categoryId) ? categoryId[0] : categoryId;

  const proto = context.req.headers["x-forwarded-proto"] || "http";
  const host = context.req.headers.host;
  const base = process.env.NODE_HOST || `${proto}://${host}`;

  let products = [];
  try {
    const res = await fetch(
      `${base}/api/product/getAllProducts${
        cat ? `?categoryId=${encodeURIComponent(cat)}` : ""
      }`,
      { headers: { "Content-Type": "application/json" } }
    );
    const data = await res.json();
    products = Array.isArray(data) ? data : data?.products || [];
  } catch (err) {
    console.error("getAllProducts SSR fetch failed:", err);
  }

  return { props: { ...essentials.props, products } };
}

/* --------------------- HELPERS --------------------- */
const numberOr = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const SORTS = [
  { key: "", label: "Recommended" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "price_asc", label: "Price: Low to High" },
];

/* --------------------- PAGINATION --------------------- */
const Pagination = ({ total, page, limit, onPageChange, perPageControl }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-10 flex flex-col items-center gap-5">
      <div className="flex items-center justify-center gap-2">
        <button
          className="border rounded-lg px-3 py-1.5 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`border rounded-lg px-3 py-1.5 ${
              p === page ? "bg-black text-white" : ""
            }`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="border rounded-lg px-3 py-1.5 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>

      <div>{perPageControl}</div>
    </div>
  );
};

/* --------------------- PAGE --------------------- */
const AllProducts = ({ products = [] }) => {
  const router = useRouter();
  const q = router.query;

  // pagination + sort from URL (default: High → Low)
  const page = numberOr(q.page, 1);
  const limit = numberOr(q.limit, 12);
  const sortKey =
    typeof q.sort === "string" &&
    (q.sort === "" || q.sort === "price_desc" || q.sort === "price_asc")
      ? q.sort
      : "";

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

  // derive numeric SP for sorting (selling_price preferred)
  const getSP = (p) => Number(p?.selling_price ?? p?.SP ?? p?.price ?? 0);

  const sorted = useMemo(() => {
    // keep original order stable by carrying index
    const withIndex = products.map((p, i) => ({ p, i }));

    if (sortKey === "price_desc") {
      withIndex.sort((a, b) => getSP(b.p) - getSP(a.p) || a.i - b.i);
    } else if (sortKey === "price_asc") {
      withIndex.sort((a, b) => getSP(a.p) - getSP(b.p) || a.i - b.i);
    } // else "" -> recommended: no sort, preserve original order

    return withIndex.map(({ p }) => p);
  }, [products, sortKey]);

  // paginate
  const start = (page - 1) * limit;
  const visible = sorted.slice(start, start + limit);

  // reset page to 1 when sort changes
  useEffect(() => {
    if (page !== 1) updateURL({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey]);

  // minimal sort dropdown
  const SortDropdown = () => {
    const [open, setOpen] = useState(false);
    const current = SORTS.find((s) => s.key === sortKey) || SORTS[0];

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="border rounded-xl px-3 py-2 flex items-center gap-2 min-w-[220px] justify-between bg-white"
        >
          <span>
            <span className="text-gray-600">Sort by:</span>{" "}
            <span className="font-semibold">{current.label}</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" />
          </svg>
        </button>

        {open && (
          <ul className="absolute z-20 mt-2 w-full bg-white shadow-xl rounded-xl border py-2">
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

  const PerPageControl = (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Per page</label>
      <select
        className="border rounded-lg px-2 py-1 bg-white"
        value={limit}
        onChange={(e) => updateURL({ limit: Number(e.target.value), page: 1 })}
      >
        {[12, 24, 48, 96].map((n) => (
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
        <div className="flex items-end justify-between pt-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              All Products
            </h1>
            <div className="mt-2 h-0.5 w-16 rounded-full bg-black/80" />
          </div>
        </div>

        {/* Single-column layout (no sidebar) */}
        <div className="mt-8 pb-16">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-600">
              Showing {sorted.length ? start + 1 : 0}–
              {Math.min(start + limit, sorted.length)} of {sorted.length}
            </p>
            <SortDropdown />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {visible.map((product, index) => (
              <ProductCard
                key={product?.id ?? product?._id ?? index}
                product={product}
              />
            ))}
            {visible.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-16 rounded-2xl border bg-gray-50">
                <svg
                  className="w-12 h-12 mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L4.5 12m0 0l5.25-5M4.5 12h15"
                  />
                </svg>
                <p className="text-lg font-medium">No products found</p>
              </div>
            )}
          </div>

          <Pagination
            total={sorted.length}
            page={page}
            limit={limit}
            onPageChange={(p) => updateURL({ page: p })}
            perPageControl={PerPageControl}
          />
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AllProducts;
