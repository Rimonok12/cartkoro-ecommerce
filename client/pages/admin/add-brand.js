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
 * Add Brand (Main + Sub category separated)
 * -----------------------------------------------
 * POST /brand/createBrand  body: { categoryId, name }
 * - Pick a Main (root) category first
 * - Then pick a Subcategory (if root has children). If no children, root acts as the leaf.
 */
function AddBrandComponent() {
  // ----- form state -----
  const [rootId, setRootId] = useState("");
  const [subId, setSubId] = useState("");
  const [name, setName] = useState("");

  // ----- data state -----
  const [categories, setCategories] = useState([]); // roots with children

  // ----- ui state -----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // load categories
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

  // roots only for main dropdown
  const parentOptions = useMemo(() => {
    const isRoot = (c) => {
      if (typeof c?.level !== "undefined" && typeof c?._id !== "undefined")
        return c.level === c._id;
      if (typeof c?.parentId !== "undefined") return !c.parentId;
      return true; // top-level in tree
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

  const validate = () => {
    setError("");
    if (!name.trim()) return setError("Please enter a brand name."), false;
    if (!rootId) return setError("Please select a main category."), false;
    if ((subcategories?.length || 0) > 0 && !subId)
      return setError("Please select a sub category."), false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Prefer subId when present; otherwise allow root if it has no children
    const categoryId = subId || rootId;

    setLoading(true);
    setError("");
    try {
      const body = { categoryId, name: name.trim() };
      const res = await api.post("/product/createBrand", body, {
        withCredentials: true,
      });
      const data = res.data;
      setSuccessMsg(data?.message || "Brand created");
      setSuccessOpen(true);
    } catch (err) {
      console.error("Error creating brand:", err);
      setError(err?.response?.data?.message || err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ErrorBanner message={error} />

        {/* Category selectors */}
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
              <option value="">Select Main Category</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {rootId && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Sub Category</label>
              {selectedRoot?.children?.length ? (
                <select
                  className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
                  value={subId}
                  onChange={(e) => setSubId(e.target.value)}
                  required
                >
                  <option value="">Select Sub Category</option>
                  {subcategories.map((sc) => (
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
              <p className="text-xs text-gray-500">
                If no sub categories, brand will be attached to the main
                category.
              </p>
            </div>
          )}

          {/* Brand Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Brand Name</label>
            <input
              type="text"
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nike, Samsung, LG"
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
            {loading ? "Saving..." : "Add Brand"}
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
          setName("");
          setError("");
        }}
      />
    </div>
  );
}

export default function AddBrandPage() {
  return (
    <>
      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          <div className="w-full md:p-10 p-4">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Add Brand
              </h2>
              <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
            </div>

            <div className="flex flex-col items-center max-w-5xl w-full rounded-2xl bg-white ring-1 ring-black/5 p-4 md:p-6">
              <AddBrandComponent />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
