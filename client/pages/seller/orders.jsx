"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import { requireB2B } from "@/lib/ssrHelper";
import api from "@/lib/axios";
import Navbar from "@/components/seller/Navbar";
import Sidebar from "@/components/seller/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "@/assets/assets";

export async function getServerSideProps(context) {
  return requireB2B(context);
}

/* ---------------- helpers ---------------- */
const bd = (n) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

const card = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 26 },
  },
};

const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");

const VariantChips = ({ variantValues }) => {
  if (!variantValues || typeof variantValues !== "object") return null;
  const entries = Object.entries(variantValues).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== ""
  );
  if (!entries.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {entries.map(([k, v]) => (
        <span
          key={`${k}:${v}`}
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-gray-50 text-gray-700"
          title={`${k}: ${v}`}
        >
          <span className="font-medium mr-1">{k}:</span>
          {String(v)}
        </span>
      ))}
    </div>
  );
};

/** Timeline shows each status (with its own time).
 * We also render the parent order's created time above the list.
 */
const StatusTimeline = ({ orderCreatedAt, history }) => {
  const list = Array.isArray(history)
    ? history.slice().sort((a, b) => {
        const ta = new Date(a?.at || 0).getTime();
        const tb = new Date(b?.at || 0).getTime();
        return ta - tb; // oldest -> newest
      })
    : [];

  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">
        <span className="text-gray-500">Order placed: </span>
        <span className="font-medium">{formatDateTime(orderCreatedAt)}</span>
      </div>

      {list.length === 0 ? (
        <div className="text-xs text-gray-500">No status history.</div>
      ) : (
        <ol className="relative border-l border-gray-200 ml-3 pl-4 space-y-2">
          {list.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[9px] top-1.5 h-2 w-2 rounded-full bg-amber-400" />
              <div className="text-xs">
                <div className="font-medium text-gray-900">
                  {h?.status?.status || "Status"}
                </div>

                {/* Each status own timestamp */}
                <div className="text-gray-500 mt-0.5">
                  {formatDateTime(h?.at)}
                </div>
                {h?.note && (
                  <div className="text-[11px] text-gray-500 mt-0.5 italic">
                    {h.note}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default function ItemsSold() {
  const { currency } = useAppContext();
  const [items, setItems] = useState(null); // null => loading
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await api.get("/order/getSellerOrderItems", {
          withCredentials: true,
          params: { limit: 50, skip: 0 },
        });
        const list = res.data?.items || [];
        // Sort by ORDER created time (newest first).
        list.sort((a, b) => {
          const ta = new Date(
            a?.lastOrderCreatedAt ?? a?.lastItemCreatedAt ?? 0
          ).getTime();
          const tb = new Date(
            b?.lastOrderCreatedAt ?? b?.lastItemCreatedAt ?? 0
          ).getTime();
          if (tb !== ta) return tb - ta; // newest order first
          return (b?.totalSold || 0) - (a?.totalSold || 0); // tie-break by units
        });
        setItems(list);
      } catch (e) {
        setError(
          e?.response?.data?.message || e?.message || "Failed to load items"
        );
        setItems([]); // stop spinner
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const totalUnits = (items || []).reduce(
      (s, it) => s + (it.totalSold || 0),
      0
    );
    const totalRevenue = (items || []).reduce(
      (s, it) => s + (it.totalRevenue || 0),
      0
    );
    return { totalUnits, totalRevenue };
  }, [items]);

  return (
    <>
      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          <div className="w-full md:p-10 p-4">
            <div className="relative">
              {/* dynamic dark gradient background */}
              <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_10%_-20%,rgba(255,115,0,0.07),transparent),radial-gradient(900px_500px_at_90%_120%,rgba(17,24,39,0.25),transparent)]"
              />

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-7"
              >
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
                  Items Sold
                </h2>
                <div className="mt-2 h-1.5 w-36 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 shadow-[0_0_18px_rgba(234,88,12,.45)]" />

                {Array.isArray(items) && (
                  <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      {items.length} Product{items.length !== 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span>
                      Units:{" "}
                      <span className="font-medium">
                        {bd(totals.totalUnits)}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      Revenue:{" "}
                      <span className="font-semibold text-gray-900">
                        {currency}
                        {bd(totals.totalRevenue)}
                      </span>
                    </span>
                  </div>
                )}
              </motion.div>

              {/* ==== main content states ==== */}
              {error ? (
                <div className="p-4 border rounded-xl text-sm text-red-600 bg-red-50">
                  {error}
                </div>
              ) : items === null ? (
                <Loading />
              ) : items.length === 0 ? (
                <div className="p-10 text-center border rounded-2xl bg-white/80">
                  No sales yet.
                </div>
              ) : (
                <div className="max-w-6xl space-y-6">
                  <AnimatePresence initial={false}>
                    {items.map((it, idx) => {
                      const img = it.thumbnailImg || assets.box_icon;
                      const variant = it.variantValues
                        ? Object.values(it.variantValues)
                            .filter(Boolean)
                            .join(", ")
                        : "";
                      const title = [it.productName, variant && `(${variant})`]
                        .filter(Boolean)
                        .join(" ");
                      // Order time to show + sort by
                      const orderCreated =
                        it.lastOrderCreatedAt ?? it.lastItemCreatedAt;
                      const brandName = it?.brand?.name || "";
                      const sellerMRP = it?.sellerPrice?.seller_mrp;
                      const sellerSP = it?.sellerPrice?.seller_sp;

                      return (
                        <motion.div
                          key={it.skuId || idx}
                          variants={card}
                          initial="hidden"
                          animate="show"
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-2xl p-[1.25px] bg-gradient-to-br shadow-xl ring-1 ring-black/10"
                        >
                          <div className="rounded-2xl bg-white/92 backdrop-blur">
                            {/* shimmer line */}
                            <div className="h-1 rounded-t-2xl bg-gradient-to-r from-transparent via-orange-300/70 to-transparent" />
                            <div className="p-5">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Left: Product / Brand / Variants */}
                                <div className="md:col-span-5 flex gap-4 min-w-0">
                                  <div className="relative shrink-0">
                                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden w-16 h-16 grid place-items-center">
                                      <Image
                                        src={img}
                                        alt="product"
                                        width={64}
                                        height={64}
                                        className="object-cover w-16 h-16"
                                      />
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <p
                                      className="font-medium text-gray-900 leading-snug line-clamp-2"
                                      title={title}
                                    >
                                      {title || `SKU ${it.skuId}`}
                                    </p>
                                    {brandName && (
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        Brand:{" "}
                                        <span className="font-medium text-gray-900">
                                          {brandName}
                                        </span>
                                      </p>
                                    )}
                                    <VariantChips
                                      variantValues={it.variantValues}
                                    />
                                  </div>
                                </div>

                                {/* Middle: Units / Revenue + Seller prices */}
                                <div className="md:col-span-3">
                                  <div className="text-gray-700 text-sm">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-gray-500">
                                        Units
                                      </span>
                                      <span className="font-semibold text-gray-900">
                                        {bd(it.totalSold)}
                                      </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-1">
                                      <span className="text-gray-500">
                                        Revenue
                                      </span>
                                      <span className="font-semibold text-gray-900 whitespace-nowrap">
                                        {currency}
                                        {bd(it.totalRevenue)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-2">
                                      {typeof sellerSP === "number" && (
                                        <div>
                                          Seller SP:{" "}
                                          <span className="font-medium text-gray-900">
                                            {currency}
                                            {bd(sellerSP)}
                                          </span>
                                        </div>
                                      )}
                                      {typeof sellerMRP === "number" && (
                                        <div className="text-[11px]">
                                          Seller MRP:{" "}
                                          <span className="font-medium">
                                            {currency}
                                            {bd(sellerMRP)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Order time + Status timeline */}
                                <div className="md:col-span-4">
                                  <div className="text-xs font-semibold text-gray-500 mb-1">
                                    Order Status history
                                  </div>
                                  <StatusTimeline
                                    orderCreatedAt={orderCreated}
                                    history={it.resolvedStatusHistory}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
