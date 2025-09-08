"use client";
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import Layout from "@/components/seller/Layout"; // <-- reuse seller layout
import { essentialsOnLoad, requireB2B } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  return requireB2B(context);
}

const Orders = () => {
  const { currency } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulated fetch (replace with API later)
  useEffect(() => {
    setOrders(orderDummyData);
    setLoading(false);
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div>
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              Orders
            </h2>
            <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
          </div>

          {/* Orders List */}
          <div className="max-w-4xl space-y-4">
            {orders.map((order, index) => (
              <div
                key={index}
                className="rounded-2xl bg-gradient-to-br from-orange-200/50 via-orange-100/40 to-orange-50/40 p-[1px] shadow-sm ring-1 ring-black/5"
              >
                <div className="flex flex-col md:flex-row gap-5 justify-between p-5 rounded-2xl bg-white/90 border border-white/60 backdrop-blur-sm">
                  {/* Order items */}
                  <div className="flex-1 flex gap-5 max-w-80">
                    <div className="bg-gray-100 rounded p-2">
                      <Image
                        className="max-w-16 max-h-16 object-cover"
                        src={assets.box_icon}
                        alt="box_icon"
                      />
                    </div>
                    <p className="flex flex-col gap-3">
                      <span className="font-medium text-gray-900">
                        {order.items
                          .map(
                            (item) => item.product.name + ` x ${item.quantity}`
                          )
                          .join(", ")}
                      </span>
                      <span className="text-gray-600">
                        Items : {order.items.length}
                      </span>
                    </p>
                  </div>

                  {/* Shipping address */}
                  <div className="text-gray-700">
                    <p>
                      <span className="font-medium text-gray-900">
                        {order.address.fullName}
                      </span>
                      <br />
                      <span>{order.address.area}</span>
                      <br />
                      <span>{`${order.address.city}, ${order.address.state}`}</span>
                      <br />
                      <span>{order.address.phoneNumber}</span>
                    </p>
                  </div>

                  {/* Amount */}
                  <p className="font-semibold my-auto text-gray-900">
                    {currency}
                    {order.amount}
                  </p>

                  {/* Meta */}
                  <div className="text-gray-700">
                    <p className="flex flex-col">
                      <span>Method : COD</span>
                      <span>
                        Date : {new Date(order.date).toLocaleDateString()}
                      </span>
                      <span>Payment : Pending</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
