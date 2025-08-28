// client/components/OrderSummary.jsx
import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useMemo, useState } from "react";
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

const OrderSummary = ({ rows = [], subtotal = 0 }) => {
  const { currency, getCartCount, cashbackData } = useAppContext();

  // -------- Address state/fetch --------
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post("/user/getAddresses", {}, { withCredentials: true });
        setUserAddresses(res?.data?.addresses || []);
      } catch (e) {
        console.error("Error fetching addresses", e);
      }
    })();
  }, []);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  // -------- Money (no tax) --------
  const totalMrp = useMemo(() => {
    return rows.reduce((sum, r) => {
      const mrp = toNumber(r?.mrp ?? r?.MRP ?? r?.listPrice ?? r?.priceBeforeDiscount ?? r?.sp, 0);
      const qty = toNumber(r?.quantity, 0);
      return sum + mrp * qty;
    }, 0);
  }, [rows]);

  const mrpDiscount = Math.max(0, totalMrp - subtotal);
  const cashback = toNumber(cashbackData, 0);
  const total = Math.max(0, subtotal - cashback); // shipping is free

  const totalDiscountPercent = totalMrp > 0 ? Math.round((mrpDiscount / totalMrp) * 100) : 0;

  const createOrder = async () => {
    if (!selectedAddress) {
      alert("Please select a delivery address before placing order.");
      return;
    }
    // TODO: call create-order API with:
    // { address_id: selectedAddress._id, items: rows.map(({sku_id, quantity}) => ({sku_id, quantity})) }
  };

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">Order Summary</h2>
      <hr className="border-gray-500/30 my-5" />

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
                  ? `${selectedAddress.full_name}, ${selectedAddress.address}, ${selectedAddress?.upazila_id?.name ?? ""}, ${selectedAddress?.district_id?.name ?? ""}`
                  : "Select Address"}
              </span>
              <svg
                className={`w-5 h-5 inline float-right transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-0" : "-rotate-90"
                }`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
                    {address.full_name}, {address.address}, {address?.upazila_id?.name ?? ""}, {address?.district_id?.name ?? ""}
                  </li>
                ))}
                <li
                  onClick={() => (window.location.href = "/account/address?add-address=true")}
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
            Payment Type :<span className="text-orange-600"> Cash On Delivery</span>
          </label>
        </div>

        <hr className="border-gray-500/30 my-5" />

        {/* Summary (no tax) */}
        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase font-medium text-gray-600">
              Price Details ({getCartCount()} item{getCartCount() === 1 ? "" : "s"})
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
            <p className="text-gray-600">Cashback</p>
            <p className="font-medium text-gray-800">
              - {currency} {cashback.toFixed(2)}
            </p>
          </div>

          <div className="flex justify-between">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-medium text-gray-800">Free</p>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-lg md:text-xl font-medium">
              <p>Total</p>
              <p>
                {currency} {total.toFixed(2)}
              </p>
            </div>

            {/* Savings line (Flipkart-style) */}
            {mrpDiscount > 0 && (
              <p className="mt-2 text-sm text-green-700">
                You will save {currency} {mrpDiscount.toFixed(2)} on this order
                {totalDiscountPercent > 0 ? ` (${totalDiscountPercent}% off)` : ''}.
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
  );
};

export default OrderSummary;
