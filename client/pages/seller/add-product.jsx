import React from "react";
import AddProductComponent from "@/components/product/AddProductComponent";
import Navbar from "@/components/seller/Navbar";
import Sidebar from "@/components/seller/Sidebar";
import { useAppContext } from "@/context/AppContext";
import { essentialsOnLoad, requireB2B } from "@/lib/ssrHelper";

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
          {/* glass surface for page bodies */}

          <div className="mx-auto w-full max-w-5xl px-4 md:px-8 py-8">
            <div className="rounded-2xl bg-gradient-to-br from-orange-200/60 via-orange-300/45 to-orange-100/60 p-[1px] shadow-lg ring-1 ring-black/5">
              <div className="rounded-2xl border border-white/60 bg-white/90 p-4 md:p-6 backdrop-blur-sm">
                <AddProductComponent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProduct;
