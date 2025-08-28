// client/pages/cart.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import OrderSummary from '@/components/OrderSummary';
import { assets } from '@/assets/assets';
import { useAppContext } from '@/context/AppContext';
import api from "@/lib/axios";
import { essentialsOnLoad } from '@/lib/ssrHelper';

// ✅ SSR guard (pages router)
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies || {};
  if (!cookies['CK-REF-T']) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  const essentials = await essentialsOnLoad(context);
  return { props: { ...essentials.props } };
}

/** Product normalizer — includes MRP */
function normFromHandler(payload) {
  const root = payload?.data ?? payload ?? {};
  const sku = root.main_sku || root.sku || root.skuData || root.sku_info || {};

  const productName =
    root.product_name ||
    root.product?.name ||
    root.productData?.name ||
    'Product';

  const sp = Number(
    sku?.SP ?? sku?.sp ?? sku?.price ?? sku?.selling_price ?? 0
  );

  const mrp = Number(
    sku?.MRP ?? sku?.mrp ?? sp
  );

  const thumb =
    sku?.thumbnail_img ||
    (Array.isArray(sku?.side_imgs) && sku.side_imgs.length ? sku.side_imgs[0] : '') ||
    '';

  return {
    sku_id: sku?._id || sku?.sku_id || root?.sku_id || root?.id || null,
    name: productName,
    sp: Number.isFinite(sp) ? sp : 0,
    mrp: Number.isFinite(mrp) ? mrp : (Number.isFinite(sp) ? sp : 0),
    thumbnailImg: thumb,
  };
}

/** Fetch details for ONE sku via your handler */
async function fetchSkuViaHandler(id) {
  try {
    const r = await fetch(`/api/product/getProductBySkuId?skuId=${encodeURIComponent(id)}`);
    if (!r.ok) return null;
    const json = await r.json().catch(() => null);
    return normFromHandler(json);
  } catch {
    return null;
  }
}

/** debounce helper */
function useDebouncedCallback(cb, delay = 400) {
  const t = useRef(null);
  return (...args) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => cb(...args), delay);
  };
}

export default function Cart() {
  const { cartData, updateCartQuantity, getCartCount, currency } = useAppContext();

  const items = useMemo(() => cartData?.items || [], [cartData?.items]);
  const [enriched, setEnriched] = useState({}); // sku_id -> { name, sp, mrp, thumbnailImg }

  // --- server sync: send the FULL items array (sku_id, quantity) ---
  const actuallySyncCart = async (itemsToSync) => {
    try {
      await api.post(
        "/user/updateCart",
        { items: itemsToSync.map(({ sku_id, quantity }) => ({ sku_id, quantity })) },
        { withCredentials: true }
      );
    } catch (e) {
      console.error("Error updating cart:", e);
    }
  };
  const debouncedSync = useDebouncedCallback(actuallySyncCart, 450);

  // whenever items change, debounce-sync to server
  useEffect(() => {
    if (!items.length) {
      debouncedSync([]);
      return;
    }
    debouncedSync(items);
  }, [items.map(i => `${i.sku_id}:${i.quantity}`).join('|')]);

  // Enrich rows that don’t already carry details
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const needIds = [];
      const prime = {};
      for (const it of items) {
        const hasDetails = !!(it?.name || it?.sp != null || it?.thumbnailImg || it?.mrp != null);
        if (hasDetails) {
          prime[it.sku_id] = {
            sku_id: it.sku_id,
            name: it.name,
            sp: Number(it.sp ?? it.price ?? 0) || 0,
            mrp: Number(it.mrp ?? it.MRP ?? it.listPrice ?? it.priceBeforeDiscount ?? it.sp ?? 0) || 0,
            thumbnailImg: it.thumbnailImg || '',
          };
        } else if (it?.sku_id) {
          needIds.push(it.sku_id);
        }
      }
      let fetchedMap = {};
      if (needIds.length) {
        const results = await Promise.all(needIds.map(fetchSkuViaHandler));
        for (const row of results) {
          if (row?.sku_id) fetchedMap[row.sku_id] = row;
        }
      }
      if (!cancelled) setEnriched({ ...fetchedMap, ...prime });
    })();
    return () => { cancelled = true; };
  }, [items]);

  // Build display rows
  const rows = items.map((it) => {
    const e = enriched[it.sku_id] || {};
    return {
      sku_id: it.sku_id,
      quantity: Number(it.quantity) || 1,
      name: it.name ?? e.name ?? 'Product',
      sp: Number(it.sp ?? it.price ?? e.sp ?? 0) || 0,
      mrp: Number(it.mrp ?? it.MRP ?? e.mrp ?? e.MRP ?? 0) || 0,
      thumbnailImg: it.thumbnail_img ?? it.thumbnailImg ?? e.thumbnailImg ?? '',
    };
  });

  const subtotal = rows.reduce((sum, r) => sum + r.sp * r.quantity, 0);

  const percentOff = (mrp, sp) => {
    if (!mrp || mrp <= sp) return 0;
    return Math.round(((mrp - sp) / mrp) * 100);
  };

  // --- UI handlers
  const setQty = (sku_id, quantity) => {
    let q = parseInt(quantity, 10);
    if (isNaN(q) || q < 1) q = 1;
    updateCartQuantity(sku_id, q);
  };

  const inc = (sku_id, cur) => setQty(sku_id, (Number(cur) || 1) + 1);
  const dec = (sku_id, cur) => setQty(sku_id, Math.max(1, (Number(cur) || 1) - 1));
  const remove = (sku_id) => updateCartQuantity(sku_id, 0);

  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 px-4 md:px-16 lg:px-32 pt-14 mb-20">

        {/* LEFT: CART */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-2xl md:text-3xl text-gray-700">
              Your <span className="font-semibold text-orange-600">Cart</span>
            </p>
            <p className="text-sm md:text-lg text-gray-500/90">
              {getCartCount()} Item{getCartCount() === 1 ? '' : 's'}
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-20 text-gray-500">Your cart is empty 🛒</div>
          ) : (
            <>
              {/* 🔹 Mobile: cards list (vertical price block) */}
              <div className="md:hidden max-h-[62vh] overflow-y-auto pr-1 space-y-3">
                {rows.map((item) => (
                  <div key={item.sku_id} className="rounded-2xl ring-1 ring-black/5 bg-white p-3">
                    <div className="flex gap-3">
                      <div className="shrink-0 rounded-lg overflow-hidden bg-slate-100 p-2">
                        {item.thumbnailImg ? (
                          <Image
                            src={item.thumbnailImg}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="h-16 w-16 object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded bg-gray-100 border border-gray-200" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{item.name}</p>

                        {/* vertical price block */}
                        <div className="mt-1 flex flex-col">
                          {item.mrp > 0 && item.mrp > item.sp && (
                            <span className="text-gray-500 line-through text-sm">
                              {currency} {item.mrp.toFixed(2)}
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-semibold">
                              {currency} {item.sp.toFixed(2)}
                            </span>
                            {item.mrp > item.sp && (
                              <span className="rounded bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                                {percentOff(item.mrp, item.sp)}% off
                              </span>
                            )}
                          </div>
                        </div>

                        {/* qty controls */}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => dec(item.sku_id, item.quantity)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8 flex items-center justify-center rounded border border-slate-300"
                            title="Decrease"
                          >
                            <Image src={assets.decrease_arrow} alt="-" className="h-4 w-4" />
                          </button>

                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val) || val < 1) val = 1;
                              setQty(item.sku_id, val);
                            }}
                            className="h-8 w-12 rounded border border-slate-300 text-center outline-none"
                          />

                          <button
                            onClick={() => inc(item.sku_id, item.quantity)}
                            className="h-8 w-8 flex items-center justify-center rounded border border-slate-300"
                            title="Increase"
                          >
                            <Image src={assets.increase_arrow} alt="+" className="h-4 w-4" />
                          </button>

                          <button
                            className="ml-auto text-xs text-orange-600 hover:underline"
                            onClick={() => remove(item.sku_id)}
                          >
                            Remove
                          </button>
                        </div>

                        {/* subtotal */}
                        <div className="mt-2 text-sm text-slate-900 font-medium">
                          Subtotal: {currency} {(item.sp * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 🔹 Desktop: classic table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl ring-1 ring-black/5 bg-white">
                <table className="min-w-full table-auto">
                  <thead className="text-left bg-slate-50/70">
                    <tr className="text-gray-700">
                      <th className="pb-4 md:px-4 px-2 font-medium">Product Details</th>
                      <th className="pb-4 md:px-4 px-2 font-medium">Price</th>
                      <th className="pb-4 md:px-4 px-2 font-medium">Quantity</th>
                      <th className="pb-4 md:px-4 px-2 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item.sku_id} className="border-t border-slate-100 text-sm text-slate-700">
                        <td className="py-4 md:px-4 px-2">
                          <div className="flex items-center gap-4">
                            <div className="rounded-lg overflow-hidden bg-slate-100 p-2">
                              {item.thumbnailImg ? (
                                <Image
                                  src={item.thumbnailImg}
                                  alt={item.name}
                                  width={64}
                                  height={64}
                                  className="h-16 w-16 object-cover"
                                />
                              ) : (
                                <div className="h-16 w-16 rounded bg-gray-100 border border-gray-200" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{item.name}</p>
                              <button
                                className="mt-1 text-xs text-orange-600 hover:underline"
                                onClick={() => remove(item.sku_id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 md:px-4 px-2">
                          <div className="flex items-center gap-2">
                            {item.mrp > 0 && item.mrp > item.sp && (
                              <span className="text-gray-500 line-through">
                                {currency} {item.mrp.toFixed(2)}
                              </span>
                            )}
                            <span className="text-gray-900 font-medium">
                              {currency} {item.sp.toFixed(2)}
                            </span>
                            {item.mrp > item.sp && (
                              <span className="ml-1 rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                                {percentOff(item.mrp, item.sp)}% off
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 md:px-4 px-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => dec(item.sku_id, item.quantity)}
                              disabled={item.quantity <= 1}
                              title="Decrease"
                            >
                              <Image src={assets.decrease_arrow} alt="-" className="h-4 w-4" />
                            </button>

                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => {
                                let val = parseInt(e.target.value, 10);
                                if (isNaN(val) || val < 1) val = 1;
                                setQty(item.sku_id, val);
                              }}
                              className="h-8 w-12 rounded border border-slate-300 text-center outline-none"
                            />

                            <button onClick={() => inc(item.sku_id, item.quantity)} title="Increase">
                              <Image src={assets.increase_arrow} alt="+" className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                        <td className="py-4 md:px-4 px-2 font-medium text-slate-900">
                          {currency} {(item.sp * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <button
            onClick={() => (window.location.href = '/all-products')}
            className="group mt-6 inline-flex items-center gap-2 text-orange-600"
          >
            <Image
              className="transition group-hover:-translate-x-1"
              src={assets.arrow_right_icon_colored}
              alt="arrow"
            />
            Continue Shopping
          </button>
        </div>

        {/* RIGHT: SUMMARY */}
        <OrderSummary rows={rows} subtotal={subtotal} />
      </div>
    </>
  );
}
