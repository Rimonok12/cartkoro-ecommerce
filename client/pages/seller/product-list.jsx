import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { essentialsOnLoad } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);
  if (!essentials.props.initialUserData) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }
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

export default function ProductList() {
  const { router } = useAppContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const fetchSellerProduct = async () => {
    try {
      setErrMsg("");
      const res = await fetch(`/api/product/getAllProducts`);
      const response = await res.json();

      if (!res.ok) {
        setProducts([]);
        setErrMsg(`Products unavailable (HTTP ${res.status}).`);
        return;
      }

      setProducts(response);
    } catch (e) {
      console.error("fetchSellerProduct:", e);
      setProducts([]);
      setErrMsg("Failed to load products. See console/network for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerProduct();
  }, []);

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full md:p-10 p-4">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                All Product
              </h2>
              <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
            </div>

            <button
              onClick={() => {
                setLoading(true);
                fetchSellerProduct();
              }}
              className="rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm shadow-sm hover:bg-white"
            >
              Refresh
            </button>
          </div>

          {errMsg && (
            <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
              {errMsg}
            </div>
          )}

          <div className="flex flex-col items-center max-w-5xl w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 p-[1px] ring-1 ring-black/5">
            <div className="w-full rounded-2xl border border-white/70 bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
              <table className="w-full table-fixed">
                <thead className="text-gray-900 text-sm text-left">
                  <tr className="border-b border-gray-100/80">
                    <th className="w-2/3 md:w-2/5 px-4 py-3 font-medium">
                      Product
                    </th>
                    <th className="px-4 py-3 font-medium max-sm:hidden">
                      Category
                    </th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium max-sm:hidden">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="text-sm text-gray-600">
                  {products.map((product, index) => (
                    <tr
                      key={product._id || index}
                      className="border-t border-gray-100/80"
                    >
                      <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center gap-3">
                        <div className="bg-gray-100 rounded p-2">
                          <Image
                            src={product.thumbnail_img}
                            alt="product Image"
                            className="w-16 h-16 object-cover"
                            width={1280}
                            height={720}
                          />
                        </div>
                        <span className="truncate">{product.name}</span>
                      </td>
                      <td className="px-4 py-3 max-sm:hidden">
                        {product.category_name}
                      </td>
                      <td className="px-4 py-3">
                        ${Number(product.selling_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 max-sm:hidden">
                        <button
                          onClick={() => router.push(`${product.visitUrl}`)}
                          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-3.5 py-2 text-white shadow-sm transition hover:bg-orange-700"
                        >
                          <span className="hidden md:block">Visit</span>
                          <Image
                            className="h-3.5 w-3.5"
                            src={assets.redirect_icon}
                            alt="redirect_icon"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {products.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
