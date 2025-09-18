// "use client";
// import React, { useEffect, useState } from "react";
// import { s3Upload } from "@/lib/s3Upload";
// import ErrorBanner from "@/components/product/ErrorBanner";
// import SuccessModal from "@/components/SuccessModal";
// import CategorySelector from "@/components/product/CategorySelector";
// import VariantList from "@/components/product/VariantList";
// import api from "@/lib/axios";

// const EMPTY_ROW = () => ({
//   values: {},
//   MRP: "",
//   SP: "",
//   totalStocks: "",
//   thumbFile: null,
//   galleryFiles: [],
//   uploadKey: Math.random(),
//   discountPct: 0,
// });

// const AddProductComponent = () => {
//   // ----- state (unchanged) -----
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [subCategories, setSubCategories] = useState([]);
//   const [selectedSubCategory, setSelectedSubCategory] = useState("");
//   const [variants, setVariants] = useState([]);
//   const [brands, setBrands] = useState([]);
//   const [selectedBrand, setSelectedBrand] = useState("");
//   const [rows, setRows] = useState([EMPTY_ROW()]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [successOpen, setSuccessOpen] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");

//   // ----- effects (unchanged) -----
//   useEffect(() => {
//     let ignore = false;
//     const abort = new AbortController();
//     (async () => {
//       try {
//         const res = await fetch("/api/product/getCategories", {
//           signal: abort.signal,
//         });
//         const data = await res.json();
//         if (!ignore && !data.error)
//           setCategories(Array.isArray(data) ? data : []);
//       } catch (err) {
//         if (!ignore) console.error("Error fetching categories:", err);
//       }
//     })();
//     return () => {
//       ignore = true;
//       abort.abort();
//     };
//   }, []);

//   useEffect(() => {
//     const selected = categories.find((c) => c._id === selectedCategory);
//     setSubCategories(selected?.children?.length ? selected.children : []);
//     setSelectedSubCategory("");
//   }, [selectedCategory, categories]);

//   useEffect(() => {
//     const categoryId = selectedSubCategory || selectedCategory;
//     if (!categoryId) {
//       setVariants([]);
//       setRows([EMPTY_ROW()]);
//       return;
//     }
//     let ignore = false;
//     const abort = new AbortController();
//     (async () => {
//       try {
//         const res = await fetch(
//           `/api/product/getVariants?categoryId=${categoryId}`,
//           { signal: abort.signal }
//         );
//         const data = await res.json();
//         if (!ignore && !data.error) {
//           setVariants(Array.isArray(data) ? data : []);
//           setRows([EMPTY_ROW()]);
//         }
//       } catch (err) {
//         if (!ignore) console.error("Error fetching variants:", err);
//       }
//     })();
//     return () => {
//       ignore = true;
//       abort.abort();
//     };
//   }, [selectedSubCategory, selectedCategory]);

//   useEffect(() => {
//     const categoryId = selectedSubCategory || selectedCategory;
//     if (!categoryId) {
//       setBrands([]);
//       setSelectedBrand("");
//       return;
//     }
//     let ignore = false;
//     const abort = new AbortController();
//     (async () => {
//       try {
//         const res = await fetch(
//           `/api/product/getBrands?categoryId=${categoryId}`,
//           { signal: abort.signal }
//         );
//         const data = await res.json();
//         const rawList = Array.isArray(data?.items)
//           ? data.items
//           : Array.isArray(data)
//           ? data
//           : [];
//         const normalized = rawList
//           .map((b) => ({
//             id: b.brandId || b._id || b.id,
//             name: b.name,
//           }))
//           .filter((b) => b.id && b.name);
//         if (!ignore) {
//           setBrands(normalized);
//           setSelectedBrand("");
//         }
//       } catch (err) {
//         if (!ignore) console.error("Error fetching brands:", err);
//       }
//     })();
//     return () => {
//       ignore = true;
//       abort.abort();
//     };
//   }, [selectedSubCategory, selectedCategory]);

//   // ----- handlers (unchanged) -----
//   const handleVariantChange = (rowIdx, variantId, value) => {
//     setRows((prev) => {
//       const next = [...prev];
//       const row = { ...next[rowIdx], values: { ...next[rowIdx].values } };
//       row.values[variantId] = value;
//       next[rowIdx] = row;
//       return next;
//     });
//   };

//   const handlePriceChange = (rowIdx, { field, value }) => {
//     setRows((prev) => {
//       const next = [...prev];
//       const row = { ...next[rowIdx] };
//       row[field] = value;
//       const mrp = parseFloat(row.MRP || "0");
//       const sp = parseFloat(row.SP || "0");
//       row.discountPct =
//         !mrp || !sp || sp > mrp ? 0 : Math.round(((mrp - sp) / mrp) * 100);
//       next[rowIdx] = row;
//       return next;
//     });
//   };

//   const handleThumbChange = (rowIdx, e) => {
//     const file = e.target.files?.[0] || null;
//     setRows((prev) =>
//       prev.map((r, i) =>
//         i === rowIdx ? { ...r, thumbFile: file, uploadKey: Math.random() } : r
//       )
//     );
//   };

//   const handleGalleryChange = (rowIdx, index, e) => {
//     const file = e.target.files?.[0] || null;
//     setRows((prev) =>
//       prev.map((r, i) => {
//         if (i !== rowIdx) return r;
//         const nextGallery = Array.isArray(r.galleryFiles)
//           ? [...r.galleryFiles]
//           : [];
//         if (index >= nextGallery.length) {
//           for (let j = nextGallery.length; j <= index; j++)
//             nextGallery.push(null);
//         }
//         nextGallery[index] = file;
//         return { ...r, galleryFiles: nextGallery };
//       })
//     );
//   };

//   const clearGalleryAt = (rowIdx, index) => {
//     setRows((prev) =>
//       prev.map((r, i) =>
//         i === rowIdx
//           ? {
//               ...r,
//               galleryFiles: r.galleryFiles
//                 .map((f, j) => (j === index ? null : f))
//                 .filter((x, j, arr) => !(j === arr.length - 1 && x === null)),
//             }
//           : r
//       )
//     );
//   };

//   const addRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);
//   const removeRow = (idx) =>
//     setRows((prev) => prev.filter((_, i) => i !== idx));

//   // ----- validation + submit (unchanged) -----
//   const validateForm = () => {
//     setError("");
//     if (!name.trim()) return setError("Please enter a product name."), false;
//     if (!description.trim())
//       return setError("Please enter a product description."), false;
//     const categoryId = selectedSubCategory || selectedCategory;
//     if (!categoryId)
//       return setError("Please choose a category or subcategory."), false;
//     if (!selectedBrand) return setError("Please select a brand."), false;

//     for (let i = 0; i < rows.length; i++) {
//       const row = rows[i];
//       for (const v of variants) {
//         if (!row?.values?.[v.variantId]) {
//           return (
//             setError(`Please select ${v.name} for Variant #${i + 1}.`), false
//           );
//         }
//       }
//       const mrp = Number(row.MRP);
//       const sp = Number(row.SP);
//       const stock = Number(row.totalStocks);
//       if (!mrp || mrp <= 0)
//         return setError(`Enter a valid MRP for Variant #${i + 1}.`), false;
//       if (!sp || sp <= 0)
//         return (
//           setError(`Enter a valid selling price for Variant #${i + 1}.`), false
//         );
//       if (sp > mrp)
//         return (
//           setError(
//             `Selling price cannot be greater than MRP for Variant #${i + 1}.`
//           ),
//           false
//         );
//       if (!Number.isInteger(stock) || stock < 0)
//         return (
//           setError(`Enter a valid total stock for Variant #${i + 1}.`), false
//         );
//       if (!row.thumbFile)
//         return (
//           setError(`Please add a thumbnail image for Variant #${i + 1}.`), false
//         );
//       if (row.galleryFiles.length > 10)
//         return (
//           setError(`You can upload up to 10 images for Variant #${i + 1}.`),
//           false
//         );
//     }
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;
//     setLoading(true);
//     setError("");
//     try {
//       const categoryId = selectedSubCategory || selectedCategory;
//       const rowsPayload = [];
//       for (const row of rows) {
//         const thumbnail_img = await s3Upload(
//           row.thumbFile,
//           "/api/s3/productImgUpload"
//         );
//         const galleryToUpload = row.galleryFiles.filter(Boolean);
//         const side_imgs = galleryToUpload.length
//           ? await Promise.all(
//               galleryToUpload.map((f) =>
//                 s3Upload(f, "/api/s3/productImgUpload")
//               )
//             )
//           : [];
//         rowsPayload.push({
//           values: row.values,
//           sellerMRP: Number(row.MRP),
//           sellerSP: Number(row.SP),
//           totalStock: Number(row.totalStocks),
//           thumbnail_img,
//           side_imgs,
//         });
//       }
//       const res = await api.post(
//         "/product/createProduct",
//         {
//           categoryId,
//           brandId: selectedBrand,
//           name: name.trim(),
//           description: description.trim(),
//           variantRows: rowsPayload,
//         },
//         { withCredentials: true }
//       );
//       const data = res.data;
//       setSuccessMsg(data?.message || "Product created");
//       setSuccessOpen(true);
//     } catch (err) {
//       console.error("Error creating product:", err);
//       setError(err?.response?.data?.error || err?.message || "Server error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ---------------- UI: match ProductList ---------------- */
//   return (
//     <div className="w-full">
//       <form onSubmit={handleSubmit} className="space-y-6">
//         <ErrorBanner message={error} />

//         {/* Basic Info */}
//         <div className="grid gap-4 sm:max-w-xl">
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-medium">Product Name</label>
//             <input
//               type="text"
//               className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
//               onChange={(e) => setName(e.target.value)}
//               value={name}
//               required
//             />
//           </div>

//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-medium">Product Description</label>
//             <textarea
//               rows={4}
//               className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500 resize-y"
//               onChange={(e) => setDescription(e.target.value)}
//               value={description}
//               required
//             />
//           </div>
//         </div>

//         {/* Category + Brand */}
//         <CategorySelector
//           categories={categories}
//           selectedCategory={selectedCategory}
//           setSelectedCategory={setSelectedCategory}
//           subCategories={subCategories}
//           selectedSubCategory={selectedSubCategory}
//           setSelectedSubCategory={setSelectedSubCategory}
//           brands={brands}
//           selectedBrand={selectedBrand}
//           setSelectedBrand={setSelectedBrand}
//         />

//         {/* Variant boxes */}
//         <VariantList
//           variants={variants}
//           rows={rows}
//           onVariantChange={handleVariantChange}
//           onPriceChange={handlePriceChange}
//           onThumbChange={handleThumbChange}
//           onGalleryChange={handleGalleryChange}
//           onClearGalleryAt={clearGalleryAt}
//           onAddRow={addRow}
//           onRemoveRow={removeRow}
//         />

//         {/* Actions */}
//         <div className="flex gap-3 pt-2">
//           <button
//             type="submit"
//             disabled={loading}
//             className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-white shadow-sm hover:bg-orange-700 active:scale-[.98] disabled:opacity-60"
//           >
//             {loading ? "Saving..." : "Add Product"}
//           </button>
//         </div>
//       </form>

//       <SuccessModal
//         open={successOpen}
//         message={successMsg}
//         onOK={() => {
//           setSuccessOpen(false);
//           setName("");
//           setDescription("");
//           setSelectedCategory("");
//           setSelectedSubCategory("");
//           setVariants([]);
//           setBrands([]);
//           setSelectedBrand("");
//           setRows([EMPTY_ROW()]);
//           setError("");
//         }}
//       />
//     </div>
//   );
// };

// export default AddProductComponent;



////////////////



// "use client";
// import React, { useEffect, useState } from "react";
// import { s3Upload } from "@/lib/s3Upload";
// import ErrorBanner from "@/components/product/ErrorBanner";
// import SuccessModal from "@/components/SuccessModal";
// import CategorySelector from "@/components/product/CategorySelector";
// import VariantList from "@/components/product/VariantList";
// import api from "@/lib/axios";

// const EMPTY_ROW = () => ({
//   values: {},
//   MRP: "",
//   SP: "",
//   totalStocks: "",
//   thumbFile: null,
//   galleryFiles: [],
//   uploadKey: Math.random(),
//   discountPct: 0,
// });

// const EMPTY_DETAIL = () => ({ key: "", value: "" });

// const AddProductComponent = () => {
//   // ----- state (unchanged) -----
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [subCategories, setSubCategories] = useState([]);
//   const [selectedSubCategory, setSelectedSubCategory] = useState("");
//   const [variants, setVariants] = useState([]);
//   const [brands, setBrands] = useState([]);
//   const [selectedBrand, setSelectedBrand] = useState("");
//   const [rows, setRows] = useState([EMPTY_ROW()]);
//   const [details, setDetails] = useState([EMPTY_DETAIL()]); // 👈 new state
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [successOpen, setSuccessOpen] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");

//   // ----- effects (unchanged) -----
//   useEffect(() => {
//     let ignore = false;
//     const abort = new AbortController();
//     (async () => {
//       try {
//         const res = await fetch("/api/product/getCategories", {
//           signal: abort.signal,
//         });
//         const data = await res.json();
//         if (!ignore && !data.error)
//           setCategories(Array.isArray(data) ? data : []);
//       } catch (err) {
//         if (!ignore) console.error("Error fetching categories:", err);
//       }
//     })();
//     return () => {
//       ignore = true;
//       abort.abort();
//     };
//   }, []);

//   useEffect(() => {
//     const selected = categories.find((c) => c._id === selectedCategory);
//     setSubCategories(selected?.children?.length ? selected.children : []);
//     setSelectedSubCategory("");
//   }, [selectedCategory, categories]);

//   useEffect(() => {
//     const categoryId = selectedSubCategory || selectedCategory;
//     if (!categoryId) {
//       setVariants([]);
//       setRows([EMPTY_ROW()]);
//       return;
//     }
//     let ignore = false;
//     const abort = new AbortController();
//     (async () => {
//       try {
//         const res = await fetch(
//           `/api/product/getVariants?categoryId=${categoryId}`,
//           { signal: abort.signal }
//         );
//         const data = await res.json();
//         if (!ignore && !data.error) {
//           setVariants(Array.isArray(data) ? data : []);
//           setRows([EMPTY_ROW()]);
//         }
//       } catch (err) {
//         if (!ignore) console.error("Error fetching variants:", err);
//       }
//     })();
//     return () => {
//       ignore = true;
//       abort.abort();
//     };
//   }, [selectedSubCategory, selectedCategory]);

//   useEffect(() => {
//     const categoryId = selectedSubCategory || selectedCategory;
//     if (!categoryId) {
//       setBrands([]);
//       setSelectedBrand("");
//       return;
//     }
//     let ignore = false;
//     const abort = new AbortController();
//     (async () => {
//       try {
//         const res = await fetch(
//           `/api/product/getBrands?categoryId=${categoryId}`,
//           { signal: abort.signal }
//         );
//         const data = await res.json();
//         const rawList = Array.isArray(data?.items)
//           ? data.items
//           : Array.isArray(data)
//           ? data
//           : [];
//         const normalized = rawList
//           .map((b) => ({
//             id: b.brandId || b._id || b.id,
//             name: b.name,
//           }))
//           .filter((b) => b.id && b.name);
//         if (!ignore) {
//           setBrands(normalized);
//           setSelectedBrand("");
//         }
//       } catch (err) {
//         if (!ignore) console.error("Error fetching brands:", err);
//       }
//     })();
//     return () => {
//       ignore = true;
//       abort.abort();
//     };
//   }, [selectedSubCategory, selectedCategory]);

//   // ----- handlers (unchanged) -----
//   const handleVariantChange = (rowIdx, variantId, value) => {
//     setRows((prev) => {
//       const next = [...prev];
//       const row = { ...next[rowIdx], values: { ...next[rowIdx].values } };
//       row.values[variantId] = value;
//       next[rowIdx] = row;
//       return next;
//     });
//   };

//   const handlePriceChange = (rowIdx, { field, value }) => {
//     setRows((prev) => {
//       const next = [...prev];
//       const row = { ...next[rowIdx] };
//       row[field] = value;
//       const mrp = parseFloat(row.MRP || "0");
//       const sp = parseFloat(row.SP || "0");
//       row.discountPct =
//         !mrp || !sp || sp > mrp ? 0 : Math.round(((mrp - sp) / mrp) * 100);
//       next[rowIdx] = row;
//       return next;
//     });
//   };

//   const handleThumbChange = (rowIdx, e) => {
//     const file = e.target.files?.[0] || null;
//     setRows((prev) =>
//       prev.map((r, i) =>
//         i === rowIdx ? { ...r, thumbFile: file, uploadKey: Math.random() } : r
//       )
//     );
//   };

//   const handleGalleryChange = (rowIdx, index, e) => {
//     const file = e.target.files?.[0] || null;
//     setRows((prev) =>
//       prev.map((r, i) => {
//         if (i !== rowIdx) return r;
//         const nextGallery = Array.isArray(r.galleryFiles)
//           ? [...r.galleryFiles]
//           : [];
//         if (index >= nextGallery.length) {
//           for (let j = nextGallery.length; j <= index; j++)
//             nextGallery.push(null);
//         }
//         nextGallery[index] = file;
//         return { ...r, galleryFiles: nextGallery };
//       })
//     );
//   };

//   const clearGalleryAt = (rowIdx, index) => {
//     setRows((prev) =>
//       prev.map((r, i) =>
//         i === rowIdx
//           ? {
//               ...r,
//               galleryFiles: r.galleryFiles
//                 .map((f, j) => (j === index ? null : f))
//                 .filter((x, j, arr) => !(j === arr.length - 1 && x === null)),
//             }
//           : r
//       )
//     );
//   };

//   const addRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);
//   const removeRow = (idx) =>
//     setRows((prev) => prev.filter((_, i) => i !== idx));

//   // ----- details handlers (new) -----
//   const handleDetailChange = (idx, field, value) => {
//     setDetails((prev) => {
//       const next = [...prev];
//       next[idx] = { ...next[idx], [field]: value };
//       return next;
//     });
//   };

//   const addDetailRow = () => setDetails((prev) => [...prev, EMPTY_DETAIL()]);
//   const removeDetailRow = (idx) =>
//     setDetails((prev) => prev.filter((_, i) => i !== idx));

//   // ----- validation + submit (unchanged) -----
//   const validateForm = () => {
//     setError("");
//     if (!name.trim()) return setError("Please enter a product name."), false;
//     if (!description.trim())
//       return setError("Please enter a product description."), false;
//     const categoryId = selectedSubCategory || selectedCategory;
//     if (!categoryId)
//       return setError("Please choose a category or subcategory."), false;
//     if (!selectedBrand) return setError("Please select a brand."), false;

//     for (let i = 0; i < rows.length; i++) {
//       const row = rows[i];
//       for (const v of variants) {
//         if (!row?.values?.[v.variantId]) {
//           return (
//             setError(`Please select ${v.name} for Variant #${i + 1}.`), false
//           );
//         }
//       }
//       const mrp = Number(row.MRP);
//       const sp = Number(row.SP);
//       const stock = Number(row.totalStocks);
//       if (!mrp || mrp <= 0)
//         return setError(`Enter a valid MRP for Variant #${i + 1}.`), false;
//       if (!sp || sp <= 0)
//         return (
//           setError(`Enter a valid selling price for Variant #${i + 1}.`), false
//         );
//       if (sp > mrp)
//         return (
//           setError(
//             `Selling price cannot be greater than MRP for Variant #${i + 1}.`
//           ),
//           false
//         );
//       if (!Number.isInteger(stock) || stock < 0)
//         return (
//           setError(`Enter a valid total stock for Variant #${i + 1}.`), false
//         );
//       if (!row.thumbFile)
//         return (
//           setError(`Please add a thumbnail image for Variant #${i + 1}.`), false
//         );
//       if (row.galleryFiles.length > 10)
//         return (
//           setError(`You can upload up to 10 images for Variant #${i + 1}.`),
//           false
//         );
//     }
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;
//     setLoading(true);
//     setError("");
//     try {
//       const categoryId = selectedSubCategory || selectedCategory;
//       const rowsPayload = [];
//       for (const row of rows) {
//         const thumbnail_img = await s3Upload(
//           row.thumbFile,
//           "/api/s3/productImgUpload"
//         );
//         const galleryToUpload = row.galleryFiles.filter(Boolean);
//         const side_imgs = galleryToUpload.length
//           ? await Promise.all(
//               galleryToUpload.map((f) =>
//                 s3Upload(f, "/api/s3/productImgUpload")
//               )
//             )
//           : [];
//         rowsPayload.push({
//           values: row.values,
//           sellerMRP: Number(row.MRP),
//           sellerSP: Number(row.SP),
//           totalStock: Number(row.totalStocks),
//           thumbnail_img,
//           side_imgs,
//         });
//       }
//       const res = await api.post(
//         "/product/createProduct",
//         {
//           categoryId,
//           brandId: selectedBrand,
//           name: name.trim(),
//           description: description.trim(),
//           variantRows: rowsPayload,
//           details: details.filter((d) => d.key && d.value), // 👈 send details
//         },
//         { withCredentials: true }
//       );
//       const data = res.data;
//       setSuccessMsg(data?.message || "Product created");
//       setSuccessOpen(true);
//     } catch (err) {
//       console.error("Error creating product:", err);
//       setError(err?.response?.data?.error || err?.message || "Server error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ---------------- UI: match ProductList ---------------- */
//   return (
//     <div className="w-full">
//       <form onSubmit={handleSubmit} className="space-y-6">
//         <ErrorBanner message={error} />

//         {/* Basic Info */}
//         <div className="grid gap-4 sm:max-w-xl">
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-medium">Product Name</label>
//             <input
//               type="text"
//               className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
//               onChange={(e) => setName(e.target.value)}
//               value={name}
//               required
//             />
//           </div>

//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-medium">Product Description</label>
//             <textarea
//               rows={4}
//               className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500 resize-y"
//               onChange={(e) => setDescription(e.target.value)}
//               value={description}
//               required
//             />
//           </div>
//         </div>

//         {/* Category + Brand */}
//         <CategorySelector
//           categories={categories}
//           selectedCategory={selectedCategory}
//           setSelectedCategory={setSelectedCategory}
//           subCategories={subCategories}
//           selectedSubCategory={selectedSubCategory}
//           setSelectedSubCategory={setSelectedSubCategory}
//           brands={brands}
//           selectedBrand={selectedBrand}
//           setSelectedBrand={setSelectedBrand}
//         />

//         {/* Product Details (new section) */}
//         <div className="space-y-3">
//           <label className="text-sm font-medium">Product Details</label>
//           {details.map((d, i) => (
//             <div key={i} className="flex gap-2">
//               <input
//                 type="text"
//                 placeholder="Key"
//                 value={d.key}
//                 onChange={(e) => handleDetailChange(i, "key", e.target.value)}
//                 className="flex-1 border rounded-lg px-2 py-1"
//               />
//               <input
//                 type="text"
//                 placeholder="Value"
//                 value={d.value}
//                 onChange={(e) => handleDetailChange(i, "value", e.target.value)}
//                 className="flex-1 border rounded-lg px-2 py-1"
//               />
//               <button
//                 type="button"
//                 onClick={() => removeDetailRow(i)}
//                 className="px-2 py-1 bg-red-500 text-white rounded"
//               >
//                 X
//               </button>
//             </div>
//           ))}
//           <button
//             type="button"
//             onClick={addDetailRow}
//             className="px-3 py-1 bg-gray-200 rounded"
//           >
//             + Add Detail
//           </button>
//         </div>

//         {/* Variant boxes */}
//         <VariantList
//           variants={variants}
//           rows={rows}
//           onVariantChange={handleVariantChange}
//           onPriceChange={handlePriceChange}
//           onThumbChange={handleThumbChange}
//           onGalleryChange={handleGalleryChange}
//           onClearGalleryAt={clearGalleryAt}
//           onAddRow={addRow}
//           onRemoveRow={removeRow}
//         />

//         {/* Actions */}
//         <div className="flex gap-3 pt-2">
//           <button
//             type="submit"
//             disabled={loading}
//             className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-white shadow-sm hover:bg-orange-700 active:scale-[.98] disabled:opacity-60"
//           >
//             {loading ? "Saving..." : "Add Product"}
//           </button>
//         </div>
//       </form>

//       <SuccessModal
//         open={successOpen}
//         message={successMsg}
//         onOK={() => {
//           setSuccessOpen(false);
//           setName("");
//           setDescription("");
//           setSelectedCategory("");
//           setSelectedSubCategory("");
//           setVariants([]);
//           setBrands([]);
//           setSelectedBrand("");
//           setRows([EMPTY_ROW()]);
//           setDetails([EMPTY_DETAIL()]); // reset details
//           setError("");
//         }}
//       />
//     </div>
//   );
// };

// export default AddProductComponent;




////////////////



"use client";
import React, { useEffect, useState } from "react";
import { s3Upload } from "@/lib/s3Upload";
import ErrorBanner from "@/components/product/ErrorBanner";
import SuccessModal from "@/components/SuccessModal";
import CategorySelector from "@/components/product/CategorySelector";
import VariantList from "@/components/product/VariantList";
import api from "@/lib/axios";

const EMPTY_ROW = () => ({
  values: {},
  MRP: "",
  SP: "",
  totalStocks: "",
  thumbFile: null,
  galleryFiles: [],
  uploadKey: Math.random(),
  discountPct: 0,
});

const EMPTY_DETAIL = () => ({ key: "", value: "" });

const AddProductComponent = () => {
  // ----- state (unchanged) -----
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [variants, setVariants] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [rows, setRows] = useState([EMPTY_ROW()]);
  const [details, setDetails] = useState([EMPTY_DETAIL()]); // product key details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ----- effects (unchanged) -----
  useEffect(() => {
    let ignore = false;
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/product/getCategories", {
          signal: abort.signal,
        });
        const data = await res.json();
        if (!ignore && !data.error)
          setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!ignore) console.error("Error fetching categories:", err);
      }
    })();
    return () => {
      ignore = true;
      abort.abort();
    };
  }, []);

  useEffect(() => {
    const selected = categories.find((c) => c._id === selectedCategory);
    setSubCategories(selected?.children?.length ? selected.children : []);
    setSelectedSubCategory("");
  }, [selectedCategory, categories]);

  useEffect(() => {
    const categoryId = selectedSubCategory || selectedCategory;
    if (!categoryId) {
      setVariants([]);
      setRows([EMPTY_ROW()]);
      return;
    }
    let ignore = false;
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/product/getVariants?categoryId=${categoryId}`,
          { signal: abort.signal }
        );
        const data = await res.json();
        if (!ignore && !data.error) {
          setVariants(Array.isArray(data) ? data : []);
          setRows([EMPTY_ROW()]);
        }
      } catch (err) {
        if (!ignore) console.error("Error fetching variants:", err);
      }
    })();
    return () => {
      ignore = true;
      abort.abort();
    };
  }, [selectedSubCategory, selectedCategory]);

  useEffect(() => {
    const categoryId = selectedSubCategory || selectedCategory;
    if (!categoryId) {
      setBrands([]);
      setSelectedBrand("");
      return;
    }
    let ignore = false;
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/product/getBrands?categoryId=${categoryId}`,
          { signal: abort.signal }
        );
        const data = await res.json();
        const rawList = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        const normalized = rawList
          .map((b) => ({
            id: b.brandId || b._id || b.id,
            name: b.name,
          }))
          .filter((b) => b.id && b.name);
        if (!ignore) {
          setBrands(normalized);
          setSelectedBrand("");
        }
      } catch (err) {
        if (!ignore) console.error("Error fetching brands:", err);
      }
    })();
    return () => {
      ignore = true;
      abort.abort();
    };
  }, [selectedSubCategory, selectedCategory]);

  // ----- handlers (unchanged) -----
  const handleVariantChange = (rowIdx, variantId, value) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIdx], values: { ...next[rowIdx].values } };
      row.values[variantId] = value;
      next[rowIdx] = row;
      return next;
    });
  };

  const handlePriceChange = (rowIdx, { field, value }) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIdx] };
      row[field] = value;
      const mrp = parseFloat(row.MRP || "0");
      const sp = parseFloat(row.SP || "0");
      row.discountPct =
        !mrp || !sp || sp > mrp ? 0 : Math.round(((mrp - sp) / mrp) * 100);
      next[rowIdx] = row;
      return next;
    });
  };

  const handleThumbChange = (rowIdx, e) => {
    const file = e.target.files?.[0] || null;
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIdx ? { ...r, thumbFile: file, uploadKey: Math.random() } : r
      )
    );
  };

  const handleGalleryChange = (rowIdx, index, e) => {
    const file = e.target.files?.[0] || null;
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        const nextGallery = Array.isArray(r.galleryFiles)
          ? [...r.galleryFiles]
          : [];
        if (index >= nextGallery.length) {
          for (let j = nextGallery.length; j <= index; j++)
            nextGallery.push(null);
        }
        nextGallery[index] = file;
        return { ...r, galleryFiles: nextGallery };
      })
    );
  };

  const clearGalleryAt = (rowIdx, index) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIdx
          ? {
              ...r,
              galleryFiles: r.galleryFiles
                .map((f, j) => (j === index ? null : f))
                .filter((x, j, arr) => !(j === arr.length - 1 && x === null)),
            }
          : r
      )
    );
  };

  const addRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);
  const removeRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  // ----- product details handlers (UI-only) -----
  const handleDetailChange = (idx, field, value) => {
    setDetails((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  const addDetailRow = () => setDetails((prev) => [...prev, EMPTY_DETAIL()]);
  const removeDetailRow = (idx) =>
    setDetails((prev) => prev.filter((_, i) => i !== idx));

  // ----- validation + submit (unchanged) -----
  const validateForm = () => {
    setError("");
    if (!name.trim()) return setError("Please enter a product name."), false;
    if (!description.trim())
      return setError("Please enter a product description."), false;
    const categoryId = selectedSubCategory || selectedCategory;
    if (!categoryId)
      return setError("Please choose a category or subcategory."), false;
    if (!selectedBrand) return setError("Please select a brand."), false;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (const v of variants) {
        if (!row?.values?.[v.variantId]) {
          return (
            setError(`Please select ${v.name} for Variant #${i + 1}.`), false
          );
        }
      }
      const mrp = Number(row.MRP);
      const sp = Number(row.SP);
      const stock = Number(row.totalStocks);
      if (!mrp || mrp <= 0)
        return setError(`Enter a valid MRP for Variant #${i + 1}.`), false;
      if (!sp || sp <= 0)
        return (
          setError(`Enter a valid selling price for Variant #${i + 1}.`), false
        );
      if (sp > mrp)
        return (
          setError(
            `Selling price cannot be greater than MRP for Variant #${i + 1}.`
          ),
          false
        );
      if (!Number.isInteger(stock) || stock < 0)
        return (
          setError(`Enter a valid total stock for Variant #${i + 1}.`), false
        );
      if (!row.thumbFile)
        return (
          setError(`Please add a thumbnail image for Variant #${i + 1}.`), false
        );
      if (row.galleryFiles.length > 10)
        return (
          setError(`You can upload up to 10 images for Variant #${i + 1}.`),
          false
        );
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    try {
      const categoryId = selectedSubCategory || selectedCategory;
      const rowsPayload = [];
      for (const row of rows) {
        const thumbnail_img = await s3Upload(
          row.thumbFile,
          "/api/s3/productImgUpload"
        );
        const galleryToUpload = row.galleryFiles.filter(Boolean);
        const side_imgs = galleryToUpload.length
          ? await Promise.all(
              galleryToUpload.map((f) =>
                s3Upload(f, "/api/s3/productImgUpload")
              )
            )
          : [];
        rowsPayload.push({
          values: row.values,
          sellerMRP: Number(row.MRP),
          sellerSP: Number(row.SP),
          totalStock: Number(row.totalStocks),
          thumbnail_img,
          side_imgs,
        });
      }
      const res = await api.post(
        "/product/createProduct",
        {
          categoryId,
          brandId: selectedBrand,
          name: name.trim(),
          description: description.trim(),
          variantRows: rowsPayload,
          // send only filled product key details
          details: details.filter((d) => d.key && d.value),
        },
        { withCredentials: true }
      );
      const data = res.data;
      setSuccessMsg(data?.message || "Product created");
      setSuccessOpen(true);
    } catch (err) {
      console.error("Error creating product:", err);
      setError(err?.response?.data?.error || err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI: match ProductList ---------------- */
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ErrorBanner message={error} />

        {/* Basic Info */}
        <div className="grid gap-4 sm:max-w-xl">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Product Name</label>
            <input
              type="text"
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Product Description</label>
            <textarea
              rows={4}
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500 resize-y"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              required
            />
          </div>
        </div>

        {/* Category + Brand */}
        <CategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          subCategories={subCategories}
          selectedSubCategory={selectedSubCategory}
          setSelectedSubCategory={setSelectedSubCategory}
          brands={brands}
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
        />

        {/* Product Details (polished UI, no hardcoding) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Product Details</label>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white">
            {details.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No details yet. Click “Add Detail”.
              </div>
            ) : (
              <div>
                {details.map((d, i) => (
                  <div key={i} className="grid grid-cols-12 gap-3 p-4">
                    {/* index */}
                    <div className="col-span-12 sm:col-span-1 flex items-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                        {i + 1}
                      </span>
                    </div>

                    {/* key */}
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Key (e.g., Color)"
                        value={d.key}
                        onChange={(e) =>
                          handleDetailChange(i, "key", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
                      />
                    </div>

                    {/* value */}
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Value (e.g., White)"
                        value={d.value}
                        onChange={(e) =>
                          handleDetailChange(i, "value", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
                      />
                    </div>

                    {/* remove */}
                    <div className="col-span-12 sm:col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => removeDetailRow(i)}
                        className="rounded-lg bg-red-500 px-2.5 py-1.5 text-white text-sm hover:bg-red-600 active:scale-[.98]"
                        aria-label={`Remove detail #${i + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={addDetailRow}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 active:scale-[.98]"
          >
            + Add Detail
          </button>

        </div>

        {/* Variant boxes */}
        <VariantList
          variants={variants}
          rows={rows}
          onVariantChange={handleVariantChange}
          onPriceChange={handlePriceChange}
          onThumbChange={handleThumbChange}
          onGalleryChange={handleGalleryChange}
          onClearGalleryAt={clearGalleryAt}
          onAddRow={addRow}
          onRemoveRow={removeRow}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-white shadow-sm hover:bg-orange-700 active:scale-[.98] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add Product"}
          </button>
        </div>
      </form>

      <SuccessModal
        open={successOpen}
        message={successMsg}
        onOK={() => {
          setSuccessOpen(false);
          setName("");
          setDescription("");
          setSelectedCategory("");
          setSelectedSubCategory("");
          setVariants([]);
          setBrands([]);
          setSelectedBrand("");
          setRows([EMPTY_ROW()]);
          setDetails([EMPTY_DETAIL()]); // reset details
          setError("");
        }}
      />
    </div>
  );
};

export default AddProductComponent;
