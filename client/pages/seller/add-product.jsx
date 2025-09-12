"use client";
import React from "react";
import AddProductComponent from "@/components/product/AddProductComponent";
import Navbar from "@/components/seller/Navbar";
import Sidebar from "@/components/seller/Sidebar";
import { requireB2B } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  return requireB2B(context);
}

const AddProduct = () => {
  return (
    <>
      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          <div className="w-full md:p-10 p-4">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Add Product
              </h2>
              <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
            </div>

            {/* Match ProductList surface */}
            <div className="flex flex-col items-center max-w-5xl w-full rounded-2xl bg-white ring-1 ring-black/5 p-4 md:p-6">
              <AddProductComponent />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProduct;
