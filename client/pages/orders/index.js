import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

// ✅ SSR guard: must be logged in
export async function getServerSideProps({ req }) {
  const c = req.cookies || {};
  if (!(c["CK-ACC-T"] || c["CK-REF-T"])) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: {} };
}

async function callFirstSuccess(method, paths, data) {
  let lastError;
  for (const url of paths) {
    try {
      const res = await api.request({
        method,
        url,
        data,
        withCredentials: true,
      });
      if (res.status >= 200 && res.status < 300) return { res, url };
    } catch (e) {
      const s = e?.response?.status;
      if (s === 404 || s === 405) {
        lastError = e;
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error("No matching endpoint");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tracking, setTracking] = useState({}); // { [orderId]: {loading, steps, error} }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { res } = await callFirstSuccess("get", [
          "/orders/my",
          "/user/orders",
          "/order/my-orders",
        ]);
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.orders || [];
        if (!mounted) return;
        setOrders(list);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getId = (o) => o._id || o.id || o.orderId || "";
  const getDate = (o) => o.createdAt || o.created_at || o.date || "";
  const getTotal = (o) => o.total || o.totalPrice || o.amount || 0;
  const getStatus = (o) => o.status || o.deliveryStatus || o.orderStatus || "—";
  const getItemsCount = (o) => o.items?.length || o.products?.length || 0;

  const fetchTrack = async (orderId) => {
    setTracking((t) => ({ ...t, [orderId]: { loading: true } }));
    try {
      const { res } = await callFirstSuccess("get", [
        `/orders/${orderId}/track`,
        `/order/track/${orderId}`,
        `/order/${orderId}/track`,
      ]);
      const steps = res.data?.steps || res.data || [];
      setTracking((t) => ({ ...t, [orderId]: { loading: false, steps } }));
    } catch (e) {
      setTracking((t) => ({
        ...t,
        [orderId]: {
          loading: false,
          error: e?.response?.data?.error || "Failed to fetch tracking",
        },
      }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">My orders</h1>

      {loading ? (
        <div className="animate-pulse h-40 bg-gray-100 rounded-2xl" />
      ) : err ? (
        <p className="text-red-600">{err}</p>
      ) : orders.length === 0 ? (
        <div className="bg-white border rounded-2xl p-8 text-center">
          <p className="text-gray-600">You have no orders yet.</p>
          <Link href="/all-products" className="text-pink-600 font-semibold">
            Start shopping →
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-3 text-sm bg-gray-50 font-medium">
            <div className="col-span-3">Order</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-3">Status / Track</div>
          </div>

          {orders.map((o, i) => {
            const id = getId(o);
            const t = tracking[id] || {};
            return (
              <div
                key={id || i}
                className="grid grid-cols-12 px-4 py-4 border-t items-start"
              >
                <div className="col-span-3">
                  <div className="font-mono text-sm truncate">
                    #{String(id).slice(-10)}
                  </div>
                </div>
                <div className="col-span-2 text-gray-700">
                  {new Date(getDate(o)).toLocaleDateString() || "—"}
                </div>
                <div className="col-span-2 text-gray-700">
                  {getItemsCount(o)} item(s)
                </div>
                <div className="col-span-2 text-gray-900 font-semibold">
                  ৳{getTotal(o)}
                </div>
                <div className="col-span-3">
                  <div className="text-gray-700">{getStatus(o)}</div>

                  <button
                    onClick={() => fetchTrack(id)}
                    className="mt-2 text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                  >
                    {t.loading ? "Loading…" : "Track order"}
                  </button>

                  {/* tracking details */}
                  {t.steps && Array.isArray(t.steps) && t.steps.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      {t.steps.map((s, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-gray-400" />
                          <span>{s.status || s.title || s}</span>
                          {s.time && (
                            <span className="text-gray-500">
                              — {new Date(s.time).toLocaleString()}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {t.error && (
                    <p className="mt-2 text-sm text-red-600">{t.error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
