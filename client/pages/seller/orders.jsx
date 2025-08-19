// 'use client';
// import React, { useEffect, useState } from "react";
// import { assets, orderDummyData } from "@/assets/assets";
// import Image from "next/image";
// import { useAppContext } from "@/context/AppContext";
// import Navbar from '@/components/seller/Navbar';
// import Sidebar from '@/components/seller/Sidebar';
// import Footer from "@/components/seller/Footer";
// import Loading from "@/components/Loading";

// const Orders = () => {

//     const { currency } = useAppContext();

//     const [orders, setOrders] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const fetchSellerOrders = async () => {
//         setOrders(orderDummyData);
//         setLoading(false);
//     }

//     useEffect(() => {
//         fetchSellerOrders();
//     }, []);

//     return (
//         <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
//             {loading ? <Loading /> : <div className="md:p-10 p-4 space-y-5">
//                 <h2 className="text-lg font-medium">Orders</h2>
//                 <div className="max-w-4xl rounded-md">
//                     {orders.map((order, index) => (
//                         <div key={index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300">
//                             <div className="flex-1 flex gap-5 max-w-80">
//                                 <Image
//                                     className="max-w-16 max-h-16 object-cover"
//                                     src={assets.box_icon}
//                                     alt="box_icon"
//                                 />
//                                 <p className="flex flex-col gap-3">
//                                     <span className="font-medium">
//                                         {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
//                                     </span>
//                                     <span>Items : {order.items.length}</span>
//                                 </p>
//                             </div>
//                             <div>
//                                 <p>
//                                     <span className="font-medium">{order.address.fullName}</span>
//                                     <br />
//                                     <span >{order.address.area}</span>
//                                     <br />
//                                     <span>{`${order.address.city}, ${order.address.state}`}</span>
//                                     <br />
//                                     <span>{order.address.phoneNumber}</span>
//                                 </p>
//                             </div>
//                             <p className="font-medium my-auto">{currency}{order.amount}</p>
//                             <div>
//                                 <p className="flex flex-col">
//                                     <span>Method : COD</span>
//                                     <span>Date : {new Date(order.date).toLocaleDateString()}</span>
//                                     <span>Payment : Pending</span>
//                                 </p>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>}
//             <Footer />
//         </div>
//     );
// };

// export default Orders;
'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";

const Orders = () => {
  const { currency } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSellerOrders = async () => {
    setOrders(orderDummyData);
    setLoading(false);
  };

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? (
        <Loading />
      ) : (
        <div className="md:p-10 p-4">
          {/* header */}
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Orders</h2>
            <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
          </div>

          <div className="max-w-4xl space-y-4">
            {orders.map((order, index) => (
              <div key={index} className="rounded-2xl bg-gradient-to-br from-orange-200/50 via-orange-100/40 to-orange-50/40 p-[1px] shadow-sm ring-1 ring-black/5">
                <div className="flex flex-col md:flex-row gap-5 justify-between p-5 rounded-2xl bg-white/90 border border-white/60 backdrop-blur-sm">
                  <div className="flex-1 flex gap-5 max-w-80">
                    <div className="bg-gray-100 rounded p-2">
                      <Image className="max-w-16 max-h-16 object-cover" src={assets.box_icon} alt="box_icon" />
                    </div>
                    <p className="flex flex-col gap-3">
                      <span className="font-medium text-gray-900">
                        {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                      </span>
                      <span className="text-gray-600">Items : {order.items.length}</span>
                    </p>
                  </div>

                  <div className="text-gray-700">
                    <p>
                      <span className="font-medium text-gray-900">{order.address.fullName}</span><br />
                      <span>{order.address.area}</span><br />
                      <span>{`${order.address.city}, ${order.address.state}`}</span><br />
                      <span>{order.address.phoneNumber}</span>
                    </p>
                  </div>

                  <p className="font-semibold my-auto text-gray-900">
                    {currency}{order.amount}
                  </p>

                  <div className="text-gray-700">
                    <p className="flex flex-col">
                      <span>Method : COD</span>
                      <span>Date : {new Date(order.date).toLocaleDateString()}</span>
                      <span>Payment : Pending</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Orders;
