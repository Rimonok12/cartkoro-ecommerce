"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router"; // pages router
import { useAppContext } from "@/context/AppContext";
import api from "@/lib/axios";

function toNumber(val, fallback = 0) {
  if (val == null) return fallback;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "object" && val?.amount != null) {
    const n = Number(val.amount);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

const SuccessModal = ({ open, message, onOK }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">Success</h2>
        <p className="text-sm text-gray-600 mt-1">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            className="px-5 py-2 bg-orange-600 text-white rounded-lg"
            onClick={onOK}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const CASHBACK_THRESHOLD = 500;
const FREE_SHIPPING_THRESHOLD = 1500;
const DELIVERY_FEE = 125;

const OrderSummary = ({ rows = [], subtotal = 0 }) => {
  const router = useRouter();
  const {
    currency,
    getCartCount,
    cashbackData,
    setCartData,
    setCashbackData,
    recentAddress,
    setRecentAddress,
  } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);

  // 🔸 Keep only purchasable items (exclude strictly out-of-stock)
  const purchasableRows = useMemo(
    () => rows.filter((r) => r?.availableQty !== 0),
    [rows]
  );
  const excludedCount = rows.length - purchasableRows.length;

  // If you prefer unit count instead of line count, replace with a sum of quantities.
  const displayItemCount = purchasableRows.length;

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post(
          "/user/getAddresses",
          {},
          { withCredentials: true }
        );
        const addrs = res?.data?.addresses || [];
        setUserAddresses(addrs);
        if (recentAddress?.id) {
          const hit =
            addrs.find((a) => String(a?._id) === String(recentAddress.id)) ||
            null;
          if (hit) setSelectedAddress(hit);
        }
      } catch (e) {
        console.error("Error fetching addresses", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressSelect = async (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
    try {
      await api.post(
        "/user/redisSetRecentAddress",
        { addressId: address?._id ?? null },
        { withCredentials: true }
      );
      setRecentAddress?.({ id: String(address?._id) });
    } catch (e) {
      console.warn("Failed to persist recent address:", e?.message || e);
    }
  };

  // -------- Money calculations (using ONLY purchasableRows) --------
  const totalMrp = useMemo(() => {
    return purchasableRows.reduce((sum, r) => {
      const mrp = toNumber(
        r?.mrp ?? r?.MRP ?? r?.listPrice ?? r?.priceBeforeDiscount ?? r?.sp,
        0
      );
      const qty = toNumber(r?.quantity, 0);
      return sum + mrp * qty;
    }, 0);
  }, [purchasableRows]);

  // Recompute subtotal locally to ignore OOS rows (ignore `subtotal` prop)
  const subtotalLocal = useMemo(() => {
    return purchasableRows.reduce((sum, r) => {
      const sp = toNumber(r?.sp, 0);
      const qty = toNumber(r?.quantity, 0);
      return sum + sp * qty;
    }, 0);
  }, [purchasableRows]);

  const mrpDiscount = Math.max(0, totalMrp - subtotalLocal);

  const rawCashback = toNumber(cashbackData, 0);
  let maxIdx = -1,
    maxVal = -1,
    hasEligibleLine = false;

  purchasableRows.forEach((r, idx) => {
    const sp = Number(r.sp ?? 0) || 0;
    const qty = Number(r.quantity ?? 0) || 0;
    const val = sp * qty;
    if (val >= CASHBACK_THRESHOLD) hasEligibleLine = true;
    if (val > maxVal) {
      maxVal = val;
      maxIdx = idx;
    }
  });

  const willApplyCashback = hasEligibleLine && rawCashback > 0;
  const eligibleLineSubtotal =
    maxIdx >= 0
      ? (Number(purchasableRows[maxIdx]?.sp ?? 0) || 0) *
        (Number(purchasableRows[maxIdx]?.quantity ?? 0) || 0)
      : 0;
  const appliedCashback = willApplyCashback
    ? Math.min(rawCashback, eligibleLineSubtotal)
    : 0;

  // Total BEFORE shipping
  const total = Math.max(0, subtotalLocal - appliedCashback);

  // Shipping fee & free-delivery guidance
  const shippingFee = total < FREE_SHIPPING_THRESHOLD ? DELIVERY_FEE : 0;
  const grandTotal = total + shippingFee;
  const leftForFreeDelivery = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

  const totalDiscountPercent =
    totalMrp > 0 ? Math.round((mrpDiscount / totalMrp) * 100) : 0;

  // -------- Place Order --------
  const createOrder = async () => {
    if (!selectedAddress?._id) {
      alert("Please select a delivery address before placing order.");
      return;
    }
    if (!purchasableRows.length) {
      alert(
        excludedCount > 0
          ? "All items in your cart are currently out of stock."
          : "Your cart is empty."
      );
      return;
    }

    try {
      const items = purchasableRows.map((r, idx) => {
        const sp_each = Number(r.sp ?? 0) || 0;
        const mrp_each = Number(r.mrp ?? r.MRP ?? r.sp ?? 0) || 0;
        const quantity = Number(r.quantity) || 1;

        let cashback_amount = 0;
        if (appliedCashback > 0 && idx === maxIdx) {
          cashback_amount = appliedCashback;
        }

        return {
          sku_id: r.sku_id,
          quantity,
          mrp_each,
          sp_each,
          cashback_amount,
          delivery_amount: 0, // order-level shipping is separate
        };
      });

      const payload = {
        shipping_address_id: selectedAddress._id,
        total_amount: Number(grandTotal.toFixed(2)), // include shipping
        items,
        shipping_fee: shippingFee,
        subtotal_after_discounts: Number(total.toFixed(2)),
      };

      const res = await api.post("/order/createOrder", payload, {
        withCredentials: true,
      });

      if (res?.data?.ok) {
        setCartData({ items: [] });
        if (appliedCashback > 0) setCashbackData(0);

        api
          .post(
            "/user/updateCart",
            { items: [], merge: false },
            { withCredentials: true }
          )
          .catch(() => {});

        const orderId = res?.data?.order?._id;
        // setSuccessMsg(
        //   orderId
        //     ? `Order #${orderId} has been placed successfully.`
        //     : "Your order has been placed successfully."
        // );
        // setSuccessOpen(true);
        // return;
        router.push(`/order-details?orderId=${orderId}`)
      }
    } catch (e) {
      console.error("createOrder error", e);
      alert("Something went wrong placing the order.");
    }
  };

  return (
    <>
      <div className="w-full md:w-96 bg-gray-500/5 p-5">
        <h2 className="text-xl md:text-2xl font-medium text-gray-700">
          Order Summary
        </h2>
        <hr className="border-gray-500/30 my-5" />

        {/* Heads-up if anything was excluded */}
        {excludedCount > 0 && (
          <p className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {excludedCount} item{excludedCount > 1 ? "s" : ""} removed from
            summary because {excludedCount > 1 ? "they are" : "it is"} out of
            stock.
          </p>
        )}

        <div className="space-y-6">
          {/* Address Selection */}
          <div>
            <label className="text-base font-medium uppercase text-gray-600 block mb-2">
              Select Address
            </label>
            <div className="relative inline-block w-full text-sm border">
              <button
                className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>
                  {selectedAddress
                    ? `${selectedAddress.full_name}, ${
                        selectedAddress.address
                      }, ${selectedAddress?.upazila_id?.name ?? ""}, ${
                        selectedAddress?.district_id?.name ?? ""
                      }`
                    : "Select Address"}
                </span>
                <svg
                  className={`w-5 h-5 inline float-right transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-0" : "-rotate-90"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#6B7280"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                  {userAddresses.map((address, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                      onClick={() => handleAddressSelect(address)}
                    >
                      {address.full_name}, {address.address},{" "}
                      {address?.upazila_id?.name ?? ""},{" "}
                      {address?.district_id?.name ?? ""}
                    </li>
                  ))}
                  <li
                    onClick={() =>
                      (window.location.href =
                        "/account/address?add-address=true")
                    }
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                  >
                    + Add New Address
                  </li>
                </ul>
              )}
            </div>
          </div>

          <hr className="border-gray-500/30 my-5" />

          {/* Payment Type */}
          <div>
            <label className="text-base font-medium uppercase text-gray-600 block mb-2">
              Payment Type :
              <span className="text-orange-600"> Cash On Delivery</span>
            </label>
          </div>

          <hr className="border-gray-500/30 my-5" />

          {/* Summary */}
          <div className="space-y-4">
            <div className="flex justify-between text-base font-medium">
              <p className="uppercase font-medium text-gray-600">
                Price Details ({displayItemCount} item
                {displayItemCount === 1 ? "" : "s"})
              </p>
            </div>

            <div className="flex justify-between text-base font-medium">
              <p className="text-gray-600">Total MRP</p>
              <p className="text-gray-800">
                {currency} {totalMrp.toFixed(2)}
              </p>
            </div>

            <div className="flex justify-between text-base font-medium">
              <p className="text-gray-600">MRP Discount</p>
              <p className="text-gray-800">
                - {currency} {mrpDiscount.toFixed(2)}
              </p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-600">
                Cashback
                {!willApplyCashback && rawCashback > 0 ? (
                  <span className="ml-1 text-xs text-gray-500">
                    (usable only if any line ≥ {currency} {CASHBACK_THRESHOLD})
                  </span>
                ) : null}
              </p>
              <p className="font-medium text-gray-800">
                - {currency} {appliedCashback.toFixed(2)}
              </p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-600">Shipping Fee</p>
              <p className="font-medium text-gray-800">
                {shippingFee > 0 ? (
                  <>
                    {currency} {shippingFee.toFixed(2)}
                  </>
                ) : (
                  "Free"
                )}
              </p>
            </div>

            {shippingFee > 0 && (
              <p className="text-l font-bold text-red-600">
                Add item worth {currency} {leftForFreeDelivery.toFixed(2)} to
                get free delivery.
              </p>
            )}

            <div className="border-t pt-3">
              <div className="flex justify-between text-lg md:text-xl font-medium">
                <p>Total</p>
                <p>
                  {currency} {grandTotal.toFixed(2)}
                </p>
              </div>

              {mrpDiscount > 0 && (
                <p className="mt-2 text-sm text-green-700">
                  You will save {currency} {mrpDiscount.toFixed(2)} on this
                  order
                  {totalDiscountPercent > 0
                    ? ` (${totalDiscountPercent}% off)`
                    : ""}
                  .
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={createOrder}
          className="w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700"
        >
          Place Order
        </button>
      </div>
    </>
  );
};

export default OrderSummary;
