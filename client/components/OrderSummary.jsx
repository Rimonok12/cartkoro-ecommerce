import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";
import api from "@/lib/axios";

function toNumber(val, fallback = 0) {
  // supports number or { amount: number } or stringy numbers
  if (val == null) return fallback;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "object" && val?.amount != null) {
    const n = Number(val.amount);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

const OrderSummary = () => {
  const { currency, cartData, getCartCount, cashbackData } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);

  const fetchUserAddresses = async () => {
    try {
      const res = await api.post("/user/getAddresses", {}, { withCredentials: true });
      setUserAddresses(res?.data?.addresses || []);
    } catch (e) {
      console.error("Error fetching addresses", e);
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const createOrder = async () => {
    if (!selectedAddress) {
      alert("Please select a delivery address before placing order.");
      return;
    }
    // TODO: API call to create order
  };

  useEffect(() => {
    fetchUserAddresses();
  }, []);

  // --- Calculate amounts safely from cartData ---
  const items = Array.isArray(cartData?.items) ? cartData.items : [];

  const subtotal = items.reduce((sum, item) => {
    const price = toNumber(item?.sp ?? item?.price ?? item?.SP ?? item?.selling_price, 0);
    const qty = toNumber(item?.quantity, 0);
    return sum + price * qty;
  }, 0);

  const tax = Math.floor(subtotal * 0.02);
  const cashback = toNumber(cashbackData, 0); // supports number or {amount}
  const total = subtotal + tax - cashback;

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
                  ? `${selectedAddress.full_name}, ${selectedAddress.address}, ${selectedAddress.upazila_id?.name ?? ""}, ${selectedAddress.district_id?.name ?? ""}`
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
                    {address.full_name}, {address.address}, {address.upazila_id?.name ?? ""},{" "}
                    {address.district_id?.name ?? ""}
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

        {/* Summary */}
        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase bold text-gray-600">Price Details ({getCartCount()} item(s))</p>
          </div>
          <div className="flex justify-between text-base font-medium">
            <p className="text-gray-600">Total MRP</p>
            <p className="text-gray-800">
              {currency} {subtotal.toFixed(2)}
            </p>
          </div>
          <div className="flex justify-between text-base font-medium">
            <p className="text-gray-600">MRP Discount</p>
            <p className="text-gray-800">
              {currency} {subtotal.toFixed(2)}
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
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>
              {currency} {total.toFixed(2)}
            </p>
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
