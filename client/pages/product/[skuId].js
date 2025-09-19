// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/router";
// import Image from "next/image";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import Loading from "@/components/Loading";
// import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";
// import { RotateCcw } from "lucide-react";
// import ProductCard from "@/components/ProductCard";
// import SuccessModal from "@/components/SuccessModal"; // ensure this path is correct
// import { useAppContext } from "@/context/AppContext";
// import api from "@/lib/axios";
// import { essentialsOnLoad } from "@/lib/ssrHelper";

// export async function getServerSideProps(context) {
//   const essentials = await essentialsOnLoad(context);
//   return { props: { ...essentials.props } };
// }

// /* ---------------- helpers ---------------- */
// const cx = (...c) => c.filter(Boolean).join(" ");
// const inr = (n) =>
//   new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
// const emi = (amount, months = 12) => Math.ceil((amount || 0) / months);

// const capitalize = (s) =>
//   typeof s === "string" && s.length
//     ? s.charAt(0).toUpperCase() + s.slice(1)
//     : s;

// const getVar = (v, k) => {
//   if (!v) return undefined;
//   const lower = k.toLowerCase();
//   const cap = k.charAt(0).toUpperCase() + k.slice(1);
//   return v[k] ?? v[lower] ?? v[cap];
// };

// const normKey = (k) => (k ? String(k).toLowerCase() : k);
// const getValCI = (obj = {}, k) => {
//   const nk = normKey(k);
//   for (const [kk, vv] of Object.entries(obj)) {
//     if (normKey(kk) === nk) return vv;
//   }
//   return undefined;
// };
// const eqVal = (a, b) => String(a) === String(b); // tolerate "128" vs 128

// /**
//  * Parse variant metadata coming from /api/product/getVariants/:categoryId
//  * and fall back to inferring from SKUs if needed.
//  *
//  * Accepts several shapes:
//  *  A) { variant_keys: ["Color","Size"], orders: { Color:[...], Size:[...] } }
//  *  B) [ { name:"Color", values:[...] }, { name:"Size", values:[...] } ]
//  *  C) ["Color","Size"]
//  */
// const parseVariantMeta = (raw, skus) => {
//   const uniq = (xs) => [...new Set(xs.filter(Boolean))];

//   const inferFromSkus = (keys) => {
//     const allKeys =
//       keys && keys.length
//         ? keys
//         : uniq(
//             skus.flatMap((s) => Object.keys(s?.variant_values || {})).filter(Boolean)
//           );
//     const orders = {};
//     allKeys.forEach((k) => {
//       orders[k] = uniq(skus.map((s) => s?.variant_values?.[k]));
//     });
//     return { keys: allKeys, orders };
//   };

//   if (!raw) return inferFromSkus([]);

//   if (raw.variant_keys && Array.isArray(raw.variant_keys)) {
//     const keys = raw.variant_keys;
//     const base = inferFromSkus(keys);
//     const orders =
//       raw.orders && typeof raw.orders === "object" ? { ...base.orders, ...raw.orders } : base.orders;
//     keys.forEach((k) => {
//       if (!orders[k] || !orders[k].length) {
//         orders[k] = base.orders[k] || [];
//       }
//     });
//     return { keys, orders };
//   }

//   if (Array.isArray(raw) && raw.every((x) => x && typeof x === "object" && ("name" in x))) {
//     const keys = raw.map((x) => x.name);
//     const orders = {};
//     const base = inferFromSkus(keys);
//     raw.forEach((x) => {
//       orders[x.name] =
//         Array.isArray(x.values) && x.values.length ? x.values : base.orders[x.name] || [];
//     });
//     keys.forEach((k) => {
//       if (!orders[k] || !orders[k].length) orders[k] = base.orders[k] || [];
//     });
//     return { keys, orders };
//   }

//   if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
//     return inferFromSkus(raw);
//   }

//   return inferFromSkus([]);
// };

// // Normalize variant keys AND preserve all arbitrary keys.
// const normalizeSku = (s) => {
//   const raw = s?.variant_values || {};
//   const vv = { ...raw };
//   if (vv.Color != null && vv.color == null) vv.color = vv.Color;
//   if (vv.Storage != null && vv.storage == null) vv.storage = vv.Storage;
//   if (vv.ROM != null && vv.storage == null) vv.storage = vv.ROM;
//   if (vv.RAM != null && vv.ram == null) vv.ram = vv.RAM;
//   if (vv.memory != null && vv.ram == null) vv.ram = vv.memory;
//   if (vv.Size != null && vv.size == null) vv.size = vv.Size;

//   const left =
//     typeof s?.initial_stock === "number" && typeof s?.sold_stock === "number"
//       ? s.initial_stock - s.sold_stock
//       : s?.left_stock;

//   return {
//     ...s,
//     variant_values: vv,
//     left_stock: left,
//   };
// };

// // Check if a sku is already present in the cart
// const isInCart = (skuId, cart) =>
//   !!cart?.items?.some((i) => String(i.sku_id) === String(skuId));

// export default function Product() {
//   const router = useRouter();
//   const { currency, cartData, userData, addToCart } = useAppContext();
//   const { skuId } = router.query;

//   const [loading, setLoading] = useState(true);

//   // product-level
//   const [productName, setProductName] = useState("");
//   const [productDesc, setProductDesc] = useState("");
//   const [brandName, setBrandName] = useState("");
//   const [categoryName, setCategoryName] = useState("");
//   const [sellerName, setSellerName] = useState("");
//   const [categoryId, setCategoryId] = useState("");
//   const [productDetails, setProductDetails] = useState([]); // key/value details

//   // sku data
//   const [skus, setSkus] = useState([]); // all sibling SKUs (stable order)
//   const [selectedSku, setSelectedSku] = useState(null);
//   const [mainImage, setMainImage] = useState(null);

//   // dynamic variant schema from API (keys + value orders)
//   const [variantKeys, setVariantKeys] = useState([]);     // e.g. ["Color","Size"]
//   const [variantOrders, setVariantOrders] = useState({}); // e.g. { Color:[...], Size:[...] }

//   // featured
//   const [featuredProducts, setFeaturedProducts] = useState([]);

//   // success modal + local cart-added state
//   const [successOpen, setSuccessOpen] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");
//   const [skuAdded, setSkuAdded] = useState(false);

//   // UI: collapse/expand product details (right column)
//   const [detailsOpen, setDetailsOpen] = useState(false);

//   const handleSuccessOK = () => {
//     setSuccessOpen(false);
//     router.push("/cart");
//   };

//   /* ------------- load product (or reuse) ------------- */
//   useEffect(() => {
//     if (!skuId) return;

//     (async () => {
//       try {
//         if (skus.length) {
//           const withinSameProduct = skus.some(
//             (s) => String(s._id) === String(skuId)
//           );
//           if (withinSameProduct) {
//             const next = skus.find((s) => String(s._id) === String(skuId));
//             if (next) {
//               setSelectedSku(next);
//               setMainImage(next.thumbnail_img || null);
//               setLoading(false);
//               return;
//             }
//           }
//         }

//         setLoading(true);
//         const res = await fetch(
//           `/api/product/getProductBySkuId?skuId=${encodeURIComponent(skuId)}`
//         );
//         const data = await res.json();
//         if (!res.ok) throw new Error(data?.message || "Fetch failed");

//         const main = data?.main_sku ? normalizeSku(data.main_sku) : null;
//         const others = Array.isArray(data?.other_skus)
//           ? data.other_skus.map(normalizeSku)
//           : [];
//         const arr = [main, ...others].filter(Boolean);

//         setSkus(arr);
//         const current =
//           arr.find((s) => String(s?._id) === String(skuId)) || arr[0] || null;

//         setSelectedSku(current);
//         setMainImage(current?.thumbnail_img || null);
//         setProductName(data?.product_name ?? "");
//         setProductDesc(data?.product_description ?? "");
//         setBrandName(data?.brand_name ?? "");
//         setSellerName(data?.seller_name ?? "");
//         setCategoryName(data?.category_name ?? "");
//         setCategoryId(data?.category_id ?? "");
//         setProductDetails(Array.isArray(data?.product_details) ? data.product_details : []);
//         setSkuAdded(false);
//       } catch (err) {
//         console.error("Failed to fetch product:", err);
//       } finally {
//         setLoading(false);
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [skuId]);

//   /* ------------- variant schema (API-driven) ------------- */
//   useEffect(() => {
//     if (!categoryId || !skus.length) return;
//     (async () => {
//       try {
//         const res = await fetch(
//           `/api/product/getVariants/${encodeURIComponent(categoryId)}`
//         );
//         const raw = await res.json();
//         const meta = parseVariantMeta(raw, skus);

//         const orders = { ...(meta.orders || {}) };
//         (meta.keys || []).forEach((k) => {
//           if (!Array.isArray(orders[k]) || !orders[k].length) {
//             const uniq = (xs) => [...new Set(xs.filter(Boolean))];
//             orders[k] = uniq(skus.map((s) => s?.variant_values?.[k]));
//           }
//         });

//         setVariantKeys(meta.keys || []);
//         setVariantOrders(orders);
//       } catch (e) {
//         const uniq = (xs) => [...new Set(xs.filter(Boolean))];
//         const keys = uniq(
//           skus.flatMap((s) => Object.keys(s?.variant_values || {})).filter(Boolean)
//         );
//         const orders = {};
//         keys.forEach((k) => (orders[k] = uniq(skus.map((s) => s?.variant_values?.[k]))));
//         setVariantKeys(keys);
//         setVariantOrders(orders);
//       }
//     })();
//   }, [categoryId, skus]);

//   /* ------------- featured ------------- */
//   useEffect(() => {
//     if (categoryId) {
//       (async () => {
//         try {
//           const res = await fetch(
//             `/api/product/getAllProducts?categoryId=${categoryId}`
//           );
//           const data = await res.json();
//           if (res.ok) setFeaturedProducts(data);
//         } catch {}
//       })();
//     }
//   }, [categoryId]);

//   /* ------------- helpers to find/select SKUs ------------- */
//   const normalizeKey = (k) => k?.toLowerCase?.();

//   const findSku = (sel, opts = { allowOOS: false }) => {
//     const matches = skus.filter((s) => {
//       const v = s?.variant_values || {};
//       return Object.entries(sel).every(([k, val]) => {
//         if (val == null) return true;
//         return eqVal(getValCI(v, k), val);
//       });
//     });

//     const inStock = matches.find((m) => Number(m?.left_stock ?? 0) > 0);
//     if (inStock) return inStock;
//     return opts.allowOOS ? matches[0] || null : null;
//   };

//   const onPickVariant = (patch) => {
//     if (!selectedSku) return;

//     const cur = selectedSku.variant_values || {};
//     const nextSel = { ...cur, ...patch };

//     let sku = findSku(nextSel, { allowOOS: true });

//     if (!sku) {
//       const [changedKey, changedVal] = Object.entries(patch)[0] || [];
//       if (changedKey != null) {
//         const pool = skus.filter(
//           (s) => eqVal(getValCI(s?.variant_values, changedKey), changedVal)
//         );
//         sku =
//           pool.find((s) => Number(s?.left_stock ?? 0) > 0) ||
//           pool[0] ||
//           null;
//       }
//     }

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

//   const optionHasStock = (key, value) => {
//     const cur = selectedSku?.variant_values || {};
//     const sel = { ...cur, [key]: value };
//     const sku = findSku(sel, { allowOOS: true });
//     return !!(sku && Number(sku.left_stock ?? 0) > 0);
//   };

//   /* ------------- keep skuAdded synced with cart ------------- */
//   useEffect(() => {
//     if (!selectedSku) return;
//     setSkuAdded(isInCart(selectedSku._id, cartData));
//   }, [selectedSku, cartData]);

//   /* ------------- cart ------------- */
//   const addToCartHandler = async (sku_id, quantity = 1, redirect = false) => {
//     if (!selectedSku || Number(selectedSku.left_stock ?? 0) <= 0) return;

//     if (isInCart(sku_id, cartData)) {
//       setSkuAdded(true);
//       setSuccessMsg("This item is already in your cart.");
//       setSuccessOpen(true);
//       if (redirect) router.push("/cart");
//       return;
//     }

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

//       if (redirect) {
//         router.push("/cart");
//       } else {
//         setSkuAdded(true);
//         setSuccessMsg("Item added to cart successfully.");
//         setSuccessOpen(true);
//       }
//     } catch (err) {
//       console.error("Error updating cart:", err);
//     }
//   };

//   /* ------------- render ------------- */
//   if (loading) return <Loading />;
//   if (!selectedSku)
//     return <p className="text-center mt-20">Product not found</p>;

//   const gallery = [
//     selectedSku.thumbnail_img,
//     ...(selectedSku.side_imgs || []),
//   ].filter(Boolean);

//   const isOutOfStock = !selectedSku || Number(selectedSku.left_stock ?? 0) <= 0;

//   // price + discount
//   const hasMrp = Number(selectedSku?.MRP) > 0;
//   const hasSp = Number(selectedSku?.SP) > 0;
//   const percentOff =
//     hasMrp && hasSp
//       ? Math.round(
//           ((Number(selectedSku.MRP) - Number(selectedSku.SP)) /
//             Number(selectedSku.MRP)) *
//             100
//         )
//       : 0;

//   // small specs line like “Fits: Slim | Size: XXL” when available
//   const specLine = (() => {
//     const vv = selectedSku?.variant_values || {};
//     const bits = [];
//     if (vv.Fits || vv.fits) bits.push(`Fits: ${vv.Fits || vv.fits}`);
//     if (vv.Size || vv.size) bits.push(`Size: ${vv.Size || vv.size}`);
//     return bits.join(" | ");
//   })();

//   return (
//     <>
//       <Navbar />

//       {/* <SuccessModal open={successOpen} message={successMsg} onOK={handleSuccessOK} /> */}

//       <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
//           {/* Images (left) */}
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

//           {/* Info + variants + PRODUCT DETAILS (right) */}
//           <div className="flex flex-col">
//             <h1 className="text-3xl font-medium text-gray-800/90 mb-2">
//               {productName}
//             </h1>

//             <p className="text-3xl font-medium mt-3 flex items-baseline gap-3">
//               <span>
//                 {currency} {selectedSku?.SP}
//               </span>
//               {selectedSku?.MRP ? (
//                 <span className="text-base font-normal text-gray-800/60 line-through">
//                   {currency} {selectedSku.MRP}
//                 </span>
//               ) : null}
//               {percentOff > 0 && (
//                 <span
//                   className="text-base font-semibold"
//                   style={{ color: "#16a34a" }}
//                 >
//                   {percentOff}% off
//                 </span>
//               )}
//             </p>

//             <hr className="bg-gray-200 my-6" />

//             {/* ========== dynamic selectors (API-driven) ========== */}
//             {variantKeys?.length > 0 && (
//               <div className="space-y-6">
//                 {[...variantKeys]
//                   .sort((a, b) =>
//                     normKey(a) === "color" ? -1 : normKey(b) === "color" ? 1 : 0
//                   )
//                   .map((key) => {
//                     const fromApi = (variantOrders?.[key] || []).filter(Boolean);
//                     const fromSkus = [
//                       ...new Set(
//                         skus.map((s) => s?.variant_values?.[key]).filter(Boolean)
//                       ),
//                     ];
//                     const uniqueValues = fromApi.length
//                       ? fromApi.filter((v) => fromSkus.includes(v))
//                       : fromSkus;

//                     if (uniqueValues.length <= 1) return null;

//                     const current = selectedSku?.variant_values?.[key];
//                     const isColorLike = key.toLowerCase() === "color";

//                     return (
//                       <div key={key} className="flex items-start gap-6">
//                         <div className="w-24 shrink-0 text-gray-600 font-medium mt-1">
//                           {key.charAt(0).toUpperCase() + key.slice(1)}
//                         </div>

//                         <div
//                           className={
//                             isColorLike
//                               ? "flex gap-4 flex-wrap"
//                               : "flex gap-3 flex-wrap"
//                           }
//                         >
//                           {uniqueValues.map((val) => {
//                             const active = val === current;
//                             const hasStock = optionHasStock(key, val);

//                             let thumb = null;
//                             if (isColorLike) {
//                               const skuForVal =
//                                 findSku(
//                                   { ...selectedSku?.variant_values, [key]: val },
//                                   { allowOOS: true }
//                                 ) || findSku({ [key]: val }, { allowOOS: true });
//                               thumb =
//                                 skuForVal?.thumbnail_img ||
//                                 selectedSku?.thumbnail_img ||
//                                 null;
//                             }

//                             return isColorLike ? (
//                               <button
//                                 key={val}
//                                 onClick={() => onPickVariant({ [key]: val })}
//                                 title={val}
//                                 className={cx(
//                                   "rounded-lg overflow-hidden border w-20 h-16 flex items-center justify-center",
//                                   active
//                                     ? "border-blue-600 ring-2 ring-blue-600"
//                                     : "border-gray-300",
//                                   !hasStock && "opacity-40"
//                                 )}
//                               >
//                                 {thumb ? (
//                                   <Image
//                                     src={thumb}
//                                     alt={val}
//                                     width={160}
//                                     height={120}
//                                     className="w-full h-full object-cover"
//                                   />
//                                 ) : (
//                                   <span className="text-sm px-2">{val}</span>
//                                 )}
//                               </button>
//                             ) : (
//                               <button
//                                 key={val}
//                                 onClick={() => onPickVariant({ [key]: val })}
//                                 className={cx(
//                                   "px-4 py-2 rounded-md border text-base font-semibold",
//                                   active
//                                     ? "border-blue-600 text-blue-600"
//                                     : "border-gray-300 text-gray-900",
//                                   !hasStock && "opacity-40"
//                                 )}
//                               >
//                                 {val}
//                               </button>
//                             );
//                           })}
//                         </div>
//                       </div>
//                     );
//                   })}
//               </div>
//             )}

//             {/* Small specs */}
//             <div className="overflow-x-auto pt-6">
//               <table className="table-auto border-collapse w/full max-w-72">
//                 <tbody>
//                   {brandName && (
//                     <tr>
//                       <td className="text-gray-600 font-medium pr-4">Brand </td>
//                       <td className="text-gray-800/70">{brandName}</td>
//                     </tr>
//                   )}
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

//                   <tr>
//                     <td className="text-gray-600 font-medium pr-4">
//                       Seller{" "}
//                     </td>
//                     <td className="text-gray-800/70">{sellerName}</td>
//                   </tr>

//                 </tbody>
//               </table>
//             </div>

//             {/* ---------- Product Details (RIGHT, collapsible) ---------- */}
//             {Array.isArray(productDetails) && productDetails.length > 0 && (
//               <div className="mt-8">
//                 <button
//                   type="button"
//                   onClick={() => setDetailsOpen((x) => !x)}
//                   className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left"
//                 >
//                   <span className="text-lg font-semibold text-gray-800/90">
//                     Product Details
//                   </span>
//                   <span className="text-2xl leading-none text-gray-600">
//                     {detailsOpen ? "−" : "+"}
//                   </span>
//                 </button>

//                 {detailsOpen && (
//                   <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white">
//                     <table className="w-full table-fixed">
//                       <tbody>
//                         {productDetails.map((d, i) => (
//                           <tr
//                             key={`${d.key}-${i}`}
//                             className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
//                           >
//                             <td className="w-1/3 sm:w-1/4 px-4 py-3 text-gray-600 font-medium align-top capitalize">
//                               {String(d.key || "").trim()}
//                             </td>
//                             <td className="px-4 py-3 text-gray-800/85 align-top">
//                               {String(d.value || "").trim()}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Buttons */}
//             <div className="flex items-center mt-8 gap-4">
//               {skuAdded ? (
//                 <button
//                   onClick={() => router.push("/cart")}
//                   className={cx(
//                     "w-full py-3.5 bg-green-500 text-white hover:bg-green-600 transition rounded"
//                   )}
//                 >
//                   Go to Cart
//                 </button>
//               ) : (
//                 <button
//                   onClick={() => addToCartHandler(selectedSku._id)}
//                   className={cx(
//                     "w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition rounded",
//                     isOutOfStock && "opacity-50 cursor-not-allowed"
//                   )}
//                   disabled={isOutOfStock}
//                 >
//                   Add to Cart
//                 </button>
//               )}

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

//             {/* ===== Feature strip (after buttons) ===== */}
//             <div className="mt-6">
//               <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
//                 <div className="flex items-stretch justify-between divide-x divide-green-200">
//                   {/* Easy Returns */}
//                   <div className="flex items-center gap-3 pr-4">
//                     <RotateCcw className="w-5 h-5 text-green-700" />
//                     <div className="leading-5">
//                       <div className="font-semibold text-gray-800">Easy</div>
//                       <div className="font-semibold text-gray-800">Returns</div>
//                     </div>
//                   </div>

//                   {/* COD Available */}
//                   <div className="flex items-center gap-3 px-4">
//                     {/* inline money icon */}
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       className="w-5 h-5 text-green-700"
//                     >
//                       <rect x="3" y="6" width="18" height="12" rx="2" ry="2" />
//                       <circle cx="12" cy="12" r="2.5" />
//                       <path d="M7 12h.01M17 12h.01" />
//                     </svg>
//                     <div className="leading-5">
//                       <div className="font-semibold text-gray-800">COD</div>
//                       <div className="font-semibold text-gray-800">Available</div>
//                     </div>
//                   </div>

//                   {/* Delivery in 3 Days */}
//                   <div className="flex items-center gap-3 pl-4">
//                     {/* inline truck icon */}
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       className="w-5 h-5 text-green-700"
//                     >
//                       <path d="M3 7h11v8H3z" />
//                       <path d="M14 9h4l3 3v3h-7z" />
//                       <circle cx="7.5" cy="17.5" r="1.5" />
//                       <circle cx="17.5" cy="17.5" r="1.5" />
//                     </svg>
//                     <div className="leading-5">
//                       <div className="font-semibold text-gray-800">Delivery In</div>
//                       <div className="font-semibold text-gray-800">3 Days</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             {/* ===== End feature strip ===== */}
//           </div>
//         </div>

//         {/* ---------- Long Description (below, full width) ---------- */}
//         {productDesc && (
//           <div className="mt-4">
//             <hr className="bg-gray-200 my-8" />
//             <h3 className="text-2xl font-semibold text-gray-800/90 mb-3">
//               Product Description
//             </h3>
//             <p className="text-gray-700 leading-7">{productDesc}</p>
//           </div>
//         )}

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




///////



// "use client";

// import { useEffect, useState, useMemo } from "react";
// import { useRouter } from "next/router";
// import Image from "next/image";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import Loading from "@/components/Loading";
// import { RotateCcw } from "lucide-react";
// import ProductCard from "@/components/ProductCard";
// import SuccessModal from "@/components/SuccessModal";
// import { useAppContext } from "@/context/AppContext";
// import api from "@/lib/axios";
// import { essentialsOnLoad } from "@/lib/ssrHelper";

// export async function getServerSideProps(context) {
//   const essentials = await essentialsOnLoad(context);
//   return { props: { ...essentials.props } };
// }

// /* ---------------- helpers ---------------- */
// const cx = (...c) => c.filter(Boolean).join(" ");
// const getValCI = (obj = {}, k) => {
//   const nk = String(k || "").toLowerCase();
//   for (const [kk, vv] of Object.entries(obj || {})) {
//     if (String(kk).toLowerCase() === nk) return vv;
//   }
//   return undefined;
// };
// const eqVal = (a, b) => String(a) === String(b);

// /* ----- parse variant meta (unchanged behavior) ----- */
// const parseVariantMeta = (raw, skus) => {
//   const uniq = (xs) => [...new Set(xs.filter(Boolean))];
//   const inferFromSkus = (keys) => {
//     const allKeys =
//       keys && keys.length
//         ? keys
//         : uniq(
//             skus.flatMap((s) => Object.keys(s?.variant_values || {})).filter(Boolean)
//           );
//     const orders = {};
//     allKeys.forEach((k) => {
//       orders[k] = uniq(skus.map((s) => s?.variant_values?.[k]));
//     });
//     return { keys: allKeys, orders };
//   };
//   if (!raw) return inferFromSkus([]);
//   if (raw.variant_keys && Array.isArray(raw.variant_keys)) {
//     const keys = raw.variant_keys;
//     const base = inferFromSkus(keys);
//     const orders =
//       raw.orders && typeof raw.orders === "object"
//         ? { ...base.orders, ...raw.orders }
//         : base.orders;
//     keys.forEach((k) => {
//       if (!orders[k] || !orders[k].length) orders[k] = base.orders[k] || [];
//     });
//     return { keys, orders };
//   }
//   if (Array.isArray(raw) && raw.every((x) => x && typeof x === "object" && "name" in x)) {
//     const keys = raw.map((x) => x.name);
//     const orders = {};
//     const base = inferFromSkus(keys);
//     raw.forEach((x) => {
//       orders[x.name] =
//         Array.isArray(x.values) && x.values.length ? x.values : base.orders[x.name] || [];
//     });
//     keys.forEach((k) => {
//       if (!orders[k] || !orders[k].length) orders[k] = base.orders[k] || [];
//     });
//     return { keys, orders };
//   }
//   if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
//     return inferFromSkus(raw);
//   }
//   return inferFromSkus([]);
// };

// /* ----- normalize sku (unchanged behavior) ----- */
// const normalizeSku = (s) => {
//   const raw = s?.variant_values || {};
//   const vv = { ...raw };
//   if (vv.Color != null && vv.color == null) vv.color = vv.Color;
//   if (vv.Storage != null && vv.storage == null) vv.storage = vv.Storage;
//   if (vv.ROM != null && vv.storage == null) vv.storage = vv.ROM;
//   if (vv.RAM != null && vv.ram == null) vv.ram = vv.RAM;
//   if (vv.memory != null && vv.ram == null) vv.ram = vv.memory;
//   if (vv.Size != null && vv.size == null) vv.size = vv.Size;

//   const left =
//     typeof s?.initial_stock === "number" && typeof s?.sold_stock === "number"
//       ? s.initial_stock - s.sold_stock
//       : s?.left_stock;

//   return { ...s, variant_values: vv, left_stock: left };
// };

// const isInCart = (skuId, cart) =>
//   !!cart?.items?.some((i) => String(i.sku_id) === String(skuId));

// export default function Product() {
//   const router = useRouter();
//   const { currency, cartData, userData, addToCart } = useAppContext();
//   const { skuId } = router.query;

//   const [loading, setLoading] = useState(true);

//   // product-level
//   const [productName, setProductName] = useState("");
//   const [productDesc, setProductDesc] = useState("");
//   const [brandName, setBrandName] = useState("");
//   const [categoryName, setCategoryName] = useState("");
//   const [sellerName, setSellerName] = useState("");
//   const [categoryId, setCategoryId] = useState("");
//   const [productDetails, setProductDetails] = useState([]);
//   const [productId, setProductId] = useState("");

//   // sku data
//   const [skus, setSkus] = useState([]);
//   const [selectedSku, setSelectedSku] = useState(null);
//   const [mainImage, setMainImage] = useState(null);

//   // variant meta
//   const [variantKeys, setVariantKeys] = useState([]);
//   const [variantOrders, setVariantOrders] = useState({});

//   // featured
//   const [featuredProducts, setFeaturedProducts] = useState([]);

//   // cart state
//   const [successOpen, setSuccessOpen] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");
//   const [skuAdded, setSkuAdded] = useState(false);

//   // collapse Product Details
//   const [detailsOpen, setDetailsOpen] = useState(false);

//   // description expand stages: 0 = 1 line, 1 = 8 lines, 2 = full
//   const [descStage, setDescStage] = useState(0);

//   const handleSuccessOK = () => {
//     setSuccessOpen(false);
//     router.push("/cart");
//   };

//   /* ---------- load product ---------- */
//   useEffect(() => {
//     if (!skuId) return;
//     (async () => {
//       try {
//         if (skus.length) {
//           const withinSame = skus.some((s) => String(s._id) === String(skuId));
//           if (withinSame) {
//             const next = skus.find((s) => String(s._id) === String(skuId));
//             if (next) {
//               setSelectedSku(next);
//               setMainImage(next.thumbnail_img || null);
//               setLoading(false);
//               return;
//             }
//           }
//         }
//         setLoading(true);
//         const res = await fetch(`/api/product/getProductBySkuId?skuId=${encodeURIComponent(skuId)}`);
//         const data = await res.json();
//         if (!res.ok) throw new Error(data?.message || "Fetch failed");

//         const main = data?.main_sku ? normalizeSku(data.main_sku) : null;
//         const others = Array.isArray(data?.other_skus) ? data.other_skus.map(normalizeSku) : [];
//         const arr = [main, ...others].filter(Boolean);

//         setSkus(arr);
//         const current = arr.find((s) => String(s?._id) === String(skuId)) || arr[0] || null;

//         setSelectedSku(current);
//         setMainImage(current?.thumbnail_img || null);
//         setProductName(data?.product_name ?? "");
//         setProductDesc(data?.product_description ?? "");
//         setBrandName(data?.brand_name ?? "");
//         setSellerName(data?.seller_name ?? "");
//         setCategoryName(data?.category_name ?? "");
//         setCategoryId(data?.category_id ?? "");
//         setProductDetails(Array.isArray(data?.product_details) ? data.product_details : []);
//         setProductId(data?.product_id ?? "");
//         setSkuAdded(false);
//         setDescStage(0); // reset description clamp when switching products
//       } catch (e) {
//         console.error("Failed to fetch product:", e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [skuId]);

//   /* ---------- variant meta ---------- */
//   useEffect(() => {
//     if (!categoryId || !skus.length) return;
//     (async () => {
//       try {
//         const res = await fetch(`/api/product/getVariants/${encodeURIComponent(categoryId)}`);
//         const raw = await res.json();
//         const meta = parseVariantMeta(raw, skus);

//         const orders = { ...(meta.orders || {}) };
//         (meta.keys || []).forEach((k) => {
//           if (!Array.isArray(orders[k]) || !orders[k].length) {
//             const uniq = (xs) => [...new Set(xs.filter(Boolean))];
//             orders[k] = uniq(skus.map((s) => s?.variant_values?.[k]));
//           }
//         });
//         setVariantKeys(meta.keys || []);
//         setVariantOrders(orders);
//       } catch {
//         const uniq = (xs) => [...new Set(xs.filter(Boolean))];
//         const keys = uniq(
//           skus.flatMap((s) => Object.keys(s?.variant_values || {})).filter(Boolean)
//         );
//         const orders = {};
//         keys.forEach((k) => (orders[k] = uniq(skus.map((s) => s?.variant_values?.[k]))));
//         setVariantKeys(keys);
//         setVariantOrders(orders);
//       }
//     })();
//   }, [categoryId, skus]);

//   /* ---------- featured ---------- */
//   useEffect(() => {
//     if (!categoryId || !productId) return; // need both
//     (async () => {
//       try {
//         const res = await fetch("/api/product/getAllFeaturedProducts", {
//           method: "POST",                      
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ categoryId, productId }), 
//         });
//         const data = await res.json();
//         if (res.ok) setFeaturedProducts(data);
//       } catch (err) {
//         console.error("Failed to fetch featured products:", err);
//       }
//     })();
//   }, [categoryId, productId]);

//   /* ---------- helpers ---------- */
//   const findSku = (sel, opts = { allowOOS: false }) => {
//     const matches = skus.filter((s) => {
//       const v = s?.variant_values || {};
//       return Object.entries(sel).every(([k, val]) => {
//         if (val == null) return true;
//         return eqVal(getValCI(v, k), val);
//       });
//     });
//     const inStock = matches.find((m) => Number(m?.left_stock ?? 0) > 0);
//     if (inStock) return inStock;
//     return opts.allowOOS ? matches[0] || null : null;
//   };

//   const onPickVariant = (patch) => {
//     if (!selectedSku) return;
//     const cur = selectedSku.variant_values || {};
//     const nextSel = { ...cur, ...patch };

//     let sku = findSku(nextSel, { allowOOS: true });
//     if (!sku) {
//       const [changedKey, changedVal] = Object.entries(patch)[0] || [];
//       if (changedKey != null) {
//         const pool = skus.filter((s) => eqVal(getValCI(s?.variant_values, changedKey), changedVal));
//         sku = pool.find((s) => Number(s?.left_stock ?? 0) > 0) || pool[0] || null;
//       }
//     }

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

//   const optionHasStock = (key, value) => {
//     const cur = selectedSku?.variant_values || {};
//     const sel = { ...cur, [key]: value };
//     const sku = findSku(sel, { allowOOS: true });
//     return !!(sku && Number(sku.left_stock ?? 0) > 0);
//   };

//   useEffect(() => {
//     if (!selectedSku) return;
//     setSkuAdded(isInCart(selectedSku._id, cartData));
//   }, [selectedSku, cartData]);

//   const addToCartHandler = async (sku_id, quantity = 1, redirect = false) => {
//     if (!selectedSku || Number(selectedSku.left_stock ?? 0) <= 0) return;
//     if (isInCart(sku_id, cartData)) {
//       setSkuAdded(true);
//       setSuccessMsg("This item is already in your cart.");
//       setSuccessOpen(true);
//       if (redirect) router.push("/cart");
//       return;
//     }

//     const isAuthed = !!userData && Object.keys(userData).length > 0;
//     if (!isAuthed) {
//       const currentPath = router.asPath || `/product/${sku_id}`;
//       router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
//       return;
//     }

//     try {
//       await api.post("/user/updateCart", { items: [{ sku_id, quantity }] }, { withCredentials: true });
//       addToCart(sku_id, quantity);
//       if (redirect) router.push("/cart");
//       else {
//         setSkuAdded(true);
//         setSuccessMsg("Item added to cart successfully.");
//         setSuccessOpen(true);
//       }
//     } catch (err) {
//       console.error("Error updating cart:", err);
//     }
//   };

//   /* ---------- render ---------- */
//   if (loading) return <Loading />;
//   if (!selectedSku) return <p className="text-center mt-20">Product not found</p>;

//   const gallery = [selectedSku.thumbnail_img, ...(selectedSku.side_imgs || [])].filter(Boolean);
//   const isOutOfStock = !selectedSku || Number(selectedSku.left_stock ?? 0) <= 0;

//   const hasMrp = Number(selectedSku?.MRP) > 0;
//   const hasSp = Number(selectedSku?.SP) > 0;
//   const percentOff =
//     hasMrp && hasSp
//       ? Math.round(((Number(selectedSku.MRP) - Number(selectedSku.SP)) / Number(selectedSku.MRP)) * 100)
//       : 0;

//   /* description clamp styles (no plugin needed) */
//   const descClampStyle = (() => {
//     if (descStage === 0) {
//       return {
//         display: "-webkit-box",
//         WebkitLineClamp: 1,
//         WebkitBoxOrient: "vertical",
//         overflow: "hidden",
//       };
//     }
//     if (descStage === 1) {
//       return {
//         display: "-webkit-box",
//         WebkitLineClamp: 8,
//         WebkitBoxOrient: "vertical",
//         overflow: "hidden",
//       };
//     }
//     return {}; // full
//   })();

//   const nextDescStage = () => setDescStage((s) => (s === 0 ? 1 : s === 1 ? 2 : 2));
//   const resetDescStage = () => setDescStage(0);


//   return (
//     <>
//       <Navbar />

//       {/* <SuccessModal open={successOpen} message={successMsg} onOK={handleSuccessOK} /> */}

//       <div className="px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 pt-8 md:pt-12">
//         {/* ===== Top section ===== */}
//         <div className="grid lg:grid-cols-12 gap-8 md:gap-10">
//           {/* IMAGES (smaller, mobile-safe, no heavy borders) */}
//           <div className="lg:col-span-6">
//             <div className="lg:sticky lg:top-20">
//               <div className="relative mx-auto w-full max-w-[640px] aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden bg-gray-50">
//                 {mainImage ? (
//                   <Image
//                     src={mainImage}
//                     alt={productName}
//                     fill
//                     sizes="(max-width: 1024px) 100vw, 640px"
//                     className="object-contain"
//                     priority
//                   />
//                 ) : (
//                   <div className="w-full h-full bg-gray-100" />
//                 )}
//               </div>

//               {gallery.length > 0 && (
//                 <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
//                   {gallery.map((img, i) => (
//                     <button
//                       key={i}
//                       onClick={() => setMainImage(img)}
//                       className={cx(
//                         "relative aspect-square rounded-lg overflow-hidden bg-white",
//                         img === mainImage && "outline outline-2 outline-orange-500"
//                       )}
//                       aria-label={`thumb-${i}`}
//                     >
//                       <Image
//                         src={img}
//                         alt={`thumb-${i}`}
//                         fill
//                         sizes="100px"
//                         className="object-cover"
//                       />
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* INFO */}
//           <div className="lg:col-span-6">
//             <div className="p-1">
//               <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
//                 {productName}
//               </h1>

//               {/* Price row */}
//               <div className="mt-2 flex items-end gap-3">
//                 <div className="text-3xl sm:text-4xl font-semibold text-gray-900">
//                   {currency} {selectedSku?.SP}
//                 </div>
//                 {selectedSku?.MRP ? (
//                   <div className="text-gray-500 line-through text-lg">
//                     {currency} {selectedSku.MRP}
//                   </div>
//                 ) : null}
//                 {percentOff > 0 && (
//                   <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2.5 py-1 text-sm font-semibold">
//                     {percentOff}% off
//                   </span>
//                 )}
//               </div>

//               {/* Variant selectors (kept logic; lighter chrome) */}
//               {variantKeys?.length > 0 && (
//                 <div className="space-y-5 mt-5">
//                   {[...variantKeys]
//                     .sort((a, b) =>
//                       String(a).toLowerCase() === "color" ? -1 : String(b).toLowerCase() === "color" ? 1 : 0
//                     )
//                     .map((key) => {
//                       const fromApi = (variantOrders?.[key] || []).filter(Boolean);
//                       const fromSkus = [
//                         ...new Set(skus.map((s) => s?.variant_values?.[key]).filter(Boolean)),
//                       ];
//                       const uniqueValues = fromApi.length ? fromApi.filter((v) => fromSkus.includes(v)) : fromSkus;
//                       if (uniqueValues.length <= 1) return null;

//                       const current = selectedSku?.variant_values?.[key];
//                       const isColorLike = String(key).toLowerCase() === "color";

//                       return (
//                         <div key={key} className="flex items-start gap-4">
//                           <div className="w-24 shrink-0 text-gray-600 font-medium pt-2">
//                             {String(key).charAt(0).toUpperCase() + String(key).slice(1)}
//                           </div>

//                           <div className={isColorLike ? "flex gap-2.5 flex-wrap" : "flex gap-2 flex-wrap"}>
//                             {uniqueValues.map((val) => {
//                               const active = val === current;
//                               const hasStock = optionHasStock(key, val);

//                               let thumb = null;
//                               if (isColorLike) {
//                                 const skuForVal =
//                                   findSku({ ...selectedSku?.variant_values, [key]: val }, { allowOOS: true }) ||
//                                   findSku({ [key]: val }, { allowOOS: true });
//                                 thumb = skuForVal?.thumbnail_img || selectedSku?.thumbnail_img || null;
//                               }

//                               return isColorLike ? (
//                                 <button
//                                   key={val}
//                                   onClick={() => onPickVariant({ [key]: val })}
//                                   title={val}
//                                   className={cx(
//                                     "relative w-16 h-14 rounded-lg overflow-hidden bg-white",
//                                     active && "outline outline-2 outline-orange-500",
//                                     !hasStock && "opacity-45"
//                                   )}
//                                 >
//                                   {thumb ? (
//                                     <Image src={thumb} alt={val} fill className="object-cover" />
//                                   ) : (
//                                     <span className="text-sm px-2">{val}</span>
//                                   )}
//                                 </button>
//                               ) : (
//                                 <button
//                                   key={val}
//                                   onClick={() => onPickVariant({ [key]: val })}
//                                   className={cx(
//                                     "px-3.5 py-2 rounded-lg border text-sm sm:text-base font-semibold bg-white transition",
//                                     active
//                                       ? "border-orange-500 text-orange-600"
//                                       : "border-gray-200 text-gray-900 hover:border-gray-300",
//                                     !hasStock && "opacity-45"
//                                   )}
//                                 >
//                                   {val}
//                                 </button>
//                               );
//                             })}
//                           </div>
//                         </div>
//                       );
//                     })}
//                 </div>
//               )}

//               {/* Small specs (no heavy borders) */}
//               <div className="mt-6">
//                 <table className="table-auto border-collapse">
//                   <tbody>
//                     {brandName && (
//                       <tr>
//                         <td className="text-gray-600 font-medium pr-6 py-1.5">Brand</td>
//                         <td className="text-gray-800/85 py-1.5">{brandName}</td>
//                       </tr>
//                     )}
//                     <tr>
//                       <td className="text-gray-600 font-medium pr-6 py-1.5">Category</td>
//                       <td className="text-gray-800/85 py-1.5">{categoryName}</td>
//                     </tr>

//                     {isOutOfStock ? (
//                       <tr>
//                         <td className="text-gray-600 font-medium pr-6 py-1.5">Stock</td>
//                         <td className="text-red-600 font-semibold py-1.5">Out of stock</td>
//                       </tr>
//                     ) : (
//                       selectedSku?.left_stock > 0 &&
//                       selectedSku?.left_stock < 10 && (
//                         <tr>
//                           <td className="text-gray-600 font-medium pr-6 py-1.5">Stock</td>
//                           <td className="text-gray-800/85 py-1.5">
//                             <span className="text-red-600 font-semibold">
//                               Only {selectedSku.left_stock} Left, hurry up!
//                             </span>
//                           </td>
//                         </tr>
//                       )
//                     )}

//                     <tr>
//                       <td className="text-gray-600 font-medium pr-6 py-1.5">Seller</td>
//                       <td className="text-gray-800/85 py-1.5">{sellerName}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>

//               {/* Buttons */}
//               <div className="flex items-center gap-3 mt-6">
//                 {skuAdded ? (
//                   <button
//                     onClick={() => router.push("/cart")}
//                     className="w-full py-3.5 rounded-xl bg-green-500 text-white hover:bg-green-600"
//                   >
//                     Go to Cart
//                   </button>
//                 ) : (
//                   <button
//                     onClick={() => addToCartHandler(selectedSku._id)}
//                     className={cx(
//                       "w-full py-3.5 rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200",
//                       isOutOfStock && "opacity-50 cursor-not-allowed"
//                     )}
//                     disabled={isOutOfStock}
//                   >
//                     Add to Cart
//                   </button>
//                 )}

//                 <button
//                   onClick={() => addToCartHandler(selectedSku._id, 1, true)}
//                   className={cx(
//                     "w-full py-3.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600",
//                     isOutOfStock && "opacity-50 cursor-not-allowed"
//                   )}
//                   disabled={isOutOfStock}
//                 >
//                   Buy now
//                 </button>
//               </div>

//               {/* Feature strip (minimal chrome) */}
//               <div className="mt-5">
//                 <div className="rounded-xl px-4 py-3 bg-green-50">
//                   <div className="flex items-stretch justify-between">
//                     {/* Easy Returns */}
//                     <div className="flex items-center gap-2.5">
//                       <RotateCcw className="w-5 h-5 text-green-700" />
//                       <div className="leading-5">
//                         <div className="font-semibold text-gray-900">Easy</div>
//                         <div className="font-semibold text-gray-900">Returns</div>
//                         <div className="font-semibold text-gray-900">in 7 days</div>
//                       </div>
//                     </div>

//                     {/* COD */}
//                     <div className="flex items-center gap-2.5">
//                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
//                         fill="none" stroke="currentColor" strokeWidth="2"
//                         className="w-5 h-5 text-green-700">
//                         <rect x="3" y="6" width="18" height="12" rx="2" ry="2" />
//                         <circle cx="12" cy="12" r="2.5" />
//                         <path d="M7 12h.01M17 12h.01" />
//                       </svg>
//                       <div className="leading-5">
//                         <div className="font-semibold text-gray-900">COD</div>
//                         <div className="font-semibold text-gray-900">Available</div>
//                       </div>
//                     </div>

//                     {/* Delivery */}
//                     <div className="flex items-center gap-2.5">
//                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
//                         fill="none" stroke="currentColor" strokeWidth="2"
//                         className="w-5 h-5 text-green-700">
//                         <path d="M3 7h11v8H3z" />
//                         <path d="M14 9h4l3 3v3h-7z" />
//                         <circle cx="7.5" cy="17.5" r="1.5" />
//                         <circle cx="17.5" cy="17.5" r="1.5" />
//                       </svg>
//                       <div className="leading-5">
//                         <div className="font-semibold text-gray-900">Delivery In</div>
//                         <div className="font-semibold text-gray-900">3 Days</div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Product Details (collapsible) */}
//               {Array.isArray(productDetails) && productDetails.length > 0 && (
//                 <div className="mt-7">
//                   <button
//                     type="button"
//                     onClick={() => setDetailsOpen((x) => !x)}
//                     className="w-full flex items-center justify-between rounded-xl bg-white px-2 py-2 text-left"
//                   >
//                     <span className="text-lg font-semibold text-gray-900">Product Details</span>
//                     <span className="text-2xl leading-none text-gray-600">{detailsOpen ? "−" : "+"}</span>
//                   </button>

//                   {detailsOpen && (
//                     <div className="mt-2">
//                       <table className="w-full">
//                         <tbody>
//                           {productDetails.map((d, i) => (
//                             <tr key={`${d.key}-${i}`} className="odd:bg-gray-50">
//                               <td className="w-1/3 sm:w-1/4 px-2 py-2 text-gray-600 font-medium align-top capitalize">
//                                 {String(d.key || "").trim()}
//                               </td>
//                               <td className="px-2 py-2 text-gray-800/90 align-top">
//                                 {String(d.value || "").trim()}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {productDesc && (
//           <div className="mt-8 md:mt-10">
//             <h3 className="text-2xl font-semibold text-gray-900 mb-2">Product Description</h3>
//             <div className="text-gray-700 leading-7" style={descClampStyle}>
//               {productDesc}
//             </div>

//             {/* Only show controls if description is longer than ~120 chars */}
//             {productDesc.length > 120 && (
//               <div className="mt-2">
//                 {descStage < 2 ? (
//                   <button
//                     onClick={nextDescStage}
//                     className="text-orange-600 font-semibold hover:underline"
//                   >
//                     More
//                   </button>
//                 ) : (
//                   <button
//                     onClick={resetDescStage}
//                     className="text-orange-600 font-semibold hover:underline"
//                   >
//                     Less
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {featuredProducts?.length > 0 && (
//           <div className="flex flex-col items-center">
//             <div className="flex flex-col items-center mb-4 mt-14">
//               <p className="text-3xl font-medium">
//                 Featured <span className="font-medium text-orange-600">Products</span>
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



///////////////////


"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import { RotateCcw } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import SuccessModal from "@/components/SuccessModal";
import { useAppContext } from "@/context/AppContext";
import api from "@/lib/axios";
import { essentialsOnLoad } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);
  return { props: { ...essentials.props } };
}

/* ---------------- helpers ---------------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const getValCI = (obj = {}, k) => {
  const nk = String(k || "").toLowerCase();
  for (const [kk, vv] of Object.entries(obj || {})) {
    if (String(kk).toLowerCase() === nk) return vv;
  }
  return undefined;
};
const eqVal = (a, b) => String(a) === String(b);

/* ----- parse variant meta (unchanged behavior) ----- */
const parseVariantMeta = (raw, skus) => {
  const uniq = (xs) => [...new Set(xs.filter(Boolean))];
  const inferFromSkus = (keys) => {
    const allKeys =
      keys && keys.length
        ? keys
        : uniq(
            skus.flatMap((s) => Object.keys(s?.variant_values || {})).filter(Boolean)
          );
    const orders = {};
    allKeys.forEach((k) => {
      orders[k] = uniq(skus.map((s) => s?.variant_values?.[k]));
    });
    return { keys: allKeys, orders };
  };
  if (!raw) return inferFromSkus([]);
  if (raw.variant_keys && Array.isArray(raw.variant_keys)) {
    const keys = raw.variant_keys;
    const base = inferFromSkus(keys);
    const orders =
      raw.orders && typeof raw.orders === "object"
        ? { ...base.orders, ...raw.orders }
        : base.orders;
    keys.forEach((k) => {
      if (!orders[k] || !orders[k].length) orders[k] = base.orders[k] || [];
    });
    return { keys, orders };
  }
  if (Array.isArray(raw) && raw.every((x) => x && typeof x === "object" && "name" in x)) {
    const keys = raw.map((x) => x.name);
    const orders = {};
    const base = inferFromSkus(keys);
    raw.forEach((x) => {
      orders[x.name] =
        Array.isArray(x.values) && x.values.length ? x.values : base.orders[x.name] || [];
    });
    keys.forEach((k) => {
      if (!orders[k] || !orders[k].length) orders[k] = base.orders[k] || [];
    });
    return { keys, orders };
  }
  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
    return inferFromSkus(raw);
  }
  return inferFromSkus([]);
};

/* ----- normalize sku (unchanged behavior) ----- */
const normalizeSku = (s) => {
  const raw = s?.variant_values || {};
  const vv = { ...raw };
  if (vv.Color != null && vv.color == null) vv.color = vv.Color;
  if (vv.Storage != null && vv.storage == null) vv.storage = vv.Storage;
  if (vv.ROM != null && vv.storage == null) vv.storage = vv.ROM;
  if (vv.RAM != null && vv.ram == null) vv.ram = vv.RAM;
  if (vv.memory != null && vv.ram == null) vv.ram = vv.memory;
  if (vv.Size != null && vv.size == null) vv.size = vv.Size;

  const left =
    typeof s?.initial_stock === "number" && typeof s?.sold_stock === "number"
      ? s.initial_stock - s.sold_stock
      : s?.left_stock;

  return { ...s, variant_values: vv, left_stock: left };
};

const isInCart = (skuId, cart) =>
  !!cart?.items?.some((i) => String(i.sku_id) === String(skuId));

export default function Product() {
  const router = useRouter();
  const { currency, cartData, userData, addToCart } = useAppContext();
  const { skuId } = router.query;

  const [loading, setLoading] = useState(true);

  // product-level
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [brandName, setBrandName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productDetails, setProductDetails] = useState([]);
  const [productId, setProductId] = useState("");

  // sku data
  const [skus, setSkus] = useState([]);
  const [selectedSku, setSelectedSku] = useState(null);
  const [mainImage, setMainImage] = useState(null);

  // variant meta
  const [variantKeys, setVariantKeys] = useState([]);
  const [variantOrders, setVariantOrders] = useState({});

  // featured
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // cart state
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [skuAdded, setSkuAdded] = useState(false);

  // collapse Product Details
  const [detailsOpen, setDetailsOpen] = useState(false);

  // description expand stages: 0 = 1 line, 1 = 8 lines, 2 = full
  const [descStage, setDescStage] = useState(0);

  const handleSuccessOK = () => {
    setSuccessOpen(false);
    router.push("/cart");
  };

  /* ---------- load product ---------- */
  useEffect(() => {
    if (!skuId) return;
    (async () => {
      try {
        if (skus.length) {
          const withinSame = skus.some((s) => String(s._id) === String(skuId));
          if (withinSame) {
            const next = skus.find((s) => String(s._id) === String(skuId));
            if (next) {
              setSelectedSku(next);
              setMainImage(next.thumbnail_img || null);
              setLoading(false);
              return;
            }
          }
        }
        setLoading(true);
        const res = await fetch(`/api/product/getProductBySkuId?skuId=${encodeURIComponent(skuId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Fetch failed");

        const main = data?.main_sku ? normalizeSku(data.main_sku) : null;
        const others = Array.isArray(data?.other_skus) ? data.other_skus.map(normalizeSku) : [];
        const arr = [main, ...others].filter(Boolean);

        setSkus(arr);
        const current = arr.find((s) => String(s?._id) === String(skuId)) || arr[0] || null;

        setSelectedSku(current);
        setMainImage(current?.thumbnail_img || null);
        setProductName(data?.product_name ?? "");
        setProductDesc(data?.product_description ?? "");
        setBrandName(data?.brand_name ?? "");
        setSellerName(data?.seller_name ?? "");
        setCategoryName(data?.category_name ?? "");
        setCategoryId(data?.category_id ?? "");
        setProductDetails(Array.isArray(data?.product_details) ? data.product_details : []);
        setProductId(data?.product_id ?? "");
        setSkuAdded(false);
        setDescStage(0); // reset description clamp when switching products
      } catch (e) {
        console.error("Failed to fetch product:", e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skuId]);

  /* ---------- variant meta ---------- */
  useEffect(() => {
    if (!categoryId || !skus.length) return;
    (async () => {
      try {
        const res = await fetch(`/api/product/getVariants/${encodeURIComponent(categoryId)}`);
        const raw = await res.json();
        const meta = parseVariantMeta(raw, skus);

        const orders = { ...(meta.orders || {}) };
        (meta.keys || []).forEach((k) => {
          if (!Array.isArray(orders[k]) || !orders[k].length) {
            const uniq = (xs) => [...new Set(xs.filter(Boolean))];
            orders[k] = uniq(skus.map((s) => s?.variant_values?.[k]));
          }
        });
        setVariantKeys(meta.keys || []);
        setVariantOrders(orders);
      } catch {
        const uniq = (xs) => [...new Set(xs.filter(Boolean))];
        const keys = uniq(
          skus.flatMap((s) => Object.keys(s?.variant_values || {})).filter(Boolean)
        );
        const orders = {};
        keys.forEach((k) => (orders[k] = uniq(skus.map((s) => s?.variant_values?.[k]))));
        setVariantKeys(keys);
        setVariantOrders(orders);
      }
    })();
  }, [categoryId, skus]);

  /* ---------- featured ---------- */
  useEffect(() => {
    if (!categoryId || !productId) return; // need both
    (async () => {
      try {
        const res = await fetch("/api/product/getAllFeaturedProducts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, productId }),
        });
        const data = await res.json();
        if (res.ok) setFeaturedProducts(data);
      } catch (err) {
        console.error("Failed to fetch featured products:", err);
      }
    })();
  }, [categoryId, productId]);

  /* ---------- helpers ---------- */
  const findSku = (sel, opts = { allowOOS: false }) => {
    const matches = skus.filter((s) => {
      const v = s?.variant_values || {};
      return Object.entries(sel).every(([k, val]) => {
        if (val == null) return true;
        return eqVal(getValCI(v, k), val);
      });
    });
    const inStock = matches.find((m) => Number(m?.left_stock ?? 0) > 0);
    if (inStock) return inStock;
    return opts.allowOOS ? matches[0] || null : null;
  };

  const onPickVariant = (patch) => {
    if (!selectedSku) return;
    const cur = selectedSku.variant_values || {};
    const nextSel = { ...cur, ...patch };

    let sku = findSku(nextSel, { allowOOS: true });
    if (!sku) {
      const [changedKey, changedVal] = Object.entries(patch)[0] || [];
      if (changedKey != null) {
        const pool = skus.filter((s) => eqVal(getValCI(s?.variant_values, changedKey), changedVal));
        sku = pool.find((s) => Number(s?.left_stock ?? 0) > 0) || pool[0] || null;
      }
    }

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

  const optionHasStock = (key, value) => {
    const cur = selectedSku?.variant_values || {};
    const sel = { ...cur, [key]: value };
    const sku = findSku(sel, { allowOOS: true });
    return !!(sku && Number(sku.left_stock ?? 0) > 0);
  };

  useEffect(() => {
    if (!selectedSku) return;
    setSkuAdded(isInCart(selectedSku._id, cartData));
  }, [selectedSku, cartData]);

  const addToCartHandler = async (sku_id, quantity = 1, redirect = false) => {
    if (!selectedSku || Number(selectedSku.left_stock ?? 0) <= 0) return;
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
      await api.post("/user/updateCart", { items: [{ sku_id, quantity }] }, { withCredentials: true });
      addToCart(sku_id, quantity);
      if (redirect) router.push("/cart");
      else {
        setSkuAdded(true);
        setSuccessMsg("Item added to cart successfully.");
        setSuccessOpen(true);
      }
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  /* ---------- render ---------- */
  if (loading) return <Loading />;
  if (!selectedSku) return <p className="text-center mt-20">Product not found</p>;

  const gallery = [selectedSku.thumbnail_img, ...(selectedSku.side_imgs || [])].filter(Boolean);
  const isOutOfStock = !selectedSku || Number(selectedSku.left_stock ?? 0) <= 0;

  const hasMrp = Number(selectedSku?.MRP) > 0;
  const hasSp = Number(selectedSku?.SP) > 0;
  const percentOff =
    hasMrp && hasSp
      ? Math.round(((Number(selectedSku.MRP) - Number(selectedSku.SP)) / Number(selectedSku.MRP)) * 100)
      : 0;

  /* description clamp styles (no plugin needed) */
  const descClampStyle = (() => {
    if (descStage === 0) {
      return {
        display: "-webkit-box",
        WebkitLineClamp: 1,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };
    }
    if (descStage === 1) {
      return {
        display: "-webkit-box",
        WebkitLineClamp: 8,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };
    }
    return {}; // full
  })();

  const nextDescStage = () => setDescStage((s) => (s === 0 ? 1 : s === 1 ? 2 : 2));
  const resetDescStage = () => setDescStage(0);

  return (
    <>
      <Navbar />

      {/* <SuccessModal open={successOpen} message={successMsg} onOK={handleSuccessOK} /> */}

      {/* add bottom padding so sticky mobile bar doesn't overlap content */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 pt-8 md:pt-12 pb-28 md:pb-12">
        {/* ===== Top section ===== */}
        <div className="grid lg:grid-cols-12 gap-8 md:gap-10">
          {/* IMAGES (smaller, mobile-safe, no heavy borders) */}
          <div className="lg:col-span-6">
            <div className="lg:sticky lg:top-20">
              <div className="relative mx-auto w-full max-w-[640px] aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden bg-gray-50">
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={productName}
                    fill
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="object-contain"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
              </div>

              {gallery.length > 0 && (
                <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(img)}
                      className={cx(
                        "relative aspect-square rounded-lg overflow-hidden bg-white",
                        img === mainImage && "outline outline-2 outline-orange-500"
                      )}
                      aria-label={`thumb-${i}`}
                    >
                      <Image
                        src={img}
                        alt={`thumb-${i}`}
                        fill
                        sizes="100px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* INFO */}
          <div className="lg:col-span-6">
            <div className="p-1">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                {productName}
              </h1>

              {/* Price row */}
              <div className="mt-2 flex items-end gap-3">
                <div className="text-3xl sm:text-4xl font-semibold text-gray-900">
                  {currency} {selectedSku?.SP}
                </div>
                {selectedSku?.MRP ? (
                  <div className="text-gray-500 line-through text-lg">
                    {currency} {selectedSku.MRP}
                  </div>
                ) : null}
                {percentOff > 0 && (
                  <span className="inline-flex items-center bg-green-50 text-green-700 px-2.5 py-1 text-sm font-semibold">
                    {percentOff}% off
                  </span>
                )}
              </div>

              {/* Variant selectors (kept logic; lighter chrome) */}
              {variantKeys?.length > 0 && (
                <div className="space-y-5 mt-5">
                  {[...variantKeys]
                    .sort((a, b) =>
                      String(a).toLowerCase() === "color" ? -1 : String(b).toLowerCase() === "color" ? 1 : 0
                    )
                    .map((key) => {
                      const fromApi = (variantOrders?.[key] || []).filter(Boolean);
                      const fromSkus = [
                        ...new Set(skus.map((s) => s?.variant_values?.[key]).filter(Boolean)),
                      ];
                      const uniqueValues = fromApi.length ? fromApi.filter((v) => fromSkus.includes(v)) : fromSkus;
                      if (uniqueValues.length <= 1) return null;

                      const current = selectedSku?.variant_values?.[key];
                      const isColorLike = String(key).toLowerCase() === "color";

                      return (
                        <div key={key} className="flex items-start gap-4">
                          <div className="w-24 shrink-0 text-gray-600 font-medium pt-2">
                            {String(key).charAt(0).toUpperCase() + String(key).slice(1)}
                          </div>

                          <div className={isColorLike ? "flex gap-2.5 flex-wrap" : "flex gap-2 flex-wrap"}>
                            {uniqueValues.map((val) => {
                              const active = val === current;
                              const hasStock = optionHasStock(key, val);

                              let thumb = null;
                              if (isColorLike) {
                                const skuForVal =
                                  findSku({ ...selectedSku?.variant_values, [key]: val }, { allowOOS: true }) ||
                                  findSku({ [key]: val }, { allowOOS: true });
                                thumb = skuForVal?.thumbnail_img || selectedSku?.thumbnail_img || null;
                              }

                              return isColorLike ? (
                                <button
                                  key={val}
                                  onClick={() => onPickVariant({ [key]: val })}
                                  title={val}
                                  className={cx(
                                    "relative w-16 h-14 rounded-lg overflow-hidden bg-white",
                                    active && "outline outline-2 outline-orange-500",
                                    !hasStock && "opacity-45"
                                  )}
                                >
                                  {thumb ? (
                                    <Image src={thumb} alt={val} fill className="object-cover" />
                                  ) : (
                                    <span className="text-sm px-2">{val}</span>
                                  )}
                                </button>
                              ) : (
                                <button
                                  key={val}
                                  onClick={() => onPickVariant({ [key]: val })}
                                  className={cx(
                                    "px-3.5 py-2 border text-sm sm:text-base font-semibold bg-white transition",
                                    active
                                      ? "border-orange-500 text-orange-600"
                                      : "border-gray-200 text-gray-900 hover:border-gray-300",
                                    !hasStock && "opacity-45"
                                  )}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Small specs (no heavy borders) */}
              <div className="mt-6">
                <table className="table-auto border-collapse">
                  <tbody>
                    {brandName && (
                      <tr>
                        <td className="text-gray-600 font-medium pr-6 py-1.5">Brand</td>
                        <td className="text-gray-800/85 py-1.5">{brandName}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-gray-600 font-medium pr-6 py-1.5">Category</td>
                      <td className="text-gray-800/85 py-1.5">{categoryName}</td>
                    </tr>

                    {isOutOfStock ? (
                      <tr>
                        <td className="text-gray-600 font-medium pr-6 py-1.5">Stock</td>
                        <td className="text-red-600 font-semibold py-1.5">Out of stock</td>
                      </tr>
                    ) : (
                      selectedSku?.left_stock > 0 &&
                      selectedSku?.left_stock < 10 && (
                        <tr>
                          <td className="text-gray-600 font-medium pr-6 py-1.5">Stock</td>
                          <td className="text-gray-800/85 py-1.5">
                            <span className="text-red-600 font-semibold">
                              Only {selectedSku.left_stock} Left, hurry up!
                            </span>
                          </td>
                        </tr>
                      )
                    )}

                    <tr>
                      <td className="text-gray-600 font-medium pr-6 py-1.5">Seller</td>
                      <td className="text-gray-800/85 py-1.5">{sellerName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Buttons — squared (no rounded corners)
                  HIDE on mobile because sticky bar handles it */}
              <div className="hidden md:flex items-center gap-3 mt-6">
                {skuAdded ? (
                  <button
                    onClick={() => router.push("/cart")}
                    className="w-full py-3.5 bg-green-500 text-white hover:bg-green-600"
                  >
                    Go to Cart
                  </button>
                ) : (
                  <button
                    onClick={() => addToCartHandler(selectedSku._id)}
                    className={cx(
                      "w-full py-3.5 bg-gray-100 text-gray-900 hover:bg-gray-200",
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
                    "w-full py-3.5 bg-orange-500 text-white hover:bg-orange-600",
                    isOutOfStock && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isOutOfStock}
                >
                  Buy now
                </button>
              </div>

              {/* Feature strip (minimal chrome) */}
              <div className="mt-5">
                <div className="rounded-xl px-4 py-3 bg-green-50">
                  <div className="flex items-stretch justify-between">
                    {/* Easy Returns */}
                    <div className="flex items-center gap-2.5">
                      <RotateCcw className="w-5 h-5 text-green-700" />
                      <div className="leading-5">
                        <div className="font-semibold text-gray-900">Easy</div>
                        <div className="font-semibold text-gray-900">Returns</div>
                        <div className="font-semibold text-gray-900">in 7 days</div>
                      </div>
                    </div>

                    {/* COD */}
                    <div className="flex items-center gap-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        className="w-5 h-5 text-green-700">
                        <rect x="3" y="6" width="18" height="12" rx="2" ry="2" />
                        <circle cx="12" cy="12" r="2.5" />
                        <path d="M7 12h.01M17 12h.01" />
                      </svg>
                      <div className="leading-5">
                        <div className="font-semibold text-gray-900">COD</div>
                        <div className="font-semibold text-gray-900">Available</div>
                      </div>
                    </div>

                    {/* Delivery */}
                    <div className="flex items-center gap-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        className="w-5 h-5 text-green-700">
                        <path d="M3 7h11v8H3z" />
                        <path d="M14 9h4l3 3v3h-7z" />
                        <circle cx="7.5" cy="17.5" r="1.5" />
                        <circle cx="17.5" cy="17.5" r="1.5" />
                      </svg>
                      <div className="leading-5">
                        <div className="font-semibold text-gray-900">Delivery In</div>
                        <div className="font-semibold text-gray-900">3 Days</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details (collapsible) — light border */}
              {Array.isArray(productDetails) && productDetails.length > 0 && (
                <div className="mt-7 border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => setDetailsOpen((x) => !x)}
                    className="w-full flex items-center justify-between bg-white px-2 py-2 text-left"
                  >
                    <span className="text-lg font-semibold text-gray-900">Product Details</span>
                    <span className="text-2xl leading-none text-gray-600">{detailsOpen ? "−" : "+"}</span>
                  </button>

                  {detailsOpen && (
                    <div className="mt-2">
                      <table className="w-full">
                        <tbody>
                          {productDetails.map((d, i) => (
                            <tr key={`${d.key}-${i}`} className="odd:bg-gray-50">
                              <td className="w-1/3 sm:w-1/4 px-2 py-2 text-gray-600 font-medium align-top capitalize">
                                {String(d.key || "").trim()}
                              </td>
                              <td className="px-2 py-2 text-gray-800/90 align-top">
                                {String(d.value || "").trim()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {productDesc && (
          <div className="mt-8 md:mt-10">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Product Description</h3>
            <div className="text-gray-700 leading-7" style={descClampStyle}>
              {productDesc}
            </div>

            {/* Only show controls if description is longer than ~120 chars */}
            {productDesc.length > 120 && (
              <div className="mt-2">
                {descStage < 2 ? (
                  <button
                    onClick={nextDescStage}
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    More
                  </button>
                ) : (
                  <button
                    onClick={resetDescStage}
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    Less
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {featuredProducts?.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center mb-4 mt-14">
              <p className="text-3xl font-medium">
                Featured <span className="font-medium text-orange-600">Products</span>
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

      {/* Sticky bottom bar for mobile (square buttons, no rounded) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 flex gap-3 md:hidden">
        {skuAdded ? (
          <button
            onClick={() => router.push("/cart")}
            className="flex-1 py-3.5 bg-green-500 text-white"
          >
            Go to Cart
          </button>
        ) : (
          <button
            onClick={() => addToCartHandler(selectedSku._id)}
            className={cx(
              "flex-1 py-3.5 bg-gray-100 text-gray-900",
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
            "flex-1 py-3.5 bg-orange-500 text-white",
            isOutOfStock && "opacity-50 cursor-not-allowed"
          )}
          disabled={isOutOfStock}
        >
          Buy now
        </button>
      </div>

      <Footer />
    </>
  );
}
