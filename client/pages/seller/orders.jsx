// "use client";
// import React, { useEffect, useState } from "react";
// import { assets, orderDummyData } from "@/assets/assets";
// import Image from "next/image";
// import { useAppContext } from "@/context/AppContext";
// import Loading from "@/components/Loading";
// import Layout from "@/components/seller/Layout"; // <-- reuse seller layout
// import { essentialsOnLoad, requireB2B } from "@/lib/ssrHelper";

// export async function getServerSideProps(context) {
//   return requireB2B(context);
// }

// const Orders = () => {
//   const { currency } = useAppContext();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Simulated fetch (replace with API later)
//   useEffect(() => {
//     setOrders(orderDummyData);
//     setLoading(false);
//   }, []);

//   return (
//     <>
//       {loading ? (
//         <Loading />
//       ) : (
//         <div>
//           {/* Header */}
//           <div className="mb-5">
//             <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
//               Orders
//             </h2>
//             <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
//           </div>

//           {/* Orders List */}
//           <div className="max-w-4xl space-y-4">
//             {orders.map((order, index) => (
//               <div
//                 key={index}
//                 className="rounded-2xl bg-gradient-to-br from-orange-200/50 via-orange-100/40 to-orange-50/40 p-[1px] shadow-sm ring-1 ring-black/5"
//               >
//                 <div className="flex flex-col md:flex-row gap-5 justify-between p-5 rounded-2xl bg-white/90 border border-white/60 backdrop-blur-sm">
//                   {/* Order items */}
//                   <div className="flex-1 flex gap-5 max-w-80">
//                     <div className="bg-gray-100 rounded p-2">
//                       <Image
//                         className="max-w-16 max-h-16 object-cover"
//                         src={assets.box_icon}
//                         alt="box_icon"
//                       />
//                     </div>
//                     <p className="flex flex-col gap-3">
//                       <span className="font-medium text-gray-900">
//                         {order.items
//                           .map(
//                             (item) => item.product.name + ` x ${item.quantity}`
//                           )
//                           .join(", ")}
//                       </span>
//                       <span className="text-gray-600">
//                         Items : {order.items.length}
//                       </span>
//                     </p>
//                   </div>

//                   {/* Shipping address */}
//                   <div className="text-gray-700">
//                     <p>
//                       <span className="font-medium text-gray-900">
//                         {order.address.fullName}
//                       </span>
//                       <br />
//                       <span>{order.address.area}</span>
//                       <br />
//                       <span>{`${order.address.city}, ${order.address.state}`}</span>
//                       <br />
//                       <span>{order.address.phoneNumber}</span>
//                     </p>
//                   </div>

//                   {/* Amount */}
//                   <p className="font-semibold my-auto text-gray-900">
//                     {currency}
//                     {order.amount}
//                   </p>

//                   {/* Meta */}
//                   <div className="text-gray-700">
//                     <p className="flex flex-col">
//                       <span>Method : COD</span>
//                       <span>
//                         Date : {new Date(order.date).toLocaleDateString()}
//                       </span>
//                       <span>Payment : Pending</span>
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default Orders;

"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import { requireB2B } from "@/lib/ssrHelper";
import { assets } from "@/assets/assets";
import api from "@/lib/axios";
import Navbar from "@/components/seller/Navbar";
import { motion, AnimatePresence } from "framer-motion";

export async function getServerSideProps(ctx) {
  return requireB2B(ctx); // gate: seller/admin/super only
}

/* ---------------- helpers ---------------- */
const bd = (n) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n || 0);

const titleFrom = (name, qty) => `${name} x ${qty}`;

const card = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 26 },
  },
};

/*  Build { [skuId]: { title, thumb } } using product API  */
async function getSkuMetaFor(orders) {
  const ids = new Set();
  orders?.forEach((o) =>
    (o.items || []).forEach((it) => {
      const id = String(it?.sku_id || "");
      if (id) ids.add(id);
    })
  );
  const results = {};
  await Promise.all(
    [...ids].map(async (id) => {
      try {
        const res = await fetch(
          `/api/product/getProductBySkuId?skuId=${encodeURIComponent(id)}`
        );
        const data = await res.json();
        const all = [
          ...(data?.main_sku ? [data.main_sku] : []),
          ...(Array.isArray(data?.other_skus) ? data.other_skus : []),
        ];
        const sku =
          all.find((s) => String(s?._id) === id) ||
          data?.main_sku ||
          all[0] ||
          {};
        const v = sku?.variant_values || {};
        const variant = [v.color, v.storage, v.ram].filter(Boolean).join(", ");
        const title = [data?.product_name, variant && `(${variant})`]
          .filter(Boolean)
          .join(" ");
        results[id] = {
          title: title || `SKU ${id}`,
          thumb: sku?.thumbnail_img || data?.main_sku?.thumbnail_img || "",
        };
      } catch {
        results[id] = { title: `SKU ${id}`, thumb: "" };
      }
    })
  );
  return results;
}

export default function Orders() {
  const { currency } = useAppContext();
  const [orders, setOrders] = useState(null); // null => loading
  const [skuMeta, setSkuMeta] = useState({});
  const [error, setError] = useState("");

  // fetch once (logic unchanged)
  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await api.get("/order/admin/list", {
          withCredentials: true,
        });
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.orders || [];
        list.sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime()
        );
        setOrders(list);
        const meta = await getSkuMetaFor(list);
        setSkuMeta(meta);
      } catch (e) {
        setError(
          e?.response?.data?.message || e?.message || "Failed to load orders"
        );
        setOrders([]); // not null, so UI doesn't stay in loading
      }
    })();
  }, []);

  // ✅ called on every render (no early return before hooks)
  const totalItems = useMemo(
    () => (orders || []).reduce((sum, o) => sum + (o?.items || []).length, 0),
    [orders]
  );

  return (
    <>
      <Navbar />
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
            Orders
          </h2>
          <div className="mt-2 h-1.5 w-36 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 shadow-[0_0_18px_rgba(234,88,12,.45)]" />
          {Array.isArray(orders) && (
            <div className="mt-2 text-sm text-gray-600">
              {orders.length} order{orders.length !== 1 ? "s" : ""} •{" "}
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </div>
          )}
        </motion.div>

        {/* ==== main content states ==== */}
        {error ? (
          <div className="p-4 border rounded-xl text-sm text-red-600 bg-red-50">
            {error}
          </div>
        ) : orders === null ? (
          <Loading />
        ) : orders.length === 0 ? (
          <div className="p-10 text-center border rounded-2xl bg-white/80">
            No orders yet.
          </div>
        ) : (
          <div className="max-w-6xl space-y-6">
            <AnimatePresence initial={false}>
              {orders.map((order, idx) => {
                const created = order?.createdAt
                  ? new Date(order.createdAt).toLocaleString()
                  : "—";
                const headerImg =
                  skuMeta[String(order?.items?.[0]?.sku_id)]?.thumb ||
                  order?.items?.[0]?.product?.images?.[0] ||
                  order?.items?.[0]?.product?.image ||
                  assets.box_icon;

                const headerTitle = (order?.items || [])
                  .map((it) => {
                    const m = skuMeta[String(it?.sku_id)];
                    const name =
                      m?.title ||
                      it?.product?.name ||
                      `SKU ${it?.sku_id ?? "—"}`;
                    return titleFrom(name, it?.quantity ?? 1);
                  })
                  .join(", ");

                const orderTotal = order?.total_amount ?? 0;

                return (
                  <motion.div
                    key={order?._id || idx}
                    variants={card}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-2xl p-[1.25px] bg-gradient-to-br from-gray-900/50 via-gray-800/40 to-gray-900/50 shadow-2xl ring-1 ring-black/10"
                  >
                    <div className="rounded-2xl bg-white/92 backdrop-blur">
                      {/* top shimmer line */}
                      <div className="h-1 rounded-t-2xl bg-gradient-to-r from-transparent via-orange-300/70 to-transparent" />

                      <div className="p-5">
                        {/* Header row */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                          {/* Summary (thumb + names) */}
                          <div className="xl:col-span-6 flex gap-4 min-w-0">
                            <div className="relative shrink-0">
                              <div className="rounded-xl border bg-white shadow-sm overflow-hidden w-16 h-16 grid place-items-center">
                                <Image
                                  src={headerImg}
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
                                title={headerTitle}
                              >
                                {headerTitle}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Order ID: {order?._id ?? "—"}{" "}
                                <span className="mx-1">•</span> Placed:{" "}
                                {created}
                              </p>
                            </div>
                          </div>

                          {/* Shipping (fallback to id if only id) */}
                          <div className="xl:col-span-3 text-gray-700">
                            <p className="text-sm leading-6">
                              {order?.shipping_address?.fullName ? (
                                <>
                                  <span className="font-semibold text-gray-900">
                                    {order.shipping_address.fullName}
                                  </span>
                                  <br />
                                  <span className="truncate inline-block max-w-xs align-top">
                                    {order.shipping_address.area}
                                  </span>
                                  <br />
                                  <span>{`${order.shipping_address.city}, ${order.shipping_address.state}`}</span>
                                  <br />
                                  <span>
                                    {order.shipping_address.phoneNumber}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-gray-500">
                                    Shipping Address Id:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {order?.shipping_address_id ?? "—"}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>

                          {/* Amount */}
                          <div className="xl:col-span-1">
                            <p className="text-right xl:text-left font-semibold text-gray-900 whitespace-nowrap">
                              {currency}
                              {bd(orderTotal)}
                            </p>
                          </div>

                          {/* Meta */}
                          <div className="xl:col-span-2">
                            <div className="text-gray-700 text-sm space-y-1">
                              <div>
                                <span className="text-gray-500">Status :</span>{" "}
                                <span className="font-medium">
                                  {order?.status ?? "Created"}
                                </span>
                              </div>
                              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 bg-gray-50 text-gray-800">
                                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-xs font-medium">
                                  Payment : {order?.payment_status ?? "Pending"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Items gallery */}
                        <div className="mt-5">
                          <div className="text-xs font-semibold text-gray-500 mb-2">
                            Order items
                          </div>
                          <div className="flex gap-4 overflow-x-auto pb-2 pr-1">
                            {(order?.items || []).map((it, i) => {
                              const meta = skuMeta[String(it?.sku_id)];
                              const img =
                                meta?.thumb ||
                                it?.product?.images?.[0] ||
                                it?.product?.image ||
                                assets.box_icon;

                              // strictly from order: sp_each / mrp_each
                              const sp = Number(it?.sp_each) || 0;
                              const mrp = Number(it?.mrp_each) || 0;
                              const unit = sp || mrp;
                              const qty = it?.quantity ?? 1;

                              return (
                                <motion.div
                                  key={`${order?._id}-${i}`}
                                  initial={{ opacity: 0, y: 6 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true }}
                                  className="group shrink-0 w-[300px] rounded-xl border bg-white/92 shadow hover:shadow-md transition-shadow p-3 flex gap-3"
                                >
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-gray-50">
                                    <Image
                                      src={img}
                                      alt={
                                        meta?.title ||
                                        it?.product?.name ||
                                        `SKU ${it?.sku_id ?? ""}`
                                      }
                                      fill
                                      sizes="64px"
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div
                                      className="text-sm font-medium text-gray-900 line-clamp-2"
                                      title={
                                        meta?.title ||
                                        it?.product?.name ||
                                        `SKU ${it?.sku_id ?? ""}`
                                      }
                                    >
                                      {meta?.title ||
                                        it?.product?.name ||
                                        `SKU ${it?.sku_id ?? ""}`}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      Qty: {qty}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      Unit:{" "}
                                      {sp ? (
                                        <>
                                          <span className="font-medium text-gray-900">
                                            {currency}
                                            {bd(sp)}
                                          </span>{" "}
                                          {mrp > sp && (
                                            <span className="line-through">
                                              {currency}
                                              {bd(mrp)}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="font-medium text-gray-900">
                                          {currency}
                                          {bd(mrp)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-semibold mt-0.5">
                                      Line: {currency}
                                      {bd(unit * qty)}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
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
    </>
  );
}
