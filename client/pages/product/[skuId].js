"use client";

import { useEffect, useMemo, useState } from "react";
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
  return { props: { ...essentials.props } };
}

/* ---------------- helpers ---------------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const inr = (n) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
const emi = (amount, months = 12) => Math.ceil((amount || 0) / months);

// Normalize variant keys so UI can rely on .variant_values.color/storage/ram
const normalizeSku = (s) => {
  const v = s?.variant_values || {};
  const vv = {
    color: v.color ?? v.Color ?? null,
    storage: v.storage ?? v.Storage ?? v.ROM ?? null,
    ram: v.ram ?? v.RAM ?? v.memory ?? null,
  };
  const left =
    typeof s?.initial_stock === "number" && typeof s?.sold_stock === "number"
      ? s.initial_stock - s.sold_stock
      : s?.left_stock;
  return { ...s, variant_values: vv, left_stock: left };
};

export default function Product() {
  const router = useRouter();
  const { currency } = useAppContext();
  const { skuId } = router.query;
  const { userData, addToCart } = useAppContext();

  const [loading, setLoading] = useState(true);

  // product-level
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [categoryName, setCategoryName] = useState("");

  // sku data
  const [skus, setSkus] = useState([]); // all sibling SKUs (stable order)
  const [selectedSku, setSelectedSku] = useState(null);
  const [mainImage, setMainImage] = useState(null);

  // first-render option orders (stable across variant changes)
  const [orderColors, setOrderColors] = useState([]);
  const [orderStorages, setOrderStorages] = useState([]);
  const [orderRams, setOrderRams] = useState([]);

  // featured
  const [featuredProducts, setFeaturedProducts] = useState([]);

  /* ------------- load product (or reuse) ------------- */
  useEffect(() => {
    if (!skuId) return;

    (async () => {
      try {
        // If we already have the SKUs and the new skuId belongs to the same product,
        // just switch selection locally and avoid re-fetching (preserves order).
        if (skus.length) {
          const withinSameProduct = skus.some(
            (s) => String(s._id) === String(skuId)
          );
          if (withinSameProduct) {
            const next = skus.find((s) => String(s._id) === String(skuId));
            if (next) {
              setSelectedSku(next);
              setMainImage(next.thumbnail_img || null);
              setLoading(false);
              return;
            }
          }
        }

        // Otherwise fetch fresh (first load, or user navigated to a different product)
        setLoading(true);
        const res = await fetch(
          `/api/product/getProductBySkuId?skuId=${encodeURIComponent(skuId)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Fetch failed");

        const main = data?.main_sku ? normalizeSku(data.main_sku) : null;
        const others = Array.isArray(data?.other_skus)
          ? data.other_skus.map(normalizeSku)
          : [];

        // Build array ONCE then freeze its order
        const arr = [main, ...others].filter(Boolean);

        // Capture first-render option orders (stable)
        const uniq = (xs) => [...new Set(xs.filter(Boolean))];
        setOrderColors(uniq(arr.map((s) => s?.variant_values?.color)));
        setOrderStorages(uniq(arr.map((s) => s?.variant_values?.storage)));
        setOrderRams(uniq(arr.map((s) => s?.variant_values?.ram)));

        setSkus(arr); // <- keep this array as-is (do not reorder later)
        const current =
          arr.find((s) => String(s?._id) === String(skuId)) || arr[0] || null;

        setSelectedSku(current);
        setMainImage(current?.thumbnail_img || null);
        setProductName(data?.product_name ?? "");
        setProductDesc(data?.product_description ?? "");
        setCategoryName(data?.category_name ?? "");
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skuId]); // safe: we guard above to not refetch on shallow variant changes

  /* ------------- featured ------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/product/getAllProducts`);
        const data = await res.json();
        if (res.ok) setFeaturedProducts(data);
      } catch {}
    })();
  }, []);

  /* ------------- variant option sets (use frozen orders) ------------- */
  const optionSets = useMemo(
    () => ({
      colors: orderColors,
      storages: orderStorages,
      rams: orderRams,
    }),
    [orderColors, orderStorages, orderRams]
  );

  /* ------------- helpers to find an SKU for a selection ------------- */
  const findSku = (sel) => {
    return (
      skus.find((s) => {
        const v = s.variant_values || {};
        return (
          (sel.color == null || v.color === sel.color) &&
          (sel.storage == null || v.storage === sel.storage) &&
          (sel.ram == null || v.ram === sel.ram)
        );
      }) || null
    );
  };

  const onPickVariant = (patch) => {
    if (!selectedSku) return;
    const cur = selectedSku.variant_values || {};
    const nextSel = {
      color: patch.color ?? cur.color ?? null,
      storage: patch.storage ?? cur.storage ?? null,
      ram: patch.ram ?? cur.ram ?? null,
    };
    const sku = findSku(nextSel);
    if (sku) {
      setSelectedSku(sku);
      setMainImage(sku.thumbnail_img || mainImage);
      // reflect in URL, but we WON'T refetch because we already have all SKUs
      router.replace(
        { pathname: router.pathname, query: { skuId: sku._id } },
        undefined,
        { shallow: true }
      );
    }
  };

  // enable/disable impossible combos
  const isColorEnabled = (color) =>
    !!findSku({
      color,
      storage: selectedSku?.variant_values?.storage,
      ram: selectedSku?.variant_values?.ram,
    });
  const isStorageEnabled = (storage) =>
    !!findSku({
      color: selectedSku?.variant_values?.color,
      storage,
      ram: selectedSku?.variant_values?.ram,
    });
  const isRamEnabled = (ram) =>
    !!findSku({
      color: selectedSku?.variant_values?.color,
      storage: selectedSku?.variant_values?.storage,
      ram,
    });

  /* ------------- cart ------------- */
  const addToCartHandler = async (sku_id, quantity = 1, redirect = false) => {
    const isAuthed = !!userData && Object.keys(userData).length > 0;
    if (!isAuthed) {
      const currentPath = router.asPath || `/product/${sku_id}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

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

  /* ------------- render ------------- */
  if (loading) return <Loading />;
  if (!selectedSku)
    return <p className="text-center mt-20">Product not found</p>;

  const gallery = [
    selectedSku.thumbnail_img,
    ...(selectedSku.side_imgs || []),
  ].filter(Boolean);

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Images */}
          <div className="px-5 lg:px-16 xl:px-20">
            <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={productName}
                  className="w-full h-auto object-cover mix-blend-multiply"
                  width={1280}
                  height={720}
                />
              ) : (
                <div className="aspect-video w-full bg-gray-100" />
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImage(img)}
                  className={cx(
                    "rounded-lg overflow-hidden bg-gray-500/10 border",
                    img === mainImage ? "border-blue-600" : "border-transparent"
                  )}
                  aria-label={`thumb-${i}`}
                >
                  <Image
                    src={img}
                    alt={`thumb-${i}`}
                    className="w-full h-auto object-cover mix-blend-multiply"
                    width={400}
                    height={225}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info + variants */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-medium text-gray-800/90 mb-2">
              {productName}
            </h1>

            <p className="text-3xl font-medium mt-2">
              {currency} {selectedSku?.SP}
              {selectedSku?.MRP ? (
                <span className="text-base font-normal text-gray-800/60 line-through ml-2">
                  {currency} {selectedSku.MRP}
                </span>
              ) : null}
            </p>

            <hr className="bg-gray-200 my-6" />

            {/* ========== selectors (stable order, never re-ordered) ========== */}
            {(optionSets.colors.length ||
              optionSets.storages.length ||
              optionSets.rams.length) > 0 && (
              <div className="space-y-6">
                {/* Color */}
                {!!optionSets.colors.length && (
                  <div className="flex items-start gap-6">
                    <div className="w-24 shrink-0 text-gray-600 font-medium mt-1">
                      Color
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      {optionSets.colors.map((color) => {
                        const skuForColor =
                          findSku({
                            color,
                            storage: selectedSku?.variant_values?.storage,
                            ram: selectedSku?.variant_values?.ram,
                          }) || findSku({ color });

                        const thumb =
                          skuForColor?.thumbnail_img ||
                          selectedSku.thumbnail_img;

                        const active =
                          color === selectedSku?.variant_values?.color;
                        const enabled = isColorEnabled(color);

                        return (
                          <button
                            key={color}
                            onClick={() => enabled && onPickVariant({ color })}
                            title={color}
                            className={cx(
                              "rounded-lg overflow-hidden border w-20 h-16 flex items-center justify-center",
                              active
                                ? "border-blue-600 ring-2 ring-blue-600"
                                : "border-gray-300",
                              !enabled &&
                                "opacity-40 cursor-not-allowed border-dashed"
                            )}
                          >
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt={color}
                                width={160}
                                height={120}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm px-2">{color}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Storage */}
                {!!optionSets.storages.length && (
                  <div className="flex items-start gap-6">
                    <div className="w-24 shrink-0 text-gray-600 font-medium mt-1">
                      Storage
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {optionSets.storages.map((s) => {
                        const active =
                          s === selectedSku?.variant_values?.storage;
                        const enabled = isStorageEnabled(s);
                        return (
                          <button
                            key={s}
                            onClick={() =>
                              enabled && onPickVariant({ storage: s })
                            }
                            className={cx(
                              "px-4 py-2 rounded-md border text-base font-semibold",
                              active
                                ? "border-blue-600 text-blue-600"
                                : "border-gray-300 text-gray-900",
                              !enabled &&
                                "opacity-40 cursor-not-allowed border-dashed"
                            )}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* RAM */}
                {!!optionSets.rams.length && (
                  <div className="flex items-start gap-6">
                    <div className="w-24 shrink-0 text-gray-600 font-medium mt-1">
                      RAM
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {optionSets.rams.map((r) => {
                        const active = r === selectedSku?.variant_values?.ram;
                        const enabled = isRamEnabled(r);
                        return (
                          <button
                            key={r}
                            onClick={() => enabled && onPickVariant({ ram: r })}
                            className={cx(
                              "px-4 py-2 rounded-md border text-base font-semibold",
                              active
                                ? "border-blue-600 text-blue-600"
                                : "border-gray-300 text-gray-900",
                              !enabled &&
                                "opacity-40 cursor-not-allowed border-dashed"
                            )}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Small specs */}
            <div className="overflow-x-auto pt-6">
              <table className="table-auto border-collapse w-full max-w-72">
                <tbody>
                  <tr>
                    <td className="text-gray-600 font-medium">Category</td>
                    <td className="text-gray-800/70">{categoryName}</td>
                  </tr>

                  {selectedSku?.left_stock > 0 &&
                    selectedSku?.left_stock < 10 && (
                      <tr>
                        <td className="text-gray-600 font-medium">Stock</td>

                        <td className="text-gray-800/70">
                          <span style={{ color: "red" }}>
                            Only {selectedSku.left_stock} Left, hurry up!
                          </span>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            {/* Buttons */}
            <div className="flex items-center mt-8 gap-4">
              <button
                onClick={() => addToCartHandler(selectedSku._id)}
                className="w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition rounded"
              >
                Add to Cart
              </button>
              <button
                onClick={() => addToCartHandler(selectedSku._id, 1, true)}
                className="w-full py-3.5 bg-orange-500 text-white hover:bg-orange-600 transition rounded"
              >
                Buy now
              </button>
            </div>

            {productDesc && (
              <>
                <hr className="bg-gray-200 my-8" />
                <p className="text-gray-700">{productDesc}</p>
              </>
            )}
          </div>
        </div>

        {/* Featured */}
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
              {featuredProducts.slice(0, 5).map((p, i) => (
                <ProductCard key={i} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
