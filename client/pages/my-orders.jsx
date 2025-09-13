"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import Link from "next/link";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { essentialsOnLoad } from "@/lib/ssrHelper";

// ✅ SSR guard (pages router)
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies || {};
  if (!cookies["CK-REF-T"]) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const essentials = await essentialsOnLoad(context);
  return { props: { ...essentials.props } };
}
/* ---------------- helpers ---------------- */
const money = (n) => {
  if (n == null || n === "") return "৳0";
  const num = typeof n === "number" ? n : parseFloat(String(n).replace(/[^\d.]/g, "")) || 0;
  return "৳" + num.toLocaleString("en-BD");
};
const fmtDate = (d) =>
  new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const Chip = ({ children, tone = "gray", className = "" }) => {
  const tones = {
    gray: "bg-gray-50 text-gray-700",
    orange: "bg-orange-50 text-orange-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] ${
        tones[tone] || tones.gray
      } ${className}`}
    >
      {children}
    </span>
  );
};

const prettyStatus = (s) => {
  if (!s) return "";
  const u = String(s).trim().toUpperCase();
  const map = {
    CREATED: "Created",
    PROCESSING: "Processing",
    PAID: "Paid",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    REFUNDED: "Refunded",
    RETURNED: "Returned",
  };
  return map[u] || s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const MyOrders = () => {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [skuMeta, setSkuMeta] = useState({});
  const [metaLoading, setMetaLoading] = useState(false);

  const fetchOrders = async (signal) => {
    try {
      setError("");
      // If your axios instance expects config separately, adjust accordingly.
      const res = await api.post("/order/getUserOrders", { withCredentials: true, signal });
      const data = await res.data;
      const list = Array.isArray(data) ? data : data.orders || [];
      list.sort(
        (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
      );
      setOrders(list);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to load orders");
      setOrders([]);
    }
  };

  const hydrateSkuMeta = async (ordersList) => {
    const needed = new Set();
    for (const o of ordersList || []) {
      for (const it of o?.items || []) {
        const id = String(it?.sku_id || "");
        if (id && !skuMeta[id]) needed.add(id);
      }
    }
    if (needed.size === 0) return;

    setMetaLoading(true);
    try {
      const entries = await Promise.all(
        Array.from(needed).map(async (id) => {
          try {
            const res = await fetch(`/api/product/getProductBySkuId?skuId=${encodeURIComponent(id)}`);
            const payload = await res.json().catch(() => null);
            if (!res.ok || !payload) return [id, { title: `SKU: ${id}`, thumb: "" }];
            const productName = payload.product_name || "";
            const allSkus = [
              ...(payload.main_sku ? [payload.main_sku] : []),
              ...(Array.isArray(payload.other_skus) ? payload.other_skus : []),
            ];
            const sku =
              allSkus.find((s) => String(s?._id) === String(id)) || payload.main_sku || allSkus[0];
            const v = sku?.variant_values || {};
            const variantBits = [v.color, v.storage, v.ram].filter(Boolean);
            const title = [productName, variantBits.length ? `(${variantBits.join(", ")})` : ""]
              .filter(Boolean)
              .join(" ");
            const thumb = sku?.thumbnail_img || payload?.main_sku?.thumbnail_img || "";
            return [id, { title, thumb }];
          } catch {
            return [id, { title: `SKU: ${id}`, thumb: "" }];
          }
        })
      );
      setSkuMeta((prev) => {
        const next = { ...prev };
        for (const [id, meta] of entries) next[id] = meta;
        return next;
      });
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (orders && orders.length) hydrateSkuMeta(orders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const totalItems = useMemo(
    () => (orders || []).reduce((sum, o) => sum + (o?.items || []).length, 0),
    [orders]
  );

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-between px-4 md:px-8 lg:px-16 xl:px-20 py-8 min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(255,237,213,0.35),transparent_60%)]">
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">My Orders</h2>
            {orders && (
              <div className="text-sm text-gray-600">
                {orders.length} order{orders.length !== 1 ? "s" : ""} • {totalItems} item{totalItems !== 1 ? "s" : ""}
              </div>
            )}
          </motion.div>

          {orders === null ? (
            <Loading />
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl text-sm text-red-700 bg-red-50 shadow-sm ring-1 ring-red-100"
            >
              {error}
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-600 rounded-2xl p-10 bg-white/80 backdrop-blur shadow-sm ring-1 ring-black/5"
            >
              <p className="text-lg font-semibold mb-2">No orders yet</p>
              <p className="text-sm">When you place an order it will appear here.</p>
              <Link
                href="/"
                className="inline-block mt-6 bg-orange-600 hover:bg-orange-700 active:scale-[.99] transition text-white px-5 py-2.5 rounded-lg shadow-sm"
              >
                Continue shopping
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {orders.map((order, index) => {
                  const id = order?._id || order?.id || `ORD-${index + 1}`;
                  const created = order?.createdAt ? new Date(order.createdAt) : null;
                  const total = order?.total_amount ?? 0;
                  const items = order?.items || [];
                  const lastStatus = prettyStatus(order?.lastStatus?.status || order?.payment_status || "Created");
                  const paid = String(order?.payment_status || "").toUpperCase() === "PAID";

                  return (
                    <motion.div
                      key={id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      className="rounded-3xl shadow-sm bg-white/90 backdrop-blur p-5 ring-1 ring-black/5"
                    >
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/order-details?orderId=${encodeURIComponent(id)}`}
                              className="font-semibold text-base text-orange-700 hover:text-orange-800 underline underline-offset-4"
                            >
                              Order ID: <span className="font-mono">{String(id)}</span>
                            </Link>
                            <Chip tone="gray">{lastStatus}</Chip>
                            {/* <Chip tone={paid ? "green" : "red"}>{paid ? "Paid" : "Unpaid"}</Chip> */}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            {created && <span>Placed: {fmtDate(created)}</span>}
                            <span className="hidden sm:inline">•</span>
                            <span>Items: {items.length}</span>
                          </div>
                        </div>
                        <div className="flex items-end gap-4 md:gap-6">
                          <div className="text-right">
                            <div className="text-[12px] text-gray-500">Order total</div>
                            <div className="text-lg font-bold tracking-tight">{money(total)}</div>
                          </div>
                          <Link
                            href={`/order-details?orderId=${encodeURIComponent(id)}`}
                            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-[.99] transition text-white px-4 py-2 rounded-xl shadow-sm whitespace-nowrap"
                            aria-label={`View full details for order ${String(id)}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                              <path d="M2.25 12c0 .414.336.75.75.75h15.69l-3.22 3.22a.75.75 0 101.06 1.06l4.5-4.5a.75.75 0 000-1.06l-4.5-4.5a.75.75 0 10-1.06 1.06l3.22 3.22H3a.75.75 0 00-.75.75z" />
                            </svg>
                            Full details
                          </Link>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                      {/* All items with thumbnail • name • price × qty */}
                      <ul className="flex flex-col gap-2">
                        {items.map((it, idx) => {
                          const meta = skuMeta[String(it?.sku_id)] || {};
                          const name = meta.title || `SKU ${it?.sku_id ?? "—"}`;
                          const price = Number(it?.sp_each) || Number(it?.mrp_each) || 0;
                          return (
                            <li
                              key={idx}
                              className="flex items-center justify-between rounded-xl ring-1 ring-black/5 p-2.5 bg-white/70 hover:bg-white transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-black/5 shrink-0">
                                  {meta.thumb ? (
                                    <Image src={meta.thumb} alt={name} fill sizes="44px" className="object-cover" />
                                  ) : (
                                    <div className="h-full w-full grid place-items-center text-[10px] text-gray-400">IMG</div>
                                  )}
                                </div>
                                <span className="truncate pr-2 text-sm" title={name}>{name}</span>
                              </div>
                              <span className="text-sm text-gray-700 whitespace-nowrap">{money(price)} × {it?.quantity ?? 1}</span>
                            </li>
                          );
                        })}
                      </ul>

                      {metaLoading && (
                        <div className="mt-2 text-xs text-gray-400">Fetching product names & images…</div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyOrders;
