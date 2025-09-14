"use client";
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Navbar from "@/components/admin/Navbar";
import Sidebar from "@/components/admin/Sidebar";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import { requireB2BAdmin } from "@/lib/ssrHelper";
import { useRouter } from "next/router";
import api from "@/lib/axios";
import Link from "next/link";

export async function getServerSideProps(context) {
  return requireB2BAdmin(context);
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

export default function AdminProductList() {
  const router = useRouter();
  const { currency } = useAppContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [expanded, setExpanded] = useState({});
  const [details, setDetails] = useState({});

  const fetchProducts = async () => {
    try {
      setErrMsg("");
      const res = await api.get("/product/getAllProductsByAdmin", {
        withCredentials: true,
      });
      const list = Array.isArray(res.data) ? res.data.slice() : [];

      list.sort((a, b) => {
        const ta = new Date(a.product_created_at ?? a.sku_created_at ?? 0).getTime();
        const tb = new Date(b.product_created_at ?? b.sku_created_at ?? 0).getTime();
        return tb - ta;
      });

      setProducts(list);
    } catch (e) {
      console.error("fetchProducts:", e);
      setProducts([]);
      setErrMsg("Failed to load products. Check console/network for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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
        const res = await fetch(`/api/product/getProductBySkuId?skuId=${encodeURIComponent(key)}`);
        const data = await res.json();

        const toItem = (sku) => ({
          _id: sku._id,
          thumb: sku.thumbnail_img || sku.image || "",
          variants: sku.variant_values || {},
          initial_stock: sku.initial_stock,
          sold_stock: sku.sold_stock,
          seller_sp: sku?.seller_sp,
          seller_mrp: sku?.seller_mrp,
          customer_sp: sku?.SP,
          customer_mrp: sku?.MRP,
        });

        const items = [];
        if (data?.main_sku) items.push(toItem(data.main_sku));
        if (Array.isArray(data?.other_skus)) items.push(...data.other_skus.map(toItem));

        setDetails((prev) => ({
          ...prev,
          [key]: { loading: false, error: "", data: { product_name: data?.product_name, items } },
        }));
      } catch (e) {
        setDetails((prev) => ({
          ...prev,
          [key]: { loading: false, error: e?.message || "Failed to load details", data: null },
        }));
      }
    }
  };

  const EmptyState = () => (
    <div className="px-4 py-10 text-center text-gray-500">No products found.</div>
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
                      All Products (Admin)
                    </h2>
                    <div className="mt-2 h-1.5 w-40 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
                  </div>
                  <button
                    onClick={() => {
                      setLoading(true);
                      fetchProducts();
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
                  <div className="w-full">
                    {products.length === 0 && <EmptyState />}

                    {products.map((product, index) => {
                      const key = product.sku_id;
                      const isOpen = !!expanded[key];
                      const rowDetails = details[key];

                      const sellerName = product?.seller?.name || "—";
                      const sellerPhone = product?.seller?.phone || "—";

                      return (
                        <div key={product._id || product.sku_id || index} className="border-b last:border-b-0 border-gray-100">
                          {/* Collapsed Row */}
                          <div className="px-3 md:px-4 py-3 flex items-start gap-3 md:gap-4 hover:bg-gray-50/60 transition-colors">
                            <button
                              aria-expanded={isOpen}
                              aria-controls={`row-${key}`}
                              onClick={() => toggleExpand(product)}
                              className="mt-1 grid place-items-center rounded-lg bg-white hover:bg-gray-50 w-8 h-8 text-gray-600 shadow-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                            >
                              <Chevron open={isOpen} />
                            </button>
                            <div className="bg-gray-100 rounded-lg p-2 shrink-0 ring-1 ring-gray-100">
                              <Image
                                src={product.thumbnail_img || assets.box_icon}
                                alt="product image"
                                className="w-16 h-16 object-cover"
                                width={1280}
                                height={720}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium text-gray-900 text-sm md:text-base">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {product.category_name || "—"}
                              </div>
                              <div className="mt-1 text-xs text-gray-700">
                                <span className="text-gray-500">Seller: </span>
                                <span className="font-medium text-gray-900">{sellerName}</span>
                                {sellerPhone && sellerPhone !== "—" ? (
                                  <>
                                    <span className="mx-1">·</span>
                                    <span className="text-gray-800">{sellerPhone}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <div className="ml-auto">
                              <button
                                onClick={() => router.push(`${product.visitUrl}`)}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[.98]"
                              >
                                Edit
                              </button>
                            </div>
                          </div>

                          {/* Expanded Row */}
                          {isOpen && (
                            <div id={`row-${key}`} className="px-3 md:px-4 pb-4">
                              <div className="rounded-xl bg-gray-50 p-3 md:p-4 shadow-sm">
                                {rowDetails?.loading ? (
                                  <div className="py-6 text-gray-500">Loading variants…</div>
                                ) : rowDetails?.error ? (
                                  <div className="py-6 text-red-600">{rowDetails.error}</div>
                                ) : rowDetails?.data?.items?.length ? (
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {rowDetails.data.items.map((sku) => (
                                      <div
                                        key={sku._id}
                                        className="rounded-xl bg-white p-3 flex gap-3 items-start shadow hover:shadow-md transition"
                                      >
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-1 ring-gray-100 bg-gray-50 shrink-0">
                                          <Image
                                            src={sku.thumb || assets.box_icon}
                                            alt="variant"
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <VariantChips values={sku.variants} />
                                          <div className="mt-2 text-sm">
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                              <div>
                                                <div className="text-[11px] text-gray-500">Seller SP</div>
                                                <div className="font-semibold text-gray-900">
                                                  {money(currency, sku.seller_sp)}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-[11px] text-gray-500">Customer SP</div>
                                                <div className="font-semibold text-gray-900">
                                                  {money(currency, sku.customer_sp)}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-[11px] text-gray-500">Seller MRP</div>
                                                <div className="text-gray-800">
                                                  {money(currency, sku.seller_mrp)}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-[11px] text-gray-500">Customer MRP</div>
                                                <div className="text-gray-800">
                                                  {money(currency, sku.customer_mrp)}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="text-[11px] text-gray-500 mt-2 flex flex-wrap gap-3">
                                              {typeof sku.initial_stock === "number" && (
                                                <span>Total: {sku.initial_stock}</span>
                                              )}
                                              {typeof sku.sold_stock === "number" && (
                                                <span>Sold: {sku.sold_stock}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <Link
                                          href={`/product/${sku._id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-orange-600 px-3.5 py-2 text-white shadow-sm hover:bg-orange-700 active:scale-[.98]"
                                        >
                                          <span className="hidden md:block">Visit</span>
                                          <Image
                                            className="h-3.5 w-3.5"
                                            src={assets.redirect_icon}
                                            alt="redirect_icon"
                                          />
                                        </Link>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="py-6 text-gray-500">No variants found for this product.</div>
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
