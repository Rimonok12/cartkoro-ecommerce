"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "@/assets/assets";
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
  const num =
    typeof n === "number" ? n : parseFloat(String(n).replace(/[^\d.]/g, "")) || 0;
  return "৳" + num.toLocaleString("en-BD");
};

const fmtDateTime = (d) =>
  new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDateOnly = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const addDays = (date, days) => {
  const base = new Date(date || Date.now());
  base.setDate(base.getDate() + (Number(days) || 0));
  return base;
};

const Chip = ({ children, tone = "orange", className = "" }) => {
  const tones = {
    orange:
      "bg-orange-50 text-orange-700 ring-0",
    green:
      "bg-green-50 text-green-700 ring-0",
    red: "bg-red-50 text-red-700 ring-0",
    gray: "bg-gray-50 text-gray-700 ring-0",
    slate:
      "bg-slate-50 text-slate-700 ring-0",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] ${
        tones[tone] || tones.orange
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
    PAID: "Paid",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    REFUNDED: "Refunded",
    RETURNED: "Returned",
    PROCESSING: "Processing",
  };
  return map[u] || s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

/** Build steps from DB history and append ETA as last */
const buildStepsFromHistory = (history = [], orderCreatedAt) => {
  const sorted = [...(history || [])]
    .filter((h) => h?.status?.status)
    .sort((a, b) => new Date(a?.at || 0) - new Date(b?.at || 0));

  const steps = sorted.map((h, idx) => ({
    key: `h-${idx}`,
    label: prettyStatus(h.status.status),
    raw: String(h.status.status || ""),
    time: h.at ? new Date(h.at) : null,
  }));

  // Add ETA as last (3 days from SHIPPED if available, else from order created)
  const shipped = sorted.find(
    (h) => String(h?.status?.status).toUpperCase() === "SHIPPED"
  );
  const etaBase = shipped?.at
    ? new Date(shipped.at)
    : orderCreatedAt
    ? new Date(orderCreatedAt)
    : null;

  if (etaBase) {
    steps.push({
      key: "eta",
      label: "Expected delivery",
      raw: "DELIVERY (ETA)",
      time: addDays(etaBase, 3),
    });
  }
  return steps;
};

/* -------- Order Item Row (with animated step progress) -------- */
const OrderItemRow = ({ item, meta, orderCreatedAt }) => {
  const name = meta?.title || item?.name || `SKU: ${item?.sku_id ?? "N/A"}`;
  const qty = item?.quantity ?? 1;
  const mrpEach = Number(item?.mrp_each) || 0;
  const spEach = Number(item?.sp_each) || 0;
  const unit = spEach || mrpEach;

  const allSteps = buildStepsFromHistory(item?.resolvedStatusHistory, orderCreatedAt);
  const etaStep = allSteps.find((s) => s.key === "eta");
  const statusSteps = allSteps.filter((s) => s.key !== "eta");
  const displaySteps = [...statusSteps, ...(etaStep ? [etaStep] : [])];

  const progressIndex = Math.max(statusSteps.length - 1, 0); // how many *real* steps reached
  const totalSteps = displaySteps.length;
  const progressPct =
    totalSteps > 1 ? (progressIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-white/80 backdrop-blur p-5 shadow-sm ring-1 ring-black/5"
    >
      {/* Item header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-16 h-16 overflow-hidden rounded-xl bg-white/80 ring-1 ring-black/5 shrink-0">
          {meta?.thumb ? (
            <Image src={meta.thumb} alt={name} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-[10px] text-gray-500">
              <span>SKU</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <div className="text-xs text-gray-600">
            Qty: <span className="font-medium">{qty}</span> • Unit:{" "}
            <span className="font-semibold">{money(unit)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-gray-500">Line total</div>
          <div className="text-sm font-semibold">{money(unit * qty)}</div>
        </div>
      </div>

      {/* Animated step progress */}
      <div className="relative mt-6">
        {/* Baseline */}
        <div className="absolute left-0 right-0 top-4 h-px bg-gradient-to-r from-gray-200/70 via-gray-200/70 to-transparent" />

        {/* Growing line */}
        <motion.div
          key={progressIndex}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute left-0 top-4 h-px bg-orange-500/80"
        />

        {/* Steps */}
        <div className="relative flex items-start justify-between">
          {displaySteps.map((s, idx) => {
            const isEta = s.key === "eta";
            const active = idx <= progressIndex;

            return (
              <div
                key={s.key}
                className="flex flex-col items-center text-center min-w-0 flex-1"
              >
                {/* Dot */}
                <motion.div
                  aria-hidden
                  animate={{
                    backgroundColor: active ? "rgb(249,115,22)" : "rgb(255,255,255)",
                    borderColor: active ? "rgb(249,115,22)" : "rgba(0,0,0,0.08)",
                    scale: active ? 1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="z-10 h-3.5 w-3.5 rounded-full border shadow-sm"
                />

                {/* Label */}
                <div className="mt-2 text-[12px] text-gray-700 truncate max-w-[8rem]">
                  {isEta ? "Expected Delivery" : s.label}
                </div>

                {/* Time */}
                {s.time && (
                  <div
                    className={`text-[11px] ${
                      isEta ? "text-orange-700 font-semibold" : "text-gray-500"
                    }`}
                  >
                    {isEta ? fmtDateOnly(s.time) : fmtDateTime(s.time)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

/* -------- Product meta helper -------- */
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
  const title = [productName, variantBits.length ? `(${variantBits.join(", ")})` : ""]
    .filter(Boolean)
    .join(" ");
  const thumb = sku?.thumbnail_img || payload?.main_sku?.thumbnail_img || "";
  return { title, thumb };
}

/* -------- Page -------- */
export default function OrderDetailsPage() {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [skuMeta, setSkuMeta] = useState({});
  const [metaLoading, setMetaLoading] = useState(false);

  const hydrateSkuMeta = async (o) => {
    if (!o) return;
    const needed = new Set();
    for (const it of o?.items || []) {
      const id = String(it?.sku_id || "");
      if (id && !skuMeta[id]) needed.add(id);
    }
    if (!needed.size) return;
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
            const parsed =
              parseProductMeta(payload, id) || { title: `SKU: ${id}`, thumb: "" };
            return [id, parsed];
          } catch {
            return [id, { title: `SKU: ${id}`, thumb: "" }];
          }
        })
      );
      setSkuMeta((prev) =>
        Object.fromEntries([...Object.entries(prev), ...entries])
      );
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!orderId) {
        setError("Missing orderId in URL");
        setOrder(undefined);
        return;
      }
      try {
        setError("");
        setOrder(null);
        const { data } = await api.get(
          `/order/getOrderDetails/${encodeURIComponent(orderId)}`,
          { withCredentials: true }
        );
        const o = data?.order || null;
        if (!ignore) {
          setOrder(o);
          if (o) hydrateSkuMeta(o);
        }
      } catch (e) {
        if (!ignore) {
          setError(
            e?.response?.data?.error || e?.message || "Failed to load order"
          );
          setOrder(undefined);
        }
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [orderId]);

  // totals
  const totals = useMemo(() => {
    if (!order) return { items: 0, subtotal: 0, delivery: 0, cashback: 0, grand: 0 };
    const items =
      order?.item_quantity_total ??
      (order?.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const subtotal =
      order?.item_subtotal ??
      (order?.items || []).reduce(
        (s, it) => s + (Number(it.sp_each) || 0) * (Number(it.quantity) || 0),
        0
      );
    const delivery =
      order?.delivery_total ??
      (order?.items || []).reduce((s, it) => s + (Number(it.delivery_amount) || 0), 0);
    const cashback =
      order?.cashback_total ??
      (order?.items || []).reduce(
        (s, it) => s + (Number(it.cashback_amount) || 0),
        0
      );
    const grand = order?.total_amount ?? subtotal + delivery - cashback;
    return { items, subtotal, delivery, cashback, grand };
  }, [order]);

  // Payment color
  const paymentIsPaid =
    (order?.payment_status || "").toUpperCase() === "PAID" ||
    (order?.lastStatus?.status || "").toUpperCase() === "DELIVERED";
  const paymentClass = paymentIsPaid ? "text-green-600" : "text-red-600";
  const paymentText = paymentIsPaid ? "PAID" : "UNPAID";

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-between px-6 md:px-12 lg:px-20 xl:px-28 py-8 min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(255,237,213,0.35),transparent_60%)]">
        <div className="space-y-6 max-w-6xl mx-auto w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Order Details</h2>
            {order && (
              <div className="text-sm text-gray-600">
                {totals.items} item{totals.items !== 1 ? "s" : ""}
              </div>
            )}
          </motion.div>

          {order === null ? (
            <Loading />
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl text-sm text-red-700 bg-red-50 shadow-sm ring-1 ring-red-100"
            >
              {error}
            </motion.div>
          ) : !order ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-600 rounded-2xl p-12 bg-white/80 backdrop-blur shadow-sm ring-1 ring-black/5"
            >
              <p className="text-lg font-semibold mb-2">Order not found</p>
              <p className="text-sm">Please check your link or go back to orders.</p>
              <Link
                href="/my-orders"
                className="inline-block mt-6 bg-orange-600 hover:bg-orange-700 active:scale-[.99] transition text-white px-5 py-2.5 rounded-lg shadow-sm"
              >
                Back to My Orders
              </Link>
            </motion.div>
          ) : (            
            <div className="space-y-6">
              {/* Continue shopping CTA */}
              <div className="flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-[.99] transition text-white px-5 py-2.5 rounded-xl shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                    <path d="M2.25 3a.75.75 0 000 1.5h1.21l2.3 10.36A2.25 2.25 0 008 17.25h9a2.25 2.25 0 002.2-1.72l1.32-5.92A.75.75 0 0019.8 8H7.31L6.83 5.79A2.25 2.25 0 004.5 4.5H2.25z" />
                  </svg>
                  Continue shopping
                </Link>
              </div>

              {/* Summary */}
              <div className="rounded-3xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-black/5 overflow-hidden p-6 relative">
                <div className="relative flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
                  <div className="flex-1 flex gap-4 min-w-0">
                    <div className="relative w-14 h-14 shrink-0 rounded-xl bg-white/80 ring-1 ring-black/5 grid place-items-center">
                      <Image className="w-9 h-9 opacity-90" src={assets.box_icon} alt="box_icon" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <div className="font-semibold text-base flex items-center gap-2">
                        <span className="truncate font-mono" title={order?._id}>
                          Order #{String(order?._id)}
                        </span>
                        <Chip tone="gray">{prettyStatus(order?.lastStatus?.status || "Created")}</Chip>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {order?.createdAt && <span>Placed: {fmtDateTime(order.createdAt)}</span>}
                        <span className="hidden sm:inline">•</span>
                        <span>Items: {totals.items}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <div className="text-xs text-gray-500">Order total</div>
                    <div className="text-xl font-bold tracking-tight">{money(totals.grand)}</div>
                  </div>
                </div>
              </div>

              {/* Address & Payment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm ring-1 ring-black/5">
                  <h3 className="font-semibold mb-3">Shipping address</h3>
                  {order?.shippingAddress ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="font-medium">{order.shippingAddress.full_name}</div>
                      {order.shippingAddress.phone && <div>{order.shippingAddress.phone}</div>}
                      {order.shippingAddress.address && <div>{order.shippingAddress.address}</div>}
                      {order.shippingAddress.landmark && <div>{order.shippingAddress.landmark}</div>}
                      {order.shippingAddress.postcode && <div>{order.shippingAddress.postcode}</div>}
                      <div className="text-gray-500 text-xs">
                        {[
                          order.shippingAddress?.upazila?.name,
                          order.shippingAddress?.district?.name,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No address on file</div>
                  )}
                </div>

                <div className="rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm ring-1 ring-black/5">
                  <h3 className="font-semibold mb-3">Payment summary</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className={`font-semibold ${paymentClass}`}>{paymentText}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items subtotal</span>
                      <span className="font-medium">{money(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span className="font-medium">{money(totals.delivery)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cashback</span>
                      <span className="font-medium">- {money(totals.cashback)}</span>
                    </div>
                    <div className="my-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">{money(totals.grand)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="rounded-3xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-black/5 overflow-hidden p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Items</h3>
                  {metaLoading && (
                    <div className="text-xs text-gray-400">Fetching product images…</div>
                  )}
                </div>
                <AnimatePresence initial={false}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(order?.items || []).map((it, i) => (
                      <OrderItemRow
                        key={`${order._id}-${i}`}
                        item={it}
                        meta={skuMeta[String(it?.sku_id)]}
                        orderCreatedAt={order?.createdAt}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
              {/* Continue shopping CTA */}
              <div className="flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-[.99] transition text-white px-5 py-2.5 rounded-xl shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                    <path d="M2.25 3a.75.75 0 000 1.5h1.21l2.3 10.36A2.25 2.25 0 008 17.25h9a2.25 2.25 0 002.2-1.72l1.32-5.92A.75.75 0 0019.8 8H7.31L6.83 5.79A2.25 2.25 0 004.5 4.5H2.25z" />
                  </svg>
                  Continue shopping
                </Link>
              </div>
            
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
