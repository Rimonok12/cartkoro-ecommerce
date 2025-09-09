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

const AddProductComponent = () => {
  // form fields (global)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // category / variants / brands
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [variants, setVariants] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");

  // variant rows
  const [rows, setRows] = useState([EMPTY_ROW()]);

  // ui
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  /* ======================= Fetch categories ======================= */
  useEffect(() => {
    let ignore = false;
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/product/getCategories", {
          signal: abort.signal,
        });
        const data = await res.json();
        if (!ignore && !data.error) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) console.error("Error fetching categories:", err);
      }
    })();
    return () => {
      ignore = true;
      abort.abort();
    };
  }, []);

  /* ======================= Category change -> subcategories reset ======================= */
  useEffect(() => {
    const selected = categories.find((c) => c._id === selectedCategory);
    setSubCategories(selected?.children?.length ? selected.children : []);
    setSelectedSubCategory("");
  }, [selectedCategory, categories]);

  /* ======================= Fetch variants when (sub)category changes ======================= */
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

  /* ======================= Fetch brands when (sub)category changes ======================= */
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
        // Using your requested route: /api/product/getBrands
        const res = await fetch(
          `/api/product/getBrands?categoryId=${categoryId}`,
          { signal: abort.signal }
        );
        const data = await res.json();
        console.log("data::", data);
        if (!ignore && !data.error) {
          // Accept either { items: [...] } or a plain array; normalize to { id, name }
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

  /* ======================= Per-row handlers ======================= */
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

  // Dynamically grow gallery array so user can add up to 10 images
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
                .filter((x, j, arr) => {
                  if (j === arr.length - 1 && x === null) return false;
                  return true;
                }),
            }
          : r
      )
    );
  };

  const addRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);
  const removeRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  /* ======================= Validation ======================= */
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

  /* ======================= Submit ======================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    try {
      const categoryId = selectedSubCategory || selectedCategory;

      // Upload images per-variant row and build the payload
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
          MRP: Number(row.MRP),
          SP: Number(row.SP),
          totalStock: Number(row.totalStocks),
          thumbnail_img,
          side_imgs,
        });
      }

      const res = await api.post(
        "/product/createProduct",
        {
          categoryId,
          brandId: selectedBrand, // included in payload
          name: name.trim(),
          description: description.trim(),
          variantRows: rowsPayload,
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

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center bg-gradient-to-b from-white to-gray-50">
      <form
        onSubmit={handleSubmit}
        className="md:p-10 p-4 space-y-6 w-full max-w-3xl"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Add Product</h1>
        <ErrorBanner message={error} />

        {/* Basic Info */}
        <div className="flex flex-col gap-1 max-w-xl">
          <label className="text-sm font-medium">Product Name</label>
          <input
            type="text"
            className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>
        <div className="flex flex-col gap-1 max-w-xl">
          <label className="text-sm font-medium">Product Description</label>
          <textarea
            rows={4}
            className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500 resize-y"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          />
        </div>

        {/* Category + Subcategory + Brand (inline, compact) */}
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

        {/* Variant boxes (each contains selectors + price + images) */}
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
            className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg disabled:opacity-60"
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
          setError("");
        }}
      />
    </div>
  );
};

export default AddProductComponent;
