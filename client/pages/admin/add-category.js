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

// ---------- UI: Add Category ----------
function AddCategoryComponent() {
  // form state
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(""); // blank => root category

  // data state
  const [categories, setCategories] = useState([]);

  // ui state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // load categories for parent selector (only parent categories)
  useEffect(() => {
    let ignore = false;
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/product/getCategories", {
          signal: abort.signal,
        });
        const data = await res.json();
        if (!ignore && !data?.error) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!ignore) {
          console.error("Error fetching categories:", e);
          setCategories([]);
        }
      }
    })();
    return () => {
      ignore = true;
      abort.abort();
    };
  }, []);

  // only parent categories
  const parentOptions = useMemo(() => {
    const isRoot = (c) => {
      if (typeof c?.level !== "undefined" && typeof c?._id !== "undefined")
        return c.level === c._id;
      if (typeof c?.parentId !== "undefined") return !c.parentId;
      return true;
    };
    return (categories || [])
      .filter(isRoot)
      .map((c) => ({ id: c._id, label: c.name }));
  }, [categories]);

  const validate = () => {
    setError("");
    if (!name.trim()) return setError("Please enter a category name."), false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");
    try {
      const body = { name: name.trim() };
      if (parentId) body.parentId = parentId;

      const res = await api.post("/product/createCategory", body, {
        withCredentials: true,
      });

      const data = res.data;
      setSuccessMsg(data?.message || "Category created");
      setSuccessOpen(true);
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err?.response?.data?.message || err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ErrorBanner message={error} />

        {/* Basic Info */}
        <div className="grid gap-4 sm:max-w-xl">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Category Name</label>
            <input
              type="text"
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Parent Category (optional)
            </label>
            <select
              className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">None (make parent)</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 pt-1">
              Leave empty to create a root category. Select one to create a
              child category.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-white shadow-sm hover:bg-orange-700 active:scale-[.98] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add Category"}
          </button>
        </div>
      </form>

      <SuccessModal
        open={successOpen}
        message={successMsg}
        onOK={() => {
          setSuccessOpen(false);
          setName("");
          setParentId("");
          setError("");
        }}
      />
    </div>
  );
}

// ---------- Page wrapper ----------
export default function AddCategory() {
  return (
    <>
      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          <div className="w-full md:p-10 p-4">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Add Category
              </h2>
              <div className="mt-2 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
            </div>

            <div className="flex flex-col items-center max-w-5xl w-full rounded-2xl bg-white ring-1 ring-black/5 p-4 md:p-6">
              <AddCategoryComponent />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
