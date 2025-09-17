"use client";
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/admin/Navbar";
import Sidebar from "@/components/admin/Sidebar";
import Loading from "@/components/Loading";
import { requireB2BAdmin } from "@/lib/ssrHelper";
import api from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/router";
import { assets } from "@/assets/assets";

export async function getServerSideProps(context) {
  return requireB2BAdmin(context);
}

const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);

const fmtMoney = (symbol, n) => {
  if (!isFiniteNumber(n)) return "—";                 // show dash if empty
  return `${symbol} ${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)}`;
};

const fmtPct = (n) => (isFiniteNumber(n) ? `${n.toFixed(2)}%` : "—");

const StatusPill = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
      active
        ? "bg-green-50 text-green-700 ring-green-200"
        : "bg-gray-50 text-gray-600 ring-gray-200"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
    {active ? "Active" : "Inactive"}
  </span>
);

const SortIcon = ({ dir }) => (
  <svg className="h-3.5 w-3.5 inline ml-1" viewBox="0 0 20 20" aria-hidden>
    {dir === "asc" ? (
      <path d="M10 6l4 6H6l4-6z" fill="currentColor" />
    ) : (
      <path d="M10 14L6 8h8l-4 6z" fill="currentColor" />
    )}
  </svg>
);

export default function AdminCategoryMargins() {
  const router = useRouter();
  const { currency } = useAppContext();

  // table state
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("category_name"); // createdAt | updatedAt | category_name | sp_percent | mrp_percent | price_min | price_max | is_active
  const [order, setOrder] = useState("asc");        // asc | desc
  const [q, setQ] = useState("");
  const [isActive, setIsActive] = useState("");      // "", "true", "false"

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchMargins = async () => {
    try {
        setLoading(true);
        setErrMsg("");

        const params = { isActive, q, sortBy, order };
        const res = await api.get("/product/listCategoryMargins", { params, withCredentials: true });
        setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
        console.error("fetchMarginsTree error:", e);
        setErrMsg("Failed to load margins. Please check console/network.");
        setRows([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchMargins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, order]); // search/filter triggers fetch via "Apply" button below

  const onApplyFilters = () => {
    setPage(1);
    fetchMargins();
  };

  const onClearFilters = () => {
    setQ("");
    setIsActive("");
    setPage(1);
    setSortBy("createdAt");
    setOrder("desc");
  };

  const toggleSort = (key) => {
    if (sortBy === key) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setOrder("asc");
    }
  };

  return (
    <>
      <Navbar />
      <div className="relative mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8 py-6 flex gap-4">
        <Sidebar />
        <div className="flex-1">
          <div className="flex-1 min-h-screen flex flex-col justify-between">
            {loading ? (
              <Loading />
            ) : (
              <div className="w-full md:p-10 p-4">
                <div className="mb-6 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                      Category Margins
                    </h2>
                    <div className="mt-2 h-1.5 w-40 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchMargins()}
                      className="rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm shadow-sm hover:bg-white active:scale-[.98]"
                    >
                      Refresh
                    </button>
                    <Link
                      href="/admin/margins/new"
                      className="rounded-xl bg-orange-600 px-3.5 py-2 text-sm text-white shadow-sm hover:bg-orange-700 active:scale-[.98]"
                    >
                      Add Margin
                    </Link>
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6">
                    <label className="block text-xs text-gray-600 mb-1">Search Category</label>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Type category name…"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Status</label>
                    <select
                      value={isActive}
                      onChange={(e) => setIsActive(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                    >
                      <option value="">All</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex items-end gap-2">
                    <button
                      onClick={onApplyFilters}
                      className="rounded-xl bg-gray-900 px-3.5 py-2 text-sm text-white shadow-sm hover:bg-black active:scale-[.98]"
                    >
                      Apply
                    </button>
                    <button
                      onClick={onClearFilters}
                      className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[.98]"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {errMsg && (
                  <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                    {errMsg}
                  </div>
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-700">
                        <tr className="text-left">
                            <th className="px-4 py-3 font-semibold">
                            <button className="inline-flex items-center hover:underline" onClick={() => toggleSort("category_name")}>
                                Category {sortBy === "category_name" && <SortIcon dir={order} />}
                            </button>
                            </th>
                            
                        </tr>
                      </thead>

                      <tbody>
                        {rows.length === 0 ? (
                            <div className="px-4 py-10 text-center text-gray-500">No margins found.</div>
                        ) : (
                        rows.map((group) => (
                            <div key={group.parent_id} className="mb-4 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
                            {/* Parent header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                <div className="bg-gray-100 rounded-lg p-2 ring-1 ring-gray-100">
                                    <Image src={assets.box_icon} alt="parent" className="w-8 h-8 object-contain" width={64} height={64} />
                                </div>
                                <div className="text-base font-semibold text-gray-900">{group.parent_name}</div>
                                </div>
                                {group.parent_margin && (
                                <div className="text-xs text-gray-600">
                                    <span className="mr-3">Parent SP: <span className="font-medium">{fmtPct(group.parent_margin.sp_percent)}</span></span>
                                    <span className="mr-3">Parent MRP: <span className="font-medium">{fmtPct(group.parent_margin.mrp_percent)}</span></span>
                                    <StatusPill active={!!group.parent_margin.is_active} />
                                </div>
                                ) }
                            </div>

                            {/* Children table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                <thead className="bg-white text-gray-700">
                                    <tr className="text-left">
                                    <th className="px-4 py-3 font-semibold">Subcategory</th>
                                    <th className="px-4 py-3 font-semibold">SP %</th>
                                    <th className="px-4 py-3 font-semibold">MRP %</th>
                                    <th className="px-4 py-3 font-semibold">Band Min</th>
                                    <th className="px-4 py-3 font-semibold">Band Max</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.children.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-6 text-gray-500">No subcategories.</td></tr>
                                    ) : group.children.map((r) => (
                                    <tr key={r.category_id} className="border-t border-gray-100 hover:bg-gray-50/60">
                                        <td className="px-4 py-3">{r.category_name}</td>
                                        <td className="px-4 py-3">{fmtPct(r.sp_percent)}</td>
                                        <td className="px-4 py-3">{fmtPct(r.mrp_percent)}</td>
                                        <td className="px-4 py-3">{fmtMoney(currency, r.price_min)}</td>
                                        <td className="px-4 py-3">{fmtMoney(currency, r.price_max)}</td>
                                        <td className="px-4 py-3"><StatusPill active={!!r.is_active} /></td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            </div>
                        ))
                        )}

                      </tbody>

                    </table>
                  </div>

                  {/* Footer: pagination + page size */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      Showing{" "}
                      <span className="font-medium">
                        {rows.length ? (page - 1) * limit + 1 : 0}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {(page - 1) * limit + rows.length}
                      </span>{" "}
                      of <span className="font-medium">{total}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Rows:</label>
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(parseInt(e.target.value, 10));
                          setPage(1);
                        }}
                        className="rounded-xl border border-gray-200 px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                      >
                        {[10, 20, 50, 100].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <div className="ml-2 flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <span className="text-sm text-gray-700">
                          {page} / {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tiny tip */}
                <p className="mt-3 text-xs text-gray-500">
                  Tip: click column headers to sort. Use “Apply” to run search & filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
