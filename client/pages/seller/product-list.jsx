"use client";
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Navbar from "@/components/seller/Navbar";
import Sidebar from "@/components/seller/Sidebar";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import { requireB2B } from "@/lib/ssrHelper";
import { useRouter } from "next/router";
import api from "@/lib/axios";

export async function getServerSideProps(context) {
  return requireB2B(context);
}

const money = (symbol, n) => {
  const num = Number(n ?? 0);
  return `${symbol} ${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)}`;
};

function VariantChips({ values }) {
  if (!values || typeof values !== "object") return null;
  const entries = Object.entries(values).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== ""
  );
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([k, v]) => (
        <span
          key={`${k}:${v}`}
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700"
          title={`${k}: ${v}`}
        >
          <span className="font-medium mr-1 capitalize">{k}:</span>
          {String(v)}
        </span>
      ))}
    </div>
  );
}

const Chevron = ({ open }) => (
  <svg
    aria-hidden
    viewBox="0 0 20 20"
    className={`h-4 w-4 transition-transform duration-200 ${
      open ? "rotate-90" : "rotate-0"
    }`}
  >
    <path
      fill="currentColor"
      d="M7.05 3.94a1 1 0 011.41 0l5.6 5.6a1 1 0 010 1.41l-5.6 5.6a1 1 0 11-1.41-1.41L11.8 10 7.05 5.35a1 1 0 010-1.41z"
    />
  </svg>
);

export default function ProductList() {
  const router = useRouter();
  const { currency } = useAppContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [expanded, setExpanded] = useState({});
  const [details, setDetails] = useState({}); // { sku_id: { loading, error, data } }

  const fetchSellerProduct = async () => {
    try {
      setErrMsg("");
      const res = await api.get("/product/getAllProductsBySeller", {
        withCredentials: true,
      });
      const list = Array.isArray(res.data) ? res.data.slice() : [];
      list.sort((a, b) => {
        const ta = new Date(
          a.product_created_at ?? a.sku_created_at ?? 0
        ).getTime();
        const tb = new Date(
          b.product_created_at ?? b.sku_created_at ?? 0
        ).getTime();
        return tb - ta;
      });
      setProducts(list);
    } catch (e) {
      console.error("fetchSellerProduct:", e);
      setProducts([]);
      setErrMsg("Failed to load products. See console/network for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerProduct();
  }, []);

  const toggleExpand = async (row) => {
    const key = row.sku_id;
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

    if (!details[key]) {
      setDetails((prev) => ({
        ...prev,
        [key]: { loading: true, error: "", data: null },
      }));
      try {
        const res = await fetch(
          `/api/product/getProductBySkuId?skuId=${encodeURIComponent(key)}`
        );
        const data = await res.json();

        const pickPrice = (sku) => ({
          seller_sp:
            typeof sku?.seller_sp === "number" ? sku.seller_sp : sku?.SP,
          seller_mrp:
            typeof sku?.seller_mrp === "number" ? sku.seller_mrp : sku?.MRP,
        });

        const items = [];
        if (data?.main_sku) {
          items.push({
            _id: data.main_sku._id,
            thumb: data.main_sku.thumbnail_img || data.main_sku.image || "",
            variants: data.main_sku.variant_values || {},
            left_stock: data.main_sku.left_stock,
            initial_stock:
              data.main_sku.initial_stock ?? data.main_sku.total_stock,
            ...pickPrice(data.main_sku),
          });
        }
        if (Array.isArray(data?.other_skus)) {
          for (const s of data.other_skus) {
            items.push({
              _id: s._id,
              thumb: s.thumbnail_img || s.image || "",
              variants: s.variant_values || {},
              left_stock: s.left_stock,
              initial_stock: s.initial_stock ?? s.total_stock,
              ...pickPrice(s),
            });
          }
        }

        setDetails((prev) => ({
          ...prev,
          [key]: {
            loading: false,
            error: "",
            data: { product_name: data?.product_name, items },
          },
        }));
      } catch (e) {
        setDetails((prev) => ({
          ...prev,
          [key]: {
            loading: false,
            error: e?.message || "Failed to load details",
            data: null,
          },
        }));
      }
    }
  };

  const EmptyState = () => (
    <div className="px-4 py-10 text-center text-gray-500">
      No products found.
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          <div className="flex-1 min-h-screen flex flex-col justify-between">
            {loading ? (
              <Loading />
            ) : (
              <div className="w-full md:p-10 p-4">
                <div className="mb-6 flex items-end justify-between gap-3">
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
                    className="rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm shadow-sm hover:bg-white active:scale-[.98]"
                  >
                    Refresh
                  </button>
                </div>

                {errMsg && (
                  <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                    {errMsg}
                  </div>
                )}

                <div className="flex flex-col items-center max-w-5xl w-full rounded-2xl bg-white ring-1 ring-black/5">
                  {/* Minimal borders; rely on spacing & soft separators */}
                  <div className="w-full">
                    {products.length === 0 && <EmptyState />}

                    {products.map((product, index) => {
                      const key = product.sku_id;
                      const isOpen = !!expanded[key];
                      const rowDetails = details[key];

                      return (
                        <div
                          key={product._id || product.sku_id || index}
                          className="border-b last:border-b-0 border-gray-100"
                        >
                          {/* Row */}
                          <div className="px-3 md:px-4 py-3 flex items-start gap-3 md:gap-4 hover:bg-gray-50/60 transition-colors">
                            <button
                              aria-expanded={isOpen}
                              aria-controls={`row-${key}`}
                              onClick={() => toggleExpand(product)}
                              className="mt-1 grid place-items-center rounded-lg bg-white hover:bg-gray-50 w-8 h-8 text-gray-600 shadow-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                              title={isOpen ? "Collapse" : "Expand"}
                            >
                              <Chevron open={isOpen} />
                            </button>

                            <div className="bg-gray-100 rounded-lg p-2 shrink-0 ring-1 ring-gray-100">
                              <Image
                                src={product.thumbnail_img || assets.box_icon}
                                alt="product Image"
                                className="w-16 h-16 object-cover"
                                width={1280}
                                height={720}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <div className="truncate font-medium text-gray-900 text-sm md:text-base">
                                  {product.name}
                                </div>
                              </div>
                              {/* removed variant preview here per request */}
                              <div className="text-xs text-gray-500 mt-0.5">
                                {product.category_name || "—"}
                              </div>
                            </div>

                            <div className="ml-auto">
                              {/* Action: only Edit */}
                              <button
                                onClick={() =>
                                  router.push(`${product.visitUrl}`)
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[.98]"
                              >
                                Edit
                              </button>
                            </div>
                          </div>

                          {/* Expanded (SKU-only details) */}
                          {isOpen && (
                            <div
                              id={`row-${key}`}
                              className="px-3 md:px-4 pb-4"
                            >
                              <div className="rounded-xl bg-gray-50 p-3 md:p-4 shadow-sm">
                                {rowDetails?.loading ? (
                                  <div className="py-6 text-gray-500">
                                    Loading variants…
                                  </div>
                                ) : rowDetails?.error ? (
                                  <div className="py-6 text-red-600">
                                    {rowDetails.error}
                                  </div>
                                ) : rowDetails?.data?.items?.length ? (
                                  <>
                                    <div className="mb-3 text-xs text-gray-500">
                                      {rowDetails.data.items.length} variant
                                      {rowDetails.data.items.length > 1
                                        ? "s"
                                        : ""}
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {rowDetails.data.items.map((sku) => {
                                        console.log("sku::", sku);
                                        const initial = sku.sku_initial_stock;
                                        const sold = sku.sku_sold_stock;

                                        return (
                                          <div
                                            key={sku._id}
                                            className="rounded-xl bg-white p-3 flex gap-3 items-start shadow hover:shadow-md transition"
                                          >
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-1 ring-gray-100 bg-gray-50 shrink-0">
                                              <Image
                                                src={
                                                  sku.thumb || assets.box_icon
                                                }
                                                alt="variant"
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                              />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              {/* Show variant chips only inside SKU cards */}
                                              <VariantChips
                                                values={sku.variants}
                                              />
                                              <div className="mt-2 text-sm">
                                                <div className="font-semibold text-gray-900">
                                                  {money(
                                                    currency,
                                                    sku.seller_sp
                                                  )}
                                                </div>
                                                {sku?.seller_mrp ? (
                                                  <div className="text-[11px] text-gray-500">
                                                    MRP:{" "}
                                                    {money(
                                                      currency,
                                                      sku.seller_mrp
                                                    )}
                                                  </div>
                                                ) : null}
                                                <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-3">
                                                  {typeof initial ===
                                                    "number" && (
                                                    <span>
                                                      Total: {initial}
                                                    </span>
                                                  )}
                                                  {typeof sold === "number" && (
                                                    <span>Sold: {sold}</span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            <button
                                              onClick={() =>
                                                router.push(
                                                  `/product/${sku._id}`
                                                )
                                              }
                                              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-orange-600 px-3.5 py-2 text-white shadow-sm hover:bg-orange-700 active:scale-[.98]"
                                            >
                                              View
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                ) : (
                                  <div className="py-6 text-gray-500">
                                    No variants found for this product.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
