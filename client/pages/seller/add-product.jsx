// "use client";
// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import { assets } from "@/assets/assets";
// import { s3Upload } from "@/lib/s3Upload";
// import { Plus, Trash2 } from "lucide-react";

// const AddProduct = () => {
//   const [files, setFiles] = useState([]);
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [subCategories, setSubCategories] = useState([]);
//   const [selectedSubCategory, setSelectedSubCategory] = useState("");
//   const [variants, setVariants] = useState([]);
//   const [variantRows, setVariantRows] = useState([{ values: {} }]); // multiple rows
//   const [MRP, setMRP] = useState("");
//   const [SP, setSP] = useState("");
//   const [totalStocks, setTotalStocks] = useState("");
//   const [url, setUrl] = useState("");

//   // Fetch categories
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await fetch("/api/product/getCategories");
//         const data = await res.json();
//         if (!data.error) setCategories(data);
//       } catch (err) {
//         console.error("Error fetching categories:", err);
//       }
//     };
//     fetchCategories();
//   }, []);

//   // Update subCategories when category changes
//   useEffect(() => {
//     const selected = categories.find((c) => c._id === selectedCategory);
//     if (selected && selected.children?.length > 0) {
//       setSubCategories(selected.children);
//     } else {
//       setSubCategories([]);
//     }
//   }, [selectedCategory, categories]);

//   // Fetch variants when subCategory/category changes
//   useEffect(() => {
//     if (!selectedSubCategory && !selectedCategory) return;
//     const fetchVariants = async () => {
//       try {
//         const categoryId = selectedSubCategory || selectedCategory;
//         const res = await fetch(`/api/product/getVariants?categoryId=${categoryId}`);
//         const data = await res.json();
//         if (!data.error) setVariants(data);
//       } catch (err) {
//         console.error("Error fetching variants:", err);
//       }
//     };
//     fetchVariants();
//   }, [selectedSubCategory, selectedCategory]);

//   // Handle variant value change
//   const handleVariantChange = (rowIndex, variantId, value) => {
//     const updated = [...variantRows];
//     updated[rowIndex].values[variantId] = value;
//     setVariantRows(updated);
//   };

//   // Add new row
//   const addVariantRow = () => {
//     setVariantRows([...variantRows, { values: {} }]);
//   };

//   // Remove row
//   const removeVariantRow = (index) => {
//     setVariantRows(variantRows.filter((_, i) => i !== index));
//   };

//   async function handleFile(e) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     try {
//       const link = await s3Upload(file, "/api/s3/productImgUpload");
//       setUrl(link);
//     } catch (err) {
//       alert(err.message);
//     }
//   }

//   // Submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const categoryId = selectedSubCategory || selectedCategory;
//       const res = await fetch("/api/product/createProduct", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           categoryId,
//           name,
//           description,
//           MRP,
//           SP,
//           totalStock: totalStocks,
//           thumbnail_img: url,
//           side_imgs: files.map((f) => URL.createObjectURL(f)), // replace with uploaded links
//           variantRows, // <-- send multiple variant combinations
//         }),
//       });

//       const data = await res.json();
//       alert(data.message || "Product added successfully");
//     } catch (error) {
//       console.error("Error creating product:", error);
//       alert("Server error");
//     }
//   };

//   return (
//     <div className="flex-1 min-h-screen flex flex-col justify-between">
//       <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-2xl">
        
//         {/* Product Name */}
//         <div className="flex flex-col gap-1 max-w-md">
//           <label className="text-base font-medium">Product Name</label>
//           <input
//             type="text"
//             className="outline-none py-2 px-3 rounded border border-gray-500/40"
//             onChange={(e) => setName(e.target.value)}
//             value={name}
//             required
//           />
//         </div>

//         {/* Product Description */}
//         <div className="flex flex-col gap-1 max-w-md">
//           <label className="text-base font-medium">Product Description</label>
//           <textarea
//             rows={4}
//             className="outline-none py-2 px-3 rounded border border-gray-500/40 resize-none"
//             onChange={(e) => setDescription(e.target.value)}
//             value={description}
//             required
//           ></textarea>
//         </div>

//         {/* Category & Subcategory */}
//         <div className="flex gap-5 flex-wrap">
//           <div className="flex flex-col gap-1 w-40">
//             <label className="text-base font-medium">Category</label>
//             <select
//               className="outline-none py-2 px-3 rounded border border-gray-500/40"
//               onChange={(e) => setSelectedCategory(e.target.value)}
//               value={selectedCategory}
//             >
//               <option value="">Select</option>
//               {categories.map((c) => (
//                 <option key={c._id} value={c._id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {subCategories.length > 0 && (
//             <div className="flex flex-col gap-1 w-40">
//               <label className="text-base font-medium">Sub Category</label>
//               <select
//                 className="outline-none py-2 px-3 rounded border border-gray-500/40"
//                 onChange={(e) => setSelectedSubCategory(e.target.value)}
//                 value={selectedSubCategory}
//               >
//                 <option value="">Select</option>
//                 {subCategories.map((sc) => (
//                   <option key={sc._id} value={sc._id}>
//                     {sc.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//         </div>

//         {/* Variants */}
//         {variants.length > 0 && (
//           <div className="space-y-4 border ">
//             <h3 className="text-lg font-semibold">Variants</h3>

//             {variantRows.map((row, rowIndex) => (
//               <div
//                 key={rowIndex}
//                 className="flex gap-3 items-center p-3 rounded-md"
//               >
//                 {variants.map((variant) => (
//                   <select
//                     key={variant.variantId}
//                     className="outline-none py-2 px-3 rounded border border-gray-500/40"
//                     value={row.values[variant.variantId] || ""}
//                     onChange={(e) =>
//                       handleVariantChange(rowIndex, variant.variantId, e.target.value)
//                     }
//                   >
//                     <option value="">Select {variant.name}</option>
//                     {variant.values.map((val) => (
//                       <option key={val} value={val}>
//                         {val}
//                       </option>
//                     ))}
//                   </select>
//                 ))}

//                 {variantRows.length > 1 && (
//                   <button
//                     type="button"
//                     onClick={() => removeVariantRow(rowIndex)}
//                     className="text-red-600"
//                   >
//                     <Trash2 size={20} />
//                   </button>
//                 )}
//               </div>
//             ))}


//         {/* Prices */}
//         <div className="flex gap-5 flex-wrap">
//           <div className="flex flex-col gap-1 w-32">
//             <label className="text-base font-medium">MRP</label>
//             <input
//               type="number"
//               className="outline-none py-2 px-3 rounded border border-gray-500/40"
//               onChange={(e) => setMRP(e.target.value)}
//               value={MRP}
//               required
//             />
//           </div>
//           <div className="flex flex-col gap-1 w-32">
//             <label className="text-base font-medium">Selling Price</label>
//             <input
//               type="number"
//               className="outline-none py-2 px-3 rounded border border-gray-500/40"
//               onChange={(e) => setSP(e.target.value)}
//               value={SP}
//               required
//             />
//           </div>
//           <div className="flex flex-col gap-1 w-32">
//             <label className="text-base font-medium">Total Stocks</label>
//             <input
//               type="number"
//               className="outline-none py-2 px-3 rounded border border-gray-500/40"
//               onChange={(e) => setTotalStocks(e.target.value)}
//               value={totalStocks}
//               required
//             />
//           </div>
//         </div>

//         {/* Product Images */}
//         <div>
//           <p className="text-base font-medium">Product Thumbnail Image</p>
//           <div className="flex flex-wrap items-center gap-3 mt-2">
//             {[...Array(1)].map((_, index) => (
//               <label key={index} htmlFor={`thumb${index}`}>
//                 <input
//                   type="file"
//                   id={`thumb${index}`}
//                   hidden
//                   onChange={(e) => {
//                     const updatedFiles = [...files];
//                     updatedFiles[index] = e.target.files[0];
//                     setFiles(updatedFiles);
//                   }}
//                 />
//                 <Image
//                   className="max-w-24 cursor-pointer"
//                   src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
//                   alt=""
//                   width={100}
//                   height={100}
//                 />
//               </label>
//             ))}
//           </div>
//         </div>

//         <div>
//           <p className="text-base font-medium">Product Other Images</p>
//           <div className="flex flex-wrap items-center gap-3 mt-2">
//             {[...Array(4)].map((_, index) => (
//               <label key={index} htmlFor={`img${index}`}>
//                 <input
//                   type="file"
//                   id={`img${index}`}
//                   hidden
//                   onChange={(e) => {
//                     const updatedFiles = [...files];
//                     updatedFiles[index] = e.target.files[0];
//                     setFiles(updatedFiles);
//                   }}
//                 />
//                 <Image
//                   className="max-w-24 cursor-pointer"
//                   src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
//                   alt=""
//                   width={100}
//                   height={100}
//                 />
//               </label>
//             ))}
//           </div>
//         </div>


//         <button
//               type="button"
//               onClick={addVariantRow}
//               className="flex items-center gap-2 text-blue-600"
//             >
//               <Plus size={18} /> Add Variant
//             </button>
//           </div>
//         )}

//         <button
//           type="submit"
//           className="px-8 py-2.5 bg-orange-600 text-white font-medium rounded"
//         >
//           ADD
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddProduct;



import React from "react";
import AddProductComponent from "@/components/product/AddProductComponent";


const AddProduct=()=>{
  return <AddProductComponent />;
}

export default AddProduct;