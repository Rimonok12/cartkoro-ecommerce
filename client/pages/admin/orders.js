"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/admin/Navbar";
import Sidebar from "@/components/admin/Sidebar";
import Loading from "@/components/Loading";
import api from "@/lib/axios";
import { assets } from "@/assets/assets";
import { essentialsOnLoad, requireB2BAdmin } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  return requireB2BAdmin(context);
}

/* ============================ helpers ============================ */
const bd = (n) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );
const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");

const card = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 26 },
  },
};

const StatusDot = ({ label, className }) => (
  <span
    title={label}
    className={
      "inline-block h-2 w-2 rounded-full mr-2 " + (className || "bg-gray-300")
    }
  />
);

const statusColor = (s = "") => {
  switch (s.toUpperCase()) {
    case "CREATED":
      return "bg-gray-400 text-gray-800 ring-gray-300";
    case "PAID":
      return "bg-blue-100 text-blue-700 ring-blue-200";
    case "SHIPPED":
      return "bg-amber-100 text-amber-700 ring-amber-200";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
    case "CANCELED":
    case "CANCELLED":
      return "bg-rose-100 text-rose-700 ring-rose-200";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-200";
  }
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${statusColor(
      status
    )}`}
  >
    <StatusDot />
    {status || "UNKNOWN"}
  </span>
);

const VariantChips = ({ variantValues }) => {
  if (!variantValues || typeof variantValues !== "object") return null;
  const entries = Object.entries(variantValues).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== ""
  );
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([k, v]) => (
        <span
          key={`${k}:${v}`}
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] bg-gray-50 text-gray-700"
          title={`${k}: ${v}`}
        >
          <span className="font-medium mr-1">{k}:</span>
          {String(v)}
        </span>
      ))}
    </div>
  );
};

const ItemTimeline = ({ history }) => {
  const list = Array.isArray(history)
    ? history
        .slice()
        .sort(
          (a, b) =>
            new Date(a?.at || 0).getTime() - new Date(b?.at || 0).getTime()
        )
    : [];
  return (
    <ol className="relative border-l border-gray-200 ml-3 pl-4 space-y-2">
      {list.map((h, idx) => (
        <li key={idx} className="relative">
          <span className="absolute -left-[9px] top-1.5 h-2 w-2 rounded-full bg-amber-400" />
          <div className="text-xs">
            <div className="font-medium text-gray-900">
              {h?.status?.status || "Status"}
            </div>
            <div className="text-gray-500 mt-0.5">{fmt(h?.at)}</div>
            {h?.note && (
              <div className="text-[11px] text-gray-500 mt-0.5 italic">
                {h.note}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

/* ============================ Filters ============================ */
const Filters = ({ loading, onApply, initial }) => {
  const [q, setQ] = useState(initial?.q || "");
  const [status, setStatus] = useState(initial?.status || "");
  const [sellerId, setSellerId] = useState(initial?.sellerId || "");
  const [from, setFrom] = useState(initial?.from || "");
  const [to, setTo] = useState(initial?.to || "");
  const [limit, setLimit] = useState(initial?.limit || 20);

  return (
    <div className="rounded-2xl p-4 bg-white/90 backdrop-blur ring-1 ring-black/5">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-3">
          <label className="text-xs text-gray-600">
            Search (name/phone/email/order id)
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="e.g. 017... or DEL-..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white"
          >
            <option value="">All</option>
            <option>CREATED</option>
            <option>PAID</option>
            <option>SHIPPED</option>
            <option>DELIVERED</option>
            <option>CANCELED</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">Seller (optional)</label>
          <input
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="seller _id"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-xs text-gray-600">Page size</label>
          <select
            value={String(limit)}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white"
          >
            {[20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-12 flex gap-2 justify-end pt-2">
          <button
            onClick={() => onApply({ q, status, sellerId, from, to, limit })}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================ Main Page ============================ */
const AdminOrdersPage = () => {
  const { currency } = useAppContext();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState({ skip: 0, limit: 20 });
  const [filters, setFilters] = useState({});

  const fetchOrders = useCallback(
    async (p = page, f = filters) => {
      setLoading(true);
      try {
        setError("");
        const params = { skip: p.skip, limit: p.limit };
        if (f.q) params.q = f.q;
        if (f.status) params.status = f.status;
        if (f.sellerId) params.sellerId = f.sellerId;
        if (f.from) params.from = f.from;
        if (f.to) params.to = f.to;

        const res = await api.get("/order/getAdminOrders", {
          withCredentials: true,
          params,
        });
        const list = res.data?.orders || res.data?.items || [];

        console.log("list:::", list)
        setOrders(list);
        setPage({ skip: p.skip, limit: p.limit });
      } catch (e) {
        setError(
          e?.response?.data?.message || e?.message || "Failed to load orders"
        );
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [page, filters]
  );

  useEffect(() => {
    fetchOrders(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  // const totals = useMemo(() => {
  //   const list = orders || [];
  //   const revenue = list.reduce(
  //     (s, o) =>
  //       s +
  //       (o?.item_subtotal || 0) +
  //       (o?.delivery_total || 0) -
  //       (o?.cashback_total || 0),
  //     0
  //   );
  //   const items = list.reduce((s, o) => s + (o?.item_quantity_total || 0), 0);
  //   const deliveries = list.reduce((s, o) => s + (o?.delivery_total || 0), 0);
  //   const cashback = list.reduce((s, o) => s + (o?.cashback_total || 0), 0);
  //   return { revenue, items, deliveries, cashback };
  // }, [orders]);
  const totals = useMemo(() => {
    const list = orders || [];

    // Prefer order-level if present, else legacy computed totals coming from API
    const deliveries = list.reduce(
      (s, o) => s + (Number(o?.delivery_fee ?? o?.delivery_total ?? 0) || 0),
      0
    );
    const cashback = list.reduce(
      (s, o) => s + (Number(o?.order_cashback ?? o?.cashback_total ?? 0) || 0),
      0
    );
    const items = list.reduce(
      (s, o) => s + (Number(o?.item_quantity_total ?? 0) || 0),
      0
    );

    // Net revenue per order = total_amount when present; else fallback
    const revenue = list.reduce((s, o) => {
      const grand = Number(
        o?.total_amount ??
        (o?.item_subtotal ?? 0) +
        (o?.delivery_fee ?? o?.delivery_total ?? 0) -
        (o?.order_cashback ?? o?.cashback_total ?? 0)
      ) || 0;
      return s + grand;
    }, 0);

    return { revenue, items, deliveries, cashback };
  }, [orders]);

  const applyFilters = (f) => {
    const next = { ...f };
    setFilters(next);
    const newPage = { skip: 0, limit: Number(f.limit || page.limit) };
    setPage(newPage);
    fetchOrders(newPage, next);
  };

  const nextPage = () => {
    const newPage = { skip: page.skip + page.limit, limit: page.limit };
    setPage(newPage);
    fetchOrders(newPage);
  };

  const prevPage = () => {
    const newSkip = Math.max(0, page.skip - page.limit);
    const newPage = { skip: newSkip, limit: page.limit };
    setPage(newPage);
    fetchOrders(newPage);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          <div className="w-full md:p-10 p-4">
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_10%_-20%,rgba(255,115,0,0.07),transparent),radial-gradient(900px_500px_at_90%_120%,rgba(17,24,39,0.25),transparent)]"
              />

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-7"
              >
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
                  Admin Orders
                </h2>
                <div className="mt-2 h-1.5 w-44 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 shadow-[0_0_18px_rgba(234,88,12,.45)]" />
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="rounded-2xl p-4 bg-white/90 backdrop-blur ring-1 ring-black/5">
                  <div className="text-xs text-gray-500">Orders (page)</div>
                  <div className="text-2xl font-semibold">
                    {orders?.length ?? "—"}
                  </div>
                </div>
                <div className="rounded-2xl p-4 bg-white/90 backdrop-blur ring-1 ring-black/5">
                  <div className="text-xs text-gray-500">Items (page)</div>
                  <div className="text-2xl font-semibold">
                    {bd(totals.items)}
                  </div>
                </div>
                <div className="rounded-2xl p-4 bg-white/90 backdrop-blur ring-1 ring-black/5">
                  <div className="text-xs text-gray-500">Delivery (page)</div>
                  <div className="text-2xl font-semibold">
                    {currency}
                    {bd(totals.deliveries)}
                  </div>
                </div>
                <div className="rounded-2xl p-4 bg-white/90 backdrop-blur ring-1 ring-black/5">
                  <div className="text-xs text-gray-500">
                    Net Revenue (page)
                  </div>
                  <div className="text-2xl font-semibold">
                    {currency}
                    {bd(totals.revenue)}
                  </div>
                </div>
              </div>

              <Filters
                loading={loading}
                onApply={applyFilters}
                initial={{ ...filters, limit: page.limit }}
              />

              {error ? (
                <div className="p-4 mt-4 border rounded-xl text-sm text-rose-600 bg-rose-50">
                  {error}
                </div>
              ) : orders === null ? (
                <div className="mt-6">
                  <Loading />
                </div>
              ) : orders.length === 0 ? (
                <div className="p-10 mt-6 text-center border rounded-2xl bg-white/80">
                  No orders.
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  <AnimatePresence initial={false}>
                    {orders.map((o, idx) => {
                      const status = o?.lastStatus?.status;
                      const fullAddress = [
                        o?.shippingAddress?.address,
                        o?.shippingAddress?.upazila?.name,
                        o?.shippingAddress?.district?.name,
                        o?.shippingAddress?.postcode,
                      ]
                        .filter(Boolean)
                        .join(", ");

                      return (
                        <motion.div
                          key={o._id || idx}
                          variants={card}
                          initial="hidden"
                          animate="show"
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-2xl p-[1.25px] bg-gradient-to-br ring-1 ring-black/10"
                        >
                          <div className="rounded-2xl bg-white/92 backdrop-blur">
                            <div className="h-1 rounded-t-2xl bg-gradient-to-r from-transparent via-orange-300/70 to-transparent" />
                            <div className="p-5">
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                  <div className="text-xs text-gray-500">
                                    Order ID
                                  </div>
                                  <div className="font-semibold text-gray-900">
                                    {o._id}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-600">
                                    Placed:{" "}
                                    <span className="font-medium text-gray-900">
                                      {fmt(o.createdAt)}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-xs text-gray-600">
                                    User:{" "}
                                    <span className="font-medium text-gray-900">
                                      {o?.user?.full_name || "—"}
                                    </span>{" "}
                                    · {o?.user?.phone_number} ·{" "}
                                    {o?.user?.email || ""}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-600">
                                    Ship to:{" "}
                                    <span className="font-medium text-gray-900">
                                      {fullAddress || "—"}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:text-right">
                                  <div>
                                    <div className="text-[11px] text-gray-500">Total Items</div>
                                    <div className="font-semibold">{bd(o.item_quantity_total)}</div>
                                  </div>
                                  <div>
                                    <div className="text-[11px] text-gray-500">Total Payable</div>
                                    <div className="font-semibold">
                                      {currency}{bd(o.total_amount)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[11px] text-gray-500">Delivery</div>
                                    <div className="font-semibold">
                                      {currency}{bd(o.delivery_fee ?? o.delivery_total ?? 0)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[11px] text-gray-500">Cashback</div>
                                    <div className="font-semibold">
                                      {currency}{bd(o.order_cashback ?? o.cashback_total ?? 0)}
                                    </div>
                                  </div>

                                  <div className="md:col-span-4 flex items-center md:justify-end gap-2">
                                    <StatusBadge status={status} />
                                    <span className="text-xs text-gray-500">
                                      Updated: {fmt(o?.lastStatus?.at)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Items table */}
                              <div className="mt-5">
                                <div className="text-xs font-semibold text-gray-600 mb-2">Items</div>
                                <div className="overflow-x-auto -mx-1">
                                  <table className="min-w-full text-sm">
                                    <thead>
  <tr className="text-left text-gray-500">
    <th className="px-1 py-2">Product</th>
    <th className="px-1 py-2">Brand</th>
    <th className="px-1 py-2">Variants</th>
    <th className="px-1 py-2">Qty</th>
    <th className="px-1 py-2">Seller MRP</th>
    <th className="px-1 py-2">Seller SP</th>
    <th className="px-1 py-2">MRP</th>
    <th className="px-1 py-2">SP</th>
    <th className="px-1 py-2">Line Total</th>
    <th className="px-1 py-2">Last Status</th>
  </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                      {o.items?.map((it, i) => {
                                        const img = it?.sku?.thumbnail_img || assets.box_icon;
                                        const qty = Number(it?.quantity) || 0;
                                        const lineTotal = (Number(it?.sp_each) || 0) * qty;

                                        const variants = it?.variantValues
                                          ? Object.entries(it.variantValues)
                                              .filter(([, v]) => v != null && String(v).trim() !== "")
                                              .map(([k, v]) => `${k}: ${v}`)
                                              .join(", ")
                                          : "";

                                        return (
                                          <tr key={it._id || i} className="align-top">
                                            <td className="px-1 py-2 min-w-[220px]">
                                              <div className="flex gap-3">
                                                <div className="rounded-xl border bg-white shadow-sm overflow-hidden w-12 h-12 grid place-items-center shrink-0">
                                                  <Image
                                                    src={img}
                                                    alt="product"
                                                    width={48}
                                                    height={48}
                                                    className="object-cover w-12 h-12"
                                                  />
                                                </div>
                                                <div className="min-w-0">
                                                  <div
                                                    className="font-medium text-gray-900 leading-snug line-clamp-2"
                                                    title={it?.product?.name}
                                                  >
                                                    {it?.product?.name || `SKU ${it?.sku?._id}`}
                                                  </div>
                                                  <div className="text-[11px] text-gray-500">
                                                    SKU: {it?.sku?._id}
                                                  </div>
                                                </div>
                                              </div>
                                            </td>

                                            <td className="px-1 py-2">{it?.product?.brand?.name || "—"}</td>
                                            <td className="px-1 py-2">{variants || "—"}</td>
                                            <td className="px-1 py-2">{bd(qty)}</td>

                                            {/* Seller MRP & SP */}
                                            <td className="px-1 py-2 whitespace-nowrap">
                                              {currency}{bd(it?.sku?.seller_mrp)}
                                            </td>
                                            <td className="px-1 py-2 whitespace-nowrap">
                                              {currency}{bd(it?.sku?.seller_sp)}
                                            </td>

                                            {/* Ordered MRP & SP */}
                                            <td className="px-1 py-2 whitespace-nowrap">
                                              {currency}{bd(it?.mrp_each)}
                                            </td>
                                            <td className="px-1 py-2 whitespace-nowrap">
                                              {currency}{bd(it?.sp_each)}
                                            </td>

                                            {/* Line total */}
                                            <td className="px-1 py-2 whitespace-nowrap font-semibold">
                                              {currency}{bd(lineTotal)}
                                            </td>

                                            {/* Last Status stacked vertically */}
                                            <td className="px-1 py-2">
                                              <div className="flex flex-col items-start gap-1">
                                                <StatusBadge status={it?.lastStatus?.status} />
                                                <span className="text-[11px] text-gray-500">
                                                  {fmt(it?.lastStatus?.at)}
                                                </span>
                                              </div>

                                              {Array.isArray(it?.resolvedStatusHistory) &&
                                                it.resolvedStatusHistory.length > 1 && (
                                                  <details className="mt-1">
                                                    <summary className="text-[11px] text-gray-600 cursor-pointer">
                                                      Timeline
                                                    </summary>
                                                    <div className="mt-2">
                                                      <ItemTimeline history={it.resolvedStatusHistory} />
                                                    </div>
                                                  </details>
                                                )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>

                                  </table>
                                </div>
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={prevPage}
                      disabled={loading || page.skip === 0}
                      className="rounded-xl px-3 py-2 text-sm bg-white ring-1 ring-black/10 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <div className="text-xs text-gray-600">
                      Showing {page.skip + 1}–
                      {page.skip + (orders?.length || 0)} (page size{" "}
                      {page.limit})
                    </div>
                    <button
                      onClick={nextPage}
                      disabled={loading || (orders?.length || 0) < page.limit}
                      className="rounded-xl px-3 py-2 text-sm bg-white ring-1 ring-black/10 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute right-6 bottom-6 rounded-xl bg-white/90 backdrop-blur ring-1 ring-black/5 px-3 py-2 text-xs text-gray-600 shadow-lg">
            Loading…
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
