import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/admin/Navbar";
import Sidebar from "@/components/admin/Sidebar";
import ErrorBanner from "@/components/product/ErrorBanner";
import SuccessModal from "@/components/SuccessModal";
import { requireB2BAdmin } from "@/lib/ssrHelper";
import api from "@/lib/axios";

// pages router
export async function getServerSideProps(context) {
  return requireB2BAdmin(context);
}

/**
 * Upsert Category Margin (JS, pages router)
 * --------------------------------------------------------------
 * Backend controller signature provided (upsertCategoryMargin).
 * This UI:
 *  - Lets admin select Main + Sub category (root-only list for main).
 *  - All fields are required: spPercent, mrpPercent, priceMin, priceMax.
 *  - isActive defaults to true and is not user-editable.
 *  - POST to /product/upsertCategoryMargin (adjust if your route differs).
 */
function UpsertMarginForm() {
  // category selection
  const [rootId, setRootId] = useState("");
  const [subId, setSubId] = useState("");

  // fields (all required)
  const [spPercent, setSpPercent] = useState("");
  const [mrpPercent, setMrpPercent] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // data
  const [categories, setCategories] = useState([]);

  // ui state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // load categories (root tree)
  useEffect(() => {
    let ignore = false;
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/product/getCategories", {
          signal: abort.signal,
        });
        const data = await res.json();
        if (!ignore && !data?.error)
          setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) console.error("Error fetching categories:", e);
      }
    })();
    return () => {
      ignore = true;
      abort.abort();
    };
  }, []);

  // main/root options only
  const parentOptions = useMemo(() => {
    const isRoot = (c) => {
      if (typeof c?.level !== "undefined" && typeof c?._id !== "undefined")
        return c.level === c._id;
      if (typeof c?.parentId !== "undefined") return !c.parentId;
      return true; // top-level in a tree
    };
    return (categories || [])
      .filter(isRoot)
      .map((c) => ({ id: c._id, label: c.name }));
  }, [categories]);

  const selectedRoot = useMemo(
    () => (categories || []).find((c) => c._id === rootId),
    [categories, rootId]
  );
  const subcategories = selectedRoot?.children || [];

  const toNum = (v) => Number(v);

  const validate = () => {
    setError("");
    const leafId = subId || rootId;
    if (!leafId)
      return (
        setError(
          "Please choose a main category (and sub category if available)."
        ),
        false
      );

    if (!spPercent.trim()) return setError("spPercent is required."), false;
    if (!mrpPercent.trim()) return setError("mrpPercent is required."), false;
    if (!priceMin.trim()) return setError("priceMin is required."), false;
    if (!priceMax.trim()) return setError("priceMax is required."), false;

    const nSp = toNum(spPercent);
    const nMrp = toNum(mrpPercent);
    const nMin = toNum(priceMin);
    const nMax = toNum(priceMax);

    if (Number.isNaN(nSp))
      return setError("spPercent must be a number."), false;
    if (Number.isNaN(nMrp))
      return setError("mrpPercent must be a number."), false;
    if (Number.isNaN(nMin) || nMin < 0)
      return setError("priceMin must be a non-negative number."), false;
    if (Number.isNaN(nMax) || nMax < 0)
      return setError("priceMax must be a non-negative number."), false;
    if (nMax < nMin)
      return setError("priceMax cannot be less than priceMin."), false;

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const categoryId = subId || rootId;

    // Build payload (all required fields + default isActive true)
    const payload = {
      categoryId,
      spPercent: Number(spPercent),
      mrpPercent: Number(mrpPercent),
      priceMin: Number(priceMin),
      priceMax: Number(priceMax),
      isActive: true,
    };

    setLoading(true);
    setError("");
    try {
      const res = await api.post("/product/upsertCategoryMargin", payload, {
        withCredentials: true,
      });
      const data = res.data;
      setSuccessMsg(data?.message || "Margin upserted");
      setSuccessOpen(true);
    } catch (err) {
      console.error("Error upserting margin:", err);
      setError(err?.response?.data?.message || err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ErrorBanner message={error} />

        {/* Category pickers */}
        <div className="grid gap-4 sm:max-w-xl">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Main Category</label>
            <select
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              value={rootId}
              onChange={(e) => {
                setRootId(e.target.value);
                setSubId("");
              }}
              required
            >
              <option value="">Select main category</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {rootId && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                Subcategory{" "}
                {selectedRoot?.children?.length
                  ? "(required if listed)"
                  : "(none)"}
              </label>
              {selectedRoot?.children?.length ? (
                <select
                  className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
                  value={subId}
                  onChange={(e) => setSubId(e.target.value)}
                  required
                >
                  <option value="">Select Sub Category</option>
                  {(selectedRoot.children || []).map((sc) => (
                    <option key={sc._id} value={sc._id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="outline-none py-2.5 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                  value="No sub categories under selected main category"
                  disabled
                />
              )}
            </div>
          )}
        </div>

        {/* Margin fields */}
        <div className="grid gap-4 sm:max-w-xl">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">SP Percent</label>
            <input
              type="number"
              step="0.01"
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              value={spPercent}
              onChange={(e) => setSpPercent(e.target.value)}
              placeholder="e.g., 10"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">MRP Percent</label>
            <input
              type="number"
              step="0.01"
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              value={mrpPercent}
              onChange={(e) => setMrpPercent(e.target.value)}
              placeholder="e.g., 5"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Price Min</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="e.g., 0"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Price Max</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="e.g., 500000"
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-white shadow-sm hover:bg-orange-700 active:scale-[.98] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Upsert Margin"}
          </button>
        </div>
      </form>

      <SuccessModal
        open={successOpen}
        message={successMsg}
        onOK={() => {
          setSuccessOpen(false);
          setRootId("");
          setSubId("");
          setSpPercent("");
          setMrpPercent("");
          setPriceMin("");
          setPriceMax("");
          setError("");
        }}
      />
    </div>
  );
}

export default function UpsertCategoryMarginPage() {
  return (
    <>
      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          <div className="w-full md:p-10 p-4">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Update Category Margin
              </h2>
              <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
            </div>

            <div className="flex flex-col items-center max-w-5xl w-full rounded-2xl bg-white ring-1 ring-black/5 p-4 md:p-6">
              <UpsertMarginForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
