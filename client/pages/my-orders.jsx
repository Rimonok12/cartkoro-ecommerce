"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import { assets } from "@/assets/assets";
import Link from "next/link";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- helpers ---------------- */
const money = (n) => {
  if (n == null || n === "") return "৳0";
  const num =
    typeof n === "number"
      ? n
      : parseFloat(String(n).replace(/[^\d.]/g, "")) || 0;
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
const addDays = (date, days, hour = 10, minute = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const Chip = ({ children, tone = "orange", className = "" }) => {
  const tones = {
    orange:
      "bg-gradient-to-br from-orange-100 to-orange-50 text-orange-700 ring-1 ring-orange-200",
    green:
      "bg-gradient-to-br from-green-100 to-green-50 text-green-700 ring-1 ring-green-200",
    red: "bg-gradient-to-br from-red-100 to-red-50 text-red-700 ring-1 ring-red-200",
    gray: "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700 ring-1 ring-gray-200",
    slate:
      "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-700 ring-1 ring-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        tones[tone] || tones.orange
      } ${className}`}
    >
      {children}
    </span>
  );
};

/** Build a nice display title and thumbnail from the product API payload */
function parseProductMeta(payload, skuId) {
  if (!payload) return null;
  const productName = payload.product_name || "";
  const allSkus = [
    ...(payload.main_sku ? [payload.main_sku] : []),
    ...(Array.isArray(payload.other_skus) ? payload.other_skus : []),
  ];
  const sku =
    allSkus.find((s) => String(s?._id) === String(skuId)) ||
    payload.main_sku ||
    allSkus[0];
  const v = sku?.variant_values || {};
  const variantBits = [v.color, v.storage, v.ram].filter(Boolean);
  const title = [
    productName,
    variantBits.length ? `(${variantBits.join(", ")})` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const thumb = sku?.thumbnail_img || payload?.main_sku?.thumbnail_img || "";
  return { title, thumb };
}

/* ---------- synthetic per-item tracking ---------- */
const buildItemTracking = (createdAt) => {
  const t0 = new Date(createdAt || Date.now());
  return [
    { key: "placed", label: "Order placed", time: t0 },
    {
      key: "packed",
      label: "Packed at warehouse",
      time: addDays(t0, 1, 11, 15),
    },
    { key: "shipped", label: "Shipped", time: addDays(t0, 2, 9, 30) },
    { key: "out", label: "Out for delivery", time: addDays(t0, 3, 9, 0) },
    {
      key: "delivered",
      label: "Delivered (ETA)",
      time: addDays(t0, 3, 18, 30),
      eta: true,
    },
  ];
};
const ProgressDot = ({ active }) => (
  <div
    className={`h-2.5 w-2.5 rounded-full border-2 ${
      active ? "bg-orange-500 border-orange-500" : "bg-white border-gray-300"
    } shadow-sm`}
  />
);

/* ---------------- item row ---------------- */
const OrderItemRow = ({ item, meta, createdAt }) => {
  const name = meta?.title || item?.name || `SKU: ${item?.sku_id ?? "N/A"}`;
  const qty = item?.quantity ?? 1;
  const mrpEach = Number(item?.mrp_each) || 0;
  const spEach = Number(item?.sp_each) || 0;
  const unit = spEach || mrpEach;
  const lineTotal = unit * qty;

  const steps = buildItemTracking(createdAt);
  const now = Date.now();
  const currentIdx = steps.findIndex((s) => s.time.getTime() > now);
  const progressIndex =
    currentIdx === -1 ? steps.length - 1 : Math.max(0, currentIdx - 1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-2xl border bg-white/80 backdrop-blur p-4 hover:shadow-[0_12px_32px_-12px_rgba(16,24,40,0.15)] transition-shadow"
    >
      {/* Top row */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 overflow-hidden rounded-xl border bg-white shrink-0">
          {meta?.thumb ? (
            <Image
              src={meta.thumb}
              alt={name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-[10px] text-gray-500">
              <span>SKU</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" title={name}>
            {name}
          </p>
          <div className="mt-1 text-xs text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Qty: <span className="font-medium text-gray-800">{qty}</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              Unit:&nbsp;
              {spEach ? (
                <>
                  <span className="font-semibold text-gray-900">
                    {money(spEach)}
                  </span>
                  {mrpEach > spEach && (
                    <span className="line-through ml-1">{money(mrpEach)}</span>
                  )}
                </>
              ) : (
                <span className="font-semibold text-gray-900">
                  {money(mrpEach)}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[12px] text-gray-500">Line total</div>
          <div className="text-sm font-semibold">{money(lineTotal)}</div>
        </div>
      </div>

      {/* Tracking timeline */}
      <div className="mt-4">
        <div className="flex items-center gap-2">
          {steps.map((_, idx) => (
            <React.Fragment key={idx}>
              <ProgressDot active={idx <= progressIndex} />
              {idx < steps.length - 1 && (
                <div
                  className={`h-[2px] flex-1 rounded-full ${
                    idx < progressIndex ? "bg-orange-500" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {steps.map((s, idx) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg border px-3 py-2 ${
                idx === progressIndex
                  ? "bg-orange-50/70 border-orange-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                {s.label}
              </div>
              <div
                className={`text-[12px] ${
                  s.eta ? "text-orange-700 font-semibold" : "text-gray-700"
                }`}
              >
                {fmtDate(s.time)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ---- build a short, non-overflowing summary for long product names ---- */
const itemsPreview = (items, skuMeta) => {
  if (!Array.isArray(items) || items.length === 0) return "—";
  const first = items[0];
  const firstTitle =
    skuMeta[first?.sku_id]?.title || `SKU ${first?.sku_id ?? "—"}`;
  const firstQty = first?.quantity ?? 1;
  if (items.length === 1) return `${firstTitle} × ${firstQty}`;

  const second = items[1];
  const secondTitle =
    skuMeta[second?.sku_id]?.title || `SKU ${second?.sku_id ?? "—"}`;
  const secondQty = second?.quantity ?? 1;

  if (items.length === 2)
    return `${firstTitle} × ${firstQty}, ${secondTitle} × ${secondQty}`;

  const more = items.length - 2;
  return `${firstTitle} × ${firstQty}, ${secondTitle} × ${secondQty}`;
  // We will show "+N more" as a chip next to this text
};

const MyOrders = () => {
  const [orders, setOrders] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [skuMeta, setSkuMeta] = useState({}); // { [skuId]: { title, thumb } }
  const [metaLoading, setMetaLoading] = useState(false);

  /** Load orders (kept your axios call/logic) */
  const fetchOrders = async (signal) => {
    try {
      setError("");
      const res = await api.post("/order/getUserOrders", {
        withCredentials: true,
      });
      const data = await res.data;
      const list = Array.isArray(data) ? data : data.orders || [];
      list.sort(
        (a, b) =>
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime()
      );
      setOrders(list);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to load orders");
      setOrders([]);
    }
  };

  /** Enrich unique SKUs (title/image) */
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
            const res = await fetch(
              `/api/product/getProductBySkuId?skuId=${encodeURIComponent(id)}`
            );
            const payload = await res.json().catch(() => null);
            if (!res.ok || !payload)
              return [id, { title: `SKU: ${id}`, thumb: "" }];
            const parsed = parseProductMeta(payload, id) || {
              title: `SKU: ${id}`,
              thumb: "",
            };
            return [id, parsed];
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
    const iv = setInterval(() => fetchOrders(controller.signal), 30000);
    return () => {
      controller.abort();
      clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex flex-col justify-between px-6 md:px-12 lg:px-20 xl:px-28 py-8 min-h-screen bg-gradient-to-b from-white via-orange-50/25 to-white">
        <div className="space-y-6 max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              My Orders
            </h2>
            {orders && (
              <div className="text-sm text-gray-600">
                {orders.length} order{orders.length !== 1 ? "s" : ""} •{" "}
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </div>
            )}
          </motion.div>

          {orders === null ? (
            <Loading />
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded-xl text-sm text-red-700 bg-red-50 ring-1 ring-red-200"
            >
              {error}
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-600 border rounded-2xl p-12 bg-white/80 backdrop-blur ring-1 ring-gray-100"
            >
              <p className="text-lg font-semibold mb-2">No orders yet</p>
              <p className="text-sm">
                When you place an order it will appear here.
              </p>
              <Link
                href="/"
                className="inline-block mt-6 bg-orange-600 hover:bg-orange-700 active:scale-[.99] transition text-white px-5 py-2.5 rounded-lg shadow-sm"
              >
                Continue shopping
              </Link>
            </motion.div>
          ) : (
            <div className="rounded-3xl border bg-white/80 backdrop-blur ring-1 ring-gray-100 overflow-hidden">
              <AnimatePresence initial={false}>
                {orders.map((order, index) => {
                  const id = order?._id || order?.id || `ORD-${index + 1}`;
                  const created = order?.createdAt
                    ? new Date(order.createdAt)
                    : null;
                  const total = order?.total_amount ?? 0;
                  const eta = created ? addDays(created, 3, 18, 30) : null;

                  const items = order?.items || [];
                  const previewText = itemsPreview(items, skuMeta);
                  const moreCount = Math.max(0, items.length - 2);

                  return (
                    <motion.div
                      key={id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 22,
                      }}
                      className="relative p-6 border-b last:border-b-0"
                    >
                      {/* soft background accent */}
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_200px_at_30%_-10%,rgba(251,146,60,0.08),transparent)]" />

                      {/* Order summary */}
                      <div className="relative flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
                        <div className="flex-1 flex gap-4 min-w-0">
                          <div className="relative w-14 h-14 shrink-0 rounded-xl border bg-white grid place-items-center">
                            <Image
                              className="w-9 h-9 opacity-90"
                              src={assets.box_icon}
                              alt="box_icon"
                            />
                          </div>

                          {/* Ensure text never spills */}
                          <div className="min-w-0 overflow-hidden">
                            <div className="font-semibold text-base flex items-center gap-2">
                              <span className="truncate" title={previewText}>
                                {previewText}
                              </span>
                              {moreCount > 0 && (
                                <Chip tone="slate" className="shrink-0">
                                  +{moreCount} more
                                </Chip>
                              )}
                            </div>

                            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                              <span>
                                Order ID:{" "}
                                <span className="font-mono">
                                  {String(id).slice(-10)}
                                </span>
                              </span>
                              {created && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span>Placed: {fmtDate(created)}</span>
                                </>
                              )}
                              {eta && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span>ETA: {fmtDate(eta)}</span>
                                </>
                              )}
                              <span className="hidden sm:inline">•</span>
                              <span>Items: {items.length}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>
                                Ship Addr ID:{" "}
                                {order?.shipping_address_id ?? "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs text-gray-500">
                            Order total
                          </div>
                          <div className="text-xl font-bold tracking-tight">
                            {money(total)}
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Chip tone="gray">Created</Chip>
                          </div>
                        </div>
                      </div>

                      {/* Items grid with per-item tracking */}
                      <motion.div
                        layout
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5"
                      >
                        {items.map((it, i) => (
                          <OrderItemRow
                            key={`${id}-${i}`}
                            item={it}
                            meta={skuMeta[String(it?.sku_id)]}
                            createdAt={created}
                          />
                        ))}
                      </motion.div>

                      {metaLoading && (
                        <div className="mt-3 text-xs text-gray-400">
                          Fetching product images…
                        </div>
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
