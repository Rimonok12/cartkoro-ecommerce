import React from "react";
import AddProductComponent from "@/components/product/AddProductComponent";
import { useAppContext } from "@/context/AppContext";
import { essentialsOnLoad } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);
  // if no user data → send them home (or login page)
  if (!essentials.props.initialUserData) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  // check admin flag
  if (essentials.props.initialUserData.is_admin === false) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }
  return {
    props: {
      ...essentials.props,
    },
  };
}

const AddProduct = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/50 to-white">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-8 py-8">
        <div className="rounded-2xl bg-gradient-to-br from-orange-200/60 via-orange-300/45 to-orange-100/60 p-[1px] shadow-lg ring-1 ring-black/5">
          <div className="rounded-2xl border border-white/60 bg-white/90 p-4 md:p-6 backdrop-blur-sm">
            <AddProductComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
