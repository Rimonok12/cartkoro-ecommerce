"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import ProductCard from "@/components/ProductCard";
import SuccessModal from "@/components/SuccessModal"; // <-- ensure this path is correct
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

// Check if a sku is already present in the cart
const isInCart = (skuId, cart) =>
  !!cart?.items?.some((i) => String(i.sku_id) === String(skuId));

export default function Product() {
  const router = useRouter();
  const { currency, cartData, userData, addToCart } = useAppContext();
  const { skuId } = router.query;
  console.log("cartData::", cartData);

  const [loading, setLoading] = useState(true);

  // product-level
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");

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

  // success modal + local cart-added state
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [skuAdded, setSkuAdded] = useState(false); // flips to true after add or when already in cart

  const handleSuccessOK = () => {
    setSuccessOpen(false);
    router.push("/cart");
  };

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
        console.log("data::", data);
        setSelectedSku(current);
        setMainImage(current?.thumbnail_img || null);
        setProductName(data?.product_name ?? "");
        setProductDesc(data?.product_description ?? "");
        setCategoryName(data?.category_name ?? "");
        setCategoryId(data?.category_id ?? "");
        setSkuAdded(false); // reset when switching SKUs/products; will resync below
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
    if (categoryId) {
      (async () => {
        try {
          const res = await fetch(
            `/api/product/getAllProducts?categoryId=${categoryId}`
          );
          const data = await res.json();
          if (res.ok) setFeaturedProducts(data);
        } catch {}
      })();
    }
  }, [categoryId]);

  /* ------------- variant option sets (use frozen orders) ------------- */
  const optionSets = useMemo(
    () => ({
      colors: orderColors,
      storages: orderStorages,
      rams: orderRams,
    }),
    [orderColors, orderStorages, orderRams]
  );

  /* ------------- helpers to find/select SKUs ------------- */
  // Preferred: return an IN-STOCK match; if none and allowOOS=true, return the first match (OOS).
  const findSku = (sel, opts = { allowOOS: false }) => {
    const matches = skus.filter((s) => {
      const v = s.variant_values || {};
      return (
        (sel.color == null || v.color === sel.color) &&
        (sel.storage == null || v.storage === sel.storage) &&
        (sel.ram == null || v.ram === sel.ram)
      );
    });
    const inStock = matches.find((m) => Number(m?.left_stock ?? 0) > 0);
    if (inStock) return inStock;
    return opts.allowOOS ? matches[0] || null : null;
  };

  const onPickVariant = (patch) => {
    if (!selectedSku) return;
    const cur = selectedSku.variant_values || {};
    const nextSel = {
      color: patch.color ?? cur.color ?? null,
      storage: patch.storage ?? cur.storage ?? null,
      ram: patch.ram ?? cur.ram ?? null,
    };
    // Select even if OOS (so users can view that variant), buttons will handle disabling.
    const sku = findSku(nextSel, { allowOOS: true });
    if (sku) {
      setSelectedSku(sku);
      setMainImage(sku.thumbnail_img || mainImage);
      router.replace(
        { pathname: router.pathname, query: { skuId: sku._id } },
        undefined,
        { shallow: true }
      );
    }
  };

  // For chips: show dim state when that option has NO in-stock SKU with current partial selection.
  const colorHasStock = (color) =>
    !!findSku(
      {
        color,
        storage: selectedSku?.variant_values?.storage,
        ram: selectedSku?.variant_values?.ram,
      },
      { allowOOS: false }
    );
  const storageHasStock = (storage) =>
    !!findSku(
      {
        color: selectedSku?.variant_values?.color,
        storage,
        ram: selectedSku?.variant_values?.ram,
      },
      { allowOOS: false }
    );
  const ramHasStock = (ram) =>
    !!findSku(
      {
        color: selectedSku?.variant_values?.color,
        storage: selectedSku?.variant_values?.storage,
        ram,
      },
      { allowOOS: false }
    );

  /* ------------- keep skuAdded synced with cart ------------- */
  useEffect(() => {
    if (!selectedSku) return;
    setSkuAdded(isInCart(selectedSku._id, cartData));
  }, [selectedSku, cartData]);

  /* ------------- cart ------------- */
  const addToCartHandler = async (sku_id, quantity = 1, redirect = false) => {
    // Block add-to-cart when out of stock (selected SKU)
    if (!selectedSku || Number(selectedSku.left_stock ?? 0) <= 0) return;

    // If already in cart, don't add again
    if (isInCart(sku_id, cartData)) {
      setSkuAdded(true);
      setSuccessMsg("This item is already in your cart.");
      setSuccessOpen(true);
      if (redirect) router.push("/cart");
      return;
    }

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

      if (redirect) {
        router.push("/cart");
      } else {
        setSkuAdded(true);
        setSuccessMsg("Item added to cart successfully.");
        setSuccessOpen(true);
      }
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

  const isOutOfStock = !selectedSku || Number(selectedSku.left_stock ?? 0) <= 0;

  // discount % (green text)
  const hasMrp = Number(selectedSku?.MRP) > 0;
  const hasSp = Number(selectedSku?.SP) > 0;
  const percentOff =
    hasMrp && hasSp
      ? Math.round(
          ((Number(selectedSku.MRP) - Number(selectedSku.SP)) /
            Number(selectedSku.MRP)) *
            100
        )
      : 0;

  return (
    <>
      <Navbar />

      {/* Success Modal */}
      {/* <SuccessModal open={successOpen} message={successMsg} onOK={handleSuccessOK} /> */}

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

            <p className="text-3xl font-medium mt-2 flex items-baseline gap-3">
              <span>
                {currency} {selectedSku?.SP}
              </span>
              {selectedSku?.MRP ? (
                <span className="text-base font-normal text-gray-800/60 line-through">
                  {currency} {selectedSku.MRP}
                </span>
              ) : null}
              {percentOff > 0 && (
                <span
                  className="text-base font-semibold"
                  style={{ color: "#16a34a" }}
                >
                  {percentOff}% off
                </span>
              )}
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
                        // find a SKU just to show a thumbnail (allow OOS)
                        const skuForColor =
                          findSku(
                            {
                              color,
                              storage: selectedSku?.variant_values?.storage,
                              ram: selectedSku?.variant_values?.ram,
                            },
                            { allowOOS: true }
                          ) || findSku({ color }, { allowOOS: true });

                        const thumb =
                          skuForColor?.thumbnail_img ||
                          selectedSku.thumbnail_img;

                        const active =
                          color === selectedSku?.variant_values?.color;
                        const hasStock = colorHasStock(color); // for dim state only

                        return (
                          <button
                            key={color}
                            onClick={() => onPickVariant({ color })}
                            title={color}
                            className={cx(
                              "rounded-lg overflow-hidden border w-20 h-16 flex items-center justify-center",
                              active
                                ? "border-blue-600 ring-2 ring-blue-600"
                                : "border-gray-300",
                              !hasStock && "opacity-40"
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
                        const hasStock = storageHasStock(s);
                        return (
                          <button
                            key={s}
                            onClick={() => onPickVariant({ storage: s })}
                            className={cx(
                              "px-4 py-2 rounded-md border text-base font-semibold",
                              active
                                ? "border-blue-600 text-blue-600"
                                : "border-gray-300 text-gray-900",
                              !hasStock && "opacity-40"
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
                        const hasStock = ramHasStock(r);
                        return (
                          <button
                            key={r}
                            onClick={() => onPickVariant({ ram: r })}
                            className={cx(
                              "px-4 py-2 rounded-md border text-base font-semibold",
                              active
                                ? "border-blue-600 text-blue-600"
                                : "border-gray-300 text-gray-900",
                              !hasStock && "opacity-40"
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
              <table className="table-auto border-collapse w/full max-w-72">
                <tbody>
                  <tr>
                    <td className="text-gray-600 font-medium pr-4">
                      Category{" "}
                    </td>
                    <td className="text-gray-800/70">{categoryName}</td>
                  </tr>

                  {isOutOfStock ? (
                    <tr>
                      <td className="text-gray-600 font-medium">Stock</td>
                      <td className="text-red-600 font-medium">Out of stock</td>
                    </tr>
                  ) : (
                    selectedSku?.left_stock > 0 &&
                    selectedSku?.left_stock < 10 && (
                      <tr>
                        <td className="text-gray-600 font-medium">Stock</td>
                        <td className="text-gray-800/70">
                          <span style={{ color: "red" }}>
                            Only {selectedSku.left_stock} Left, hurry up!
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Buttons */}
            <div className="flex items-center mt-8 gap-4">
              {/* Add to Cart -> Go to Cart switch */}
              {skuAdded ? (
                <button
                  onClick={() => router.push("/cart")}
                  className={cx(
                    "w-full py-3.5 bg-green-500 text-white hover:bg-green-600 transition rounded"
                  )}
                >
                  Go to Cart
                </button>
              ) : (
                <button
                  onClick={() => addToCartHandler(selectedSku._id)}
                  className={cx(
                    "w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition rounded",
                    isOutOfStock && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isOutOfStock}
                >
                  Add to Cart
                </button>
              )}

              <button
                onClick={() => addToCartHandler(selectedSku._id, 1, true)}
                className={cx(
                  "w-full py-3.5 bg-orange-500 text-white hover:bg-orange-600 transition rounded",
                  isOutOfStock && "opacity-50 cursor-not-allowed"
                )}
                disabled={isOutOfStock}
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
