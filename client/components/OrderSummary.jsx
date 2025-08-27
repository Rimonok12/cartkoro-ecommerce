// "use client";
// import React, { useEffect, useState } from "react";
// import { useAppContext } from "@/context/AppContext";

// export default function OrderSummary({ items: itemsOverride }) {
//   const { currency, cartData, getCartCount } = useAppContext();
//   const [selectedAddress, setSelectedAddress] = useState(null);

//   const items = itemsOverride ?? cartData?.items ?? [];

//   const subtotal = items.reduce(
//     (sum, it) => sum + (Number(it.sp ?? it.price) || 0) * (Number(it.quantity) || 0),
//     0
//   );
//   const tax = Math.floor(subtotal * 0.02);
//   const total = subtotal + tax;

//   return (
//     <aside className="w-full md:w-[380px] rounded-2xl bg-slate-50/80 ring-1 ring-black/5 p-5">
//       <h2 className="text-2xl font-semibold text-slate-800">Order Summary</h2>
//       <hr className="my-4 border-slate-200" />

//       {/* address + promo can stay as you had */}

//       <div className="mt-4 space-y-2 text-slate-700">
//         <div className="flex justify-between">
//           <span>ITEMS</span>
//           <span>{items.reduce((n, it) => n + (Number(it.quantity) || 0), 0)}</span>
//         </div>
//         <div className="flex justify-between">
//           <span>Subtotal</span>
//           <span>
//             {currency} {subtotal.toFixed(2)}
//           </span>
//         </div>
//         <div className="flex justify-between">
//           <span>Shipping Fee</span>
//           <span className="text-emerald-600">Free</span>
//         </div>
//         <div className="flex justify-between">
//           <span>Tax (2%)</span>
//           <span>
//             {currency} {tax.toFixed(2)}
//           </span>
//         </div>

//         <div className="my-2 h-px bg-slate-200" />

//         <div className="flex justify-between text-lg font-semibold text-slate-900">
//           <span>Total</span>
//           <span>
//             {currency} {total.toFixed(2)}
//           </span>
//         </div>
//       </div>

//       <button className="mt-5 w-full rounded-xl bg-orange-600 py-3 text-white hover:bg-orange-700">
//         Place Order
//       </button>
//     </aside>
//   );
// }


/////////////////

import { addressDummyData } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";

const OrderSummary = () => {
  const { currency, cartData, getCartCount } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);

  const fetchUserAddresses = async () => {
    // later replace with API call
    setUserAddresses(addressDummyData);
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
    console.log("Order Created ✅", {
      itemsCount: getCartCount(),
      totalAmount: total,
      address: selectedAddress,
    });
    // TODO: API call to create order
  };

  useEffect(() => {
    fetchUserAddresses();
  }, []);

  // --- Calculate amounts directly from cartData ---
  const subtotal = cartData?.items?.reduce(
    (sum, item) => sum + (item.sp || 0) * (item.quantity || 0),
    0
  ) || 0;
  const tax = Math.floor(subtotal * 0.02);
  const total = subtotal + tax;

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Order Summary
      </h2>
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
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
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
                    {address.fullName}, {address.area}, {address.city},{" "}
                    {address.state}
                  </li>
                ))}
                <li
                  onClick={() => (window.location.href = "/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Promo Code */}
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Promo Code
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              placeholder="Enter promo code"
              className="flex-grow w-full outline-none p-2.5 text-gray-600 border"
            />
            <button className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">
              Apply
            </button>
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        {/* Summary */}
        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600">Items {getCartCount()}</p>
            <p className="text-gray-800">
              {currency} {subtotal}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-medium text-gray-800">Free</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Tax (2%)</p>
            <p className="font-medium text-gray-800">
              {currency} {tax}
            </p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>
              {currency} {total}
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
