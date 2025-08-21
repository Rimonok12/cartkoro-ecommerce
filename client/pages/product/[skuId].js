"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import ProductCard from "@/components/ProductCard";
import { useAppContext } from "@/context/AppContext";
import api from "@/lib/axios";
import { essentialsOnLoad } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);
  return {
    props: {
      ...essentials.props,
    },
  };
}

const Product = () => {
  const router = useRouter();
  const { skuId } = router.query;

  const { addToCart } = useAppContext();

  const [productData, setProductData] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // fetch product details by skuId
  useEffect(() => {
    if (!skuId) return;

    const fetchProductData = async () => {
      try {
        const res = await fetch(
          `/api/product/getProductBySkuId?skuId=${skuId}`
        );
        const data = await res.json();

        if (res.ok) {
          setProductData(data);
          setMainImage(data.main_sku.thumbnail_img);
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [skuId]);

  // fetch featured products
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`/api/product/getAllProducts`);
        const data = await res.json();
        if (res.ok) setFeaturedProducts(data);
      } catch (err) {
        console.error("Failed to fetch featured products:", err);
      }
    };

    fetchFeatured();
  }, []);

  // addToCart handler (DB + context)
  const addToCartHandler = async (sku_id, quantity = 1, redirect = false) => {
    try {
      await api.post(
        "/user/updateCart",
        { items: [{ sku_id, quantity }] },
        { withCredentials: true }
      );

      addToCart(sku_id, quantity);

      if (redirect) router.push("/cart");
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  if (loading) return <Loading />;
  if (!productData)
    return <p className="text-center mt-20">Product not found</p>;

  const { product_name, product_description, category_name, main_sku } =
    productData;

  const allImages = [main_sku.thumbnail_img, ...(main_sku.side_imgs || [])];

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Product Images */}
          <div className="px-5 lg:px-16 xl:px-20">
            <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4">
              <Image
                src={mainImage}
                alt={product_name}
                className="w-full h-auto object-cover mix-blend-multiply"
                width={1280}
                height={720}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {allImages.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setMainImage(image)}
                  className="cursor-pointer rounded-lg overflow-hidden bg-gray-500/10"
                >
                  <Image
                    src={image}
                    alt={`product-${index}`}
                    className="w-full h-auto object-cover mix-blend-multiply"
                    width={1280}
                    height={720}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-medium text-gray-800/90 mb-4">
              {product_name}
            </h1>

            <p className="text-gray-600 mt-3">{product_description}</p>

            <p className="text-3xl font-medium mt-6">
              ₹{main_sku.SP}
              <span className="text-base font-normal text-gray-800/60 line-through ml-2">
                ₹{main_sku.MRP}
              </span>
            </p>

            <hr className="bg-gray-600 my-6" />

            <div className="overflow-x-auto">
              <table className="table-auto border-collapse w-full max-w-72">
                <tbody>
                  <tr>
                    <td className="text-gray-600 font-medium">Color</td>
                    <td className="text-gray-800/50 ">
                      {main_sku.variant_values.color}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium">Storage</td>
                    <td className="text-gray-800/50 ">
                      {main_sku.variant_values.storage}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium">RAM</td>
                    <td className="text-gray-800/50 ">
                      {main_sku.variant_values.ram}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium">Category</td>
                    <td className="text-gray-800/50">{category_name}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium">Stock</td>
                    <td className="text-gray-800/50">{main_sku.left_stock}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Buttons */}
            <div className="flex items-center mt-10 gap-4">
              <button
                onClick={() => addToCartHandler(main_sku._id)}
                className="w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition"
              >
                Add to Cart
              </button>
              <button
                onClick={() => addToCartHandler(main_sku._id, 1, true)}
                className="w-full py-3.5 bg-orange-500 text-white hover:bg-orange-600 transition"
              >
                Buy now
              </button>
            </div>
          </div>
        </div>

        {/* Featured Products */}
        {featuredProducts?.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center mb-4 mt-16">
              <p className="text-3xl font-medium">
                Featured{" "}
                <span className="font-medium text-orange-600">Products</span>
              </p>
              <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
              {featuredProducts.slice(0, 5).map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Product;
