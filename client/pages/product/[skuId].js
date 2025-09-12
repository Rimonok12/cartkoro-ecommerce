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

  /* ------------- cart ------------- */
  const addToCartHandler = async (sku_id, quantity = 1, redirect = false) => {
    // Block add-to-cart when out of stock (selected SKU)
    if (!selectedSku || Number(selectedSku.left_stock ?? 0) <= 0) return;

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

  const isOutOfStock = !selectedSku || Number(selectedSku.left_stock ?? 0) <= 0;

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

// better seo code_________________

// pages/product/[skuId].jsx
// import { useEffect, useMemo, useState } from "react";
// import Head from "next/head";
// import { useRouter } from "next/router";
// import Image from "next/image";

// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import Loading from "@/components/Loading";
// import ProductCard from "@/components/ProductCard";
// import { useAppContext } from "@/context/AppContext";
// import api from "@/lib/axios";

// /* ---------------- helpers ---------------- */
// const cx = (...c) => c.filter(Boolean).join(" ");
// const inr = (n) =>
//   new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
// const emi = (amount, months = 12) => Math.ceil((amount || 0) / months);

// // Normalize variant keys so UI can rely on .variant_values.color/storage/ram
// const normalizeSku = (s) => {
//   const v = s?.variant_values || {};
//   const vv = {
//     color: v.color ?? v.Color ?? null,
//     storage: v.storage ?? v.Storage ?? v.ROM ?? null,
//     ram: v.ram ?? v.RAM ?? v.memory ?? null,
//   };
//   const left =
//     typeof s?.initial_stock === "number" && typeof s?.sold_stock === "number"
//       ? s.initial_stock - s.sold_stock
//       : s?.left_stock;
//   return { ...s, variant_values: vv, left_stock: left };
// };

// async function fetchProductBySkuIdDirect(skuId, baseUrl) {
//   const url = new URL(
//     `/api/product/getProductBySkuId?skuId=${encodeURIComponent(skuId)}`,
//     baseUrl
//   ).toString();
//   const res = await fetch(url);
//   if (!res.ok) return null;
//   const data = await res.json();

//   const main = data?.main_sku ? normalizeSku(data.main_sku) : null;
//   const others = Array.isArray(data?.other_skus)
//     ? data.other_skus.map(normalizeSku)
//     : [];
//   const skus = [main, ...others].filter(Boolean);

//   return {
//     product_name: data?.product_name ?? "",
//     product_description: data?.product_description ?? "",
//     category_name: data?.category_name ?? "",
//     category_id: data?.category_id ?? "",
//     skus,
//   };
// }

// export default function Product({ productSSR, initialSkuId, canonicalSkuId }) {
//   const router = useRouter();
//   const { currency, userData, addToCart } = useAppContext();

//   const [loading, setLoading] = useState(false);

//   // product-level
//   const [productName, setProductName] = useState(productSSR.product_name || "");
//   const [productDesc, setProductDesc] = useState(
//     productSSR.product_description || ""
//   );
//   const [categoryName, setCategoryName] = useState(
//     productSSR.category_name || ""
//   );
//   const [categoryId, setCategoryId] = useState(productSSR.category_id || "");

//   // sku data (stable order from server)
//   const [skus, setSkus] = useState(productSSR.skus || []);
//   const [selectedSku, setSelectedSku] = useState(
//     (productSSR.skus || []).find(
//       (s) => String(s?._id) === String(initialSkuId)
//     ) ||
//       productSSR.skus?.[0] ||
//       null
//   );
//   const [mainImage, setMainImage] = useState(
//     selectedSku?.thumbnail_img || null
//   );

//   // first-render option orders (stable across variant changes)
//   const uniq = (xs) => [...new Set(xs.filter(Boolean))];
//   const [orderColors] = useState(() =>
//     uniq((productSSR.skus || []).map((s) => s?.variant_values?.color))
//   );
//   const [orderStorages] = useState(() =>
//     uniq((productSSR.skus || []).map((s) => s?.variant_values?.storage))
//   );
//   const [orderRams] = useState(() =>
//     uniq((productSSR.skus || []).map((s) => s?.variant_values?.ram))
//   );

//   // featured
//   const [featuredProducts, setFeaturedProducts] = useState([]);

//   /* ---------------------------------------------------------
//    * REFRESH from the SAME endpoint when SKU in URL changes
//    * (navigating sibling variants or deep-linking)
//    * --------------------------------------------------------- */
//   useEffect(() => {
//     const { skuId } = router.query || {};
//     if (!skuId) return;

//     // If it's within the same product, we can switch locally,
//     // but we also refetch to ensure SP/MRP/stock stay fresh.
//     const baseUrl =
//       process.env.NEXT_PUBLIC_SITE_URL ||
//       process.env.SITE_URL ||
//       (typeof window !== "undefined"
//         ? window.location.origin
//         : "http://localhost:3000");

//     let ignore = false;
//     (async () => {
//       setLoading(true);
//       const product = await fetchProductBySkuIdDirect(skuId, baseUrl);
//       if (!product || ignore) {
//         setLoading(false);
//         return;
//       }

//       // Keep server-provided order, replace whole product bundle
//       setSkus(product.skus || []);
//       setProductName(product.product_name || "");
//       setProductDesc(product.product_description || "");
//       setCategoryName(product.category_name || "");
//       setCategoryId(product.category_id || "");

//       const match =
//         (product.skus || []).find((s) => String(s._id) === String(skuId)) ||
//         product.skus?.[0] ||
//         null;

//       setSelectedSku(match);
//       setMainImage(match?.thumbnail_img || null);
//       setLoading(false);
//     })();

//     return () => {
//       ignore = true;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [router.query?.skuId]);

//   /* ---------------- (Optional) Refresh on tab focus ---------------- */
//   useEffect(() => {
//     const onFocus = async () => {
//       const skuId = router.query?.skuId || initialSkuId;
//       if (!skuId) return;

//       const baseUrl =
//         process.env.NEXT_PUBLIC_SITE_URL ||
//         process.env.SITE_URL ||
//         (typeof window !== "undefined"
//           ? window.location.origin
//           : "http://localhost:3000");

//       const product = await fetchProductBySkuIdDirect(skuId, baseUrl);
//       if (!product) return;

//       // Merge by _id to maintain selection if arrays reorder
//       const byId = {};
//       (product.skus || []).forEach((s) => (byId[String(s._id)] = s));

//       setSkus((prev) => (product.skus?.length ? product.skus : prev));
//       setSelectedSku((prev) => (prev ? byId[String(prev._id)] || prev : prev));
//     };

//     window.addEventListener("focus", onFocus);
//     return () => window.removeEventListener("focus", onFocus);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /* ------------- featured ------------- */
//   useEffect(() => {
//     let ignore = false;
//     (async () => {
//       if (!categoryId) return;
//       try {
//         const res = await fetch(
//           `/api/product/getAllProducts?categoryId=${encodeURIComponent(
//             categoryId
//           )}`
//         );
//         const data = await res.json();
//         if (res.ok && !ignore) setFeaturedProducts(data);
//       } catch {}
//     })();
//     return () => {
//       ignore = true;
//     };
//   }, [categoryId]);

//   /* ------------- variant option sets (use frozen orders) ------------- */
//   const optionSets = useMemo(
//     () => ({
//       colors: orderColors,
//       storages: orderStorages,
//       rams: orderRams,
//     }),
//     [orderColors, orderStorages, orderRams]
//   );

//   /* ------------- helpers to find/select SKUs ------------- */
//   const findSku = (sel, opts = { allowOOS: false }) => {
//     const matches = skus.filter((s) => {
//       const v = s.variant_values || {};
//       return (
//         (sel.color == null || v.color === sel.color) &&
//         (sel.storage == null || v.storage === sel.storage) &&
//         (sel.ram == null || v.ram === sel.ram)
//       );
//     });
//     const inStock = matches.find((m) => Number(m?.left_stock ?? 0) > 0);
//     if (inStock) return inStock;
//     return opts.allowOOS ? matches[0] || null : null;
//   };

//   const onPickVariant = (patch) => {
//     if (!selectedSku) return;
//     const cur = selectedSku.variant_values || {};
//     const nextSel = {
//       color: patch.color ?? cur.color ?? null,
//       storage: patch.storage ?? cur.storage ?? null,
//       ram: patch.ram ?? cur.ram ?? null,
//     };
//     const sku = findSku(nextSel, { allowOOS: true });
//     if (sku) {
//       setSelectedSku(sku);
//       setMainImage(sku.thumbnail_img || mainImage);
//       router.replace(
//         { pathname: router.pathname, query: { skuId: sku._id } },
//         undefined,
//         { shallow: true }
//       );
//     }
//   };

//   const colorHasStock = (color) =>
//     !!findSku(
//       {
//         color,
//         storage: selectedSku?.variant_values?.storage,
//         ram: selectedSku?.variant_values?.ram,
//       },
//       { allowOOS: false }
//     );
//   const storageHasStock = (storage) =>
//     !!findSku(
//       {
//         color: selectedSku?.variant_values?.color,
//         storage,
//         ram: selectedSku?.variant_values?.ram,
//       },
//       { allowOOS: false }
//     );
//   const ramHasStock = (ram) =>
//     !!findSku(
//       {
//         color: selectedSku?.variant_values?.color,
//         storage: selectedSku?.variant_values?.storage,
//         ram,
//       },
//       { allowOOS: false }
//     );

//   /* ------------- cart ------------- */
//   const addToCartHandler = async (sku_id, quantity = 1, redirect = false) => {
//     const isOut = !selectedSku || Number(selectedSku.left_stock ?? 0) <= 0;
//     if (isOut) return;

//     const isAuthed = !!userData && Object.keys(userData).length > 0;
//     if (!isAuthed) {
//       const currentPath = router.asPath || `/product/${sku_id}`;
//       router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
//       return;
//     }

//     try {
//       await api.post(
//         "/user/updateCart",
//         { items: [{ sku_id, quantity }] },
//         { withCredentials: true }
//       );
//       addToCart(sku_id, quantity);
//       if (redirect) router.push("/cart");
//     } catch (err) {
//       console.error("Error updating cart:", err);
//     }
//   };

//   /* ------------- render ------------- */
//   if (router.isFallback) return <Loading />;
//   if (!selectedSku)
//     return <p className="text-center mt-20">Product not found</p>;

//   const gallery = [
//     selectedSku.thumbnail_img,
//     ...(selectedSku.side_imgs || []),
//   ].filter(Boolean);

//   const isOutOfStock = !selectedSku || Number(selectedSku.left_stock ?? 0) <= 0;

//   const jsonLd = {
//     "@context": "https://schema.org/",
//     "@type": "Product",
//     name: productName,
//     category: categoryName,
//     description: productDesc,
//     image: gallery,
//     sku: selectedSku?._id,
//     offers: {
//       "@type": "Offer",
//       priceCurrency: (currency || "INR").replace(/[^\w]/g, ""),
//       price: selectedSku?.SP ?? undefined,
//       availability: isOutOfStock
//         ? "https://schema.org/OutOfStock"
//         : "https://schema.org/InStock",
//       url: typeof window !== "undefined" ? window.location.href : undefined,
//     },
//   };

//   return (
//     <>
//       <Head>
//         <title>{productName ? `${productName} | Shop` : "Product"}</title>
//         <meta name="description" content={productDesc?.slice(0, 150)} />
//         <script
//           type="application/ld+json"
//           dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//         />
//         {/* Optional canonical to the main SKU you prefer to index */}
//         {canonicalSkuId && (
//           <link
//             rel="canonical"
//             href={`${
//               (typeof window !== "undefined" && window.location.origin) || ""
//             }/product/${canonicalSkuId}`}
//           />
//         )}
//       </Head>

//       <Navbar />

//       <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
//           {/* Images */}
//           <div className="px-5 lg:px-16 xl:px-20">
//             <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4">
//               {mainImage ? (
//                 <Image
//                   src={mainImage}
//                   alt={productName}
//                   className="w-full h-auto object-cover mix-blend-multiply"
//                   width={1280}
//                   height={720}
//                 />
//               ) : (
//                 <div className="aspect-video w-full bg-gray-100" />
//               )}
//             </div>

//             <div className="grid grid-cols-4 gap-4">
//               {gallery.map((img, i) => (
//                 <button
//                   key={i}
//                   onClick={() => setMainImage(img)}
//                   className={cx(
//                     "rounded-lg overflow-hidden bg-gray-500/10 border",
//                     img === mainImage ? "border-blue-600" : "border-transparent"
//                   )}
//                   aria-label={`thumb-${i}`}
//                 >
//                   <Image
//                     src={img}
//                     alt={`thumb-${i}`}
//                     className="w-full h-auto object-cover mix-blend-multiply"
//                     width={400}
//                     height={225}
//                   />
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Info + variants */}
//           <div className="flex flex-col">
//             <h1 className="text-3xl font-medium text-gray-800/90 mb-2">
//               {productName}
//             </h1>

//             <p className="text-3xl font-medium mt-2">
//               {currency} {selectedSku?.SP}
//               {selectedSku?.MRP ? (
//                 <span className="text-base font-normal text-gray-800/60 line-through ml-2">
//                   {currency} {selectedSku.MRP}
//                 </span>
//               ) : null}
//             </p>

//             <hr className="bg-gray-200 my-6" />

//             {/* ========== selectors (stable order, never re-ordered) ========== */}
//             {(optionSets.colors.length ||
//               optionSets.storages.length ||
//               optionSets.rams.length) > 0 && (
//               <div className="space-y-6">
//                 {/* Color */}
//                 {!!optionSets.colors.length && (
//                   <div className="flex items-start gap-6">
//                     <div className="w-24 shrink-0 text-gray-600 font-medium mt-1">
//                       Color
//                     </div>
//                     <div className="flex gap-4 flex-wrap">
//                       {optionSets.colors.map((color) => {
//                         const skuForColor =
//                           findSku(
//                             {
//                               color,
//                               storage: selectedSku?.variant_values?.storage,
//                               ram: selectedSku?.variant_values?.ram,
//                             },
//                             { allowOOS: true }
//                           ) || findSku({ color }, { allowOOS: true });

//                         const thumb =
//                           skuForColor?.thumbnail_img ||
//                           selectedSku.thumbnail_img;

//                         const active =
//                           color === selectedSku?.variant_values?.color;
//                         const hasStock = colorHasStock(color);

//                         return (
//                           <button
//                             key={color}
//                             onClick={() => onPickVariant({ color })}
//                             title={color}
//                             className={cx(
//                               "rounded-lg overflow-hidden border w-20 h-16 flex items-center justify-center",
//                               active
//                                 ? "border-blue-600 ring-2 ring-blue-600"
//                                 : "border-gray-300",
//                               !hasStock && "opacity-40"
//                             )}
//                           >
//                             {thumb ? (
//                               <Image
//                                 src={thumb}
//                                 alt={color}
//                                 width={160}
//                                 height={120}
//                                 className="w-full h-full object-cover"
//                               />
//                             ) : (
//                               <span className="text-sm px-2">{color}</span>
//                             )}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 {/* Storage */}
//                 {!!optionSets.storages.length && (
//                   <div className="flex items-start gap-6">
//                     <div className="w-24 shrink-0 text-gray-600 font-medium mt-1">
//                       Storage
//                     </div>
//                     <div className="flex gap-3 flex-wrap">
//                       {optionSets.storages.map((s) => {
//                         const active =
//                           s === selectedSku?.variant_values?.storage;
//                         const hasStock = storageHasStock(s);
//                         return (
//                           <button
//                             key={s}
//                             onClick={() => onPickVariant({ storage: s })}
//                             className={cx(
//                               "px-4 py-2 rounded-md border text-base font-semibold",
//                               active
//                                 ? "border-blue-600 text-blue-600"
//                                 : "border-gray-300 text-gray-900",
//                               !hasStock && "opacity-40"
//                             )}
//                           >
//                             {s}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 {/* RAM */}
//                 {!!optionSets.rams.length && (
//                   <div className="flex items-start gap-6">
//                     <div className="w-24 shrink-0 text-gray-600 font-medium mt-1">
//                       RAM
//                     </div>
//                     <div className="flex gap-3 flex-wrap">
//                       {optionSets.rams.map((r) => {
//                         const active = r === selectedSku?.variant_values?.ram;
//                         const hasStock = ramHasStock(r);
//                         return (
//                           <button
//                             key={r}
//                             onClick={() => onPickVariant({ ram: r })}
//                             className={cx(
//                               "px-4 py-2 rounded-md border text-base font-semibold",
//                               active
//                                 ? "border-blue-600 text-blue-600"
//                                 : "border-gray-300 text-gray-900",
//                               !hasStock && "opacity-40"
//                             )}
//                           >
//                             {r}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Small specs */}
//             <div className="overflow-x-auto pt-6">
//               <table className="table-auto border-collapse w-full max-w-72">
//                 <tbody>
//                   <tr>
//                     <td className="text-gray-600 font-medium pr-4">
//                       Category{" "}
//                     </td>
//                     <td className="text-gray-800/70">{categoryName}</td>
//                   </tr>

//                   {isOutOfStock ? (
//                     <tr>
//                       <td className="text-gray-600 font-medium">Stock</td>
//                       <td className="text-red-600 font-medium">Out of stock</td>
//                     </tr>
//                   ) : (
//                     selectedSku?.left_stock > 0 &&
//                     selectedSku?.left_stock < 10 && (
//                       <tr>
//                         <td className="text-gray-600 font-medium">Stock</td>
//                         <td className="text-gray-800/70">
//                           <span style={{ color: "red" }}>
//                             Only {selectedSku.left_stock} Left, hurry up!
//                           </span>
//                         </td>
//                       </tr>
//                     )
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Buttons */}
//             <div className="flex items-center mt-8 gap-4">
//               <button
//                 onClick={() => addToCartHandler(selectedSku._id)}
//                 className={cx(
//                   "w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition rounded",
//                   isOutOfStock && "opacity-50 cursor-not-allowed"
//                 )}
//                 disabled={isOutOfStock}
//               >
//                 Add to Cart
//               </button>
//               <button
//                 onClick={() => addToCartHandler(selectedSku._id, 1, true)}
//                 className={cx(
//                   "w-full py-3.5 bg-orange-500 text-white hover:bg-orange-600 transition rounded",
//                   isOutOfStock && "opacity-50 cursor-not-allowed"
//                 )}
//                 disabled={isOutOfStock}
//               >
//                 Buy now
//               </button>
//             </div>

//             {productDesc && (
//               <>
//                 <hr className="bg-gray-200 my-8" />
//                 <p className="text-gray-700">{productDesc}</p>
//               </>
//             )}
//           </div>
//         </div>

//         {/* Featured */}
//         {featuredProducts?.length > 0 && (
//           <div className="flex flex-col items-center">
//             <div className="flex flex-col items-center mb-4 mt-16">
//               <p className="text-3xl font-medium">
//                 Featured{" "}
//                 <span className="font-medium text-orange-600">Products</span>
//               </p>
//               <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
//             </div>
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
//               {featuredProducts.slice(0, 5).map((p, i) => (
//                 <ProductCard key={i} product={p} />
//               ))}
//             </div>
//           </div>
//         )}
//       </div>

//       <Footer />
//     </>
//   );
// }

// /* ---------------- SSG + ISR ---------------- */
// export async function getStaticPaths() {
//   return {
//     paths: [],
//     fallback: "blocking",
//   };
// }

// export async function getStaticProps(ctx) {
//   const { skuId } = ctx.params || {};
//   if (!skuId) return { notFound: true };

//   const baseUrl =
//     process.env.NEXT_PUBLIC_SITE_URL ||
//     process.env.SITE_URL ||
//     "http://localhost:3000";

//   const product = await fetchProductBySkuIdDirect(skuId, baseUrl);
//   if (!product || !product.skus?.length) return { notFound: true };

//   return {
//     props: {
//       productSSR: product,
//       initialSkuId: skuId,
//       canonicalSkuId: skuId, // customize if you want a single canonical across variants
//     },
//     revalidate: 120, // seconds — tune as needed
//   };
// }
