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
 * Add Variant for Subcategories
 * -----------------------------------------------
 * Backend (per your controller):
 *   POST /variant/createVariant  body: { categoryId, name, values }
 *
 * UI behavior:
 * - Select a root category
 * - If it has children, select a subcategory (required)
 * - If no children, the root acts as the leaf and is allowed
 * - Enter variant name and values (comma or newline separated)
 */
function AddVariantComponent() {
  // ----- form state -----
  const [rootId, setRootId] = useState("");
  const [subId, setSubId] = useState("");
  const [name, setName] = useState("");
  const [valuesText, setValuesText] = useState("");

  // ----- data state -----
  const [categories, setCategories] = useState([]); // array of root nodes with children

  // ----- ui state -----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // load category tree
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

  // find selected root node
  const selectedRoot = useMemo(
    () => categories.find((c) => c._id === rootId),
    [categories, rootId]
  );
  const subcategories = selectedRoot?.children || [];

  // normalize values from textarea
  const parsedValues = useMemo(() => {
    return valuesText
      .split(/\n|,/)
      .map((v) => v.trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i); // unique
  }, [valuesText]);

  const validate = () => {
    setError("");
    if (!name.trim()) return setError("Please enter a variant name."), false;
    if (!rootId) return setError("Please select a main category."), false;
    // If root has children, require subcategory; else allow root as leaf
    if ((selectedRoot?.children?.length || 0) > 0 && !subId) {
      return setError("Please select a sub category."), false;
    }
    if (parsedValues.length === 0)
      return setError("Please enter at least one value."), false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const categoryId = subId || rootId; // subcategory preferred; root allowed only if leaf

    setLoading(true);
    setError("");
    try {
      const body = { categoryId, name: name.trim(), values: parsedValues };
      const res = await api.post("/product/createVariant", body, {
        withCredentials: true,
      });
      const data = res.data;
      setSuccessMsg(data?.message || "Variant created");
      setSuccessOpen(true);
    } catch (err) {
      console.error("Error creating variant:", err);
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
              <option value="">Select Main Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {rootId && selectedRoot?.children?.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Sub Category</label>
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
              <p className="text-xs text-gray-500">
                Required when root has children.
              </p>
            </div>
          )}
        </div>

        {/* Variant fields */}
        <div className="grid gap-4 sm:max-w-xl">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Variant Name</label>
            <input
              type="text"
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Size, Color, Material"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Values</label>
            <textarea
              rows={4}
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500 resize-y"
              value={valuesText}
              onChange={(e) => setValuesText(e.target.value)}
              placeholder="Comma or newline separated, e.g. S, M, L or red\nblue\ngreen"
              required
            />
            {parsedValues.length > 0 && (
              <p className="text-xs text-gray-600">
                Preview: {parsedValues.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-white shadow-sm hover:bg-orange-700 active:scale-[.98] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add Variant"}
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
          setValuesText("");
          setError("");
        }}
      />
    </div>
  );
}

export default function AddVariantPage() {
  return (
    <>
      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          <div className="w-full md:p-10 p-4">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Add Variant
              </h2>
              <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
            </div>

            <div className="flex flex-col items-center max-w-5xl w-full rounded-2xl bg-white ring-1 ring-black/5 p-4 md:p-6">
              <AddVariantComponent />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
