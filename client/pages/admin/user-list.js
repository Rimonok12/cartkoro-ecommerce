// /pages/admin/users.js
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/admin/Navbar";
import Sidebar from "@/components/admin/Sidebar";
import Loading from "@/components/Loading";
import { requireB2BAdmin } from "@/lib/ssrHelper";
import api from "@/lib/axios"; // note: no Image import now

export async function getServerSideProps(context) {
  return requireB2BAdmin(context);
}

const RoleChips = ({ user }) => {
  const roles = [];
  if (user?.is_super_admin) roles.push(["Super Admin", "bg-purple-100 text-purple-700"]);
  if (user?.is_admin) roles.push(["Admin", "bg-emerald-100 text-emerald-700"]);
  if (user?.is_seller) roles.push(["Seller", "bg-blue-100 text-blue-700"]);
  if (roles.length === 0) roles.push(["User", "bg-gray-100 text-gray-700"]);
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {roles.map(([label, cls]) => (
        <span key={label} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${cls}`}>
          {label}
        </span>
      ))}
    </div>
  );
};

const useDebounced = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

export default function AdminUserList() {
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [q, setQ] = useState("");
  const dq = useDebounced(q, 400);

  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchUsers = async (opts = {}) => {
    try {
      setErrMsg("");
      setLoading(true);
      const res = await api.get("/user/listUsersForAdmin", {
        // If you wired the proxy route: change to "/user/admin/list"
        params: {
          page: opts.page ?? page,
          limit,
          q: dq || "",
          role: role || "",
          status: status || "",
        },
        withCredentials: true,
      });
      const payload = res.data || {};
      setUsers(Array.isArray(payload.items) ? payload.items : []);
      setTotal(Number(payload.total || 0));
    } catch (e) {
      console.error("fetchUsers:", e);
      setUsers([]);
      setTotal(0);
      setErrMsg("Failed to load users. Check console/network for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({ page: 1 });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq, role, status, limit]);

  useEffect(() => {
    fetchUsers({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const EmptyState = () => (
    <div className="px-4 py-10 text-center text-gray-500">No users found.</div>
  );

  const Row = ({ user }) => {
    const name = user.full_name?.trim() || "—";
    const phone = user.phone_number || "—";
    const email = user.email || "—";
    const referral = user.referral_code || "—";
    const created = user.createdAt ? new Date(user.createdAt).toLocaleString() : "—";

    return (
      <div className="border-b last:border-b-0 border-gray-100">
        <div className="px-3 md:px-4 py-3 flex items-center gap-3 md:gap-4 hover:bg-gray-50/60 transition-colors">
          {/* Avatar removed */}
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-gray-900 text-sm md:text-base">
              {name}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              <span>{phone}</span>
              {email && email !== "—" ? (
                <>
                  <span className="mx-1">·</span>
                  <span>{email}</span>
                </>
              ) : null}
            </div>
            <RoleChips user={user} />
            <div className="text-[11px] text-gray-500 mt-1">
              <span>Referral: {referral}</span>
              <span className="mx-2">•</span>
              <span>Joined: {created}</span>
            </div>
          </div>
          {/* Optional: actions area */}
        </div>
      </div>
    );
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
                      All Users
                    </h2>
                    <div className="mt-2 h-1.5 w-40 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
                  </div>
                  <button
                    onClick={() => fetchUsers()}
                    className="rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm shadow-sm hover:bg-white active:scale-[.98]"
                  >
                    Refresh
                  </button>
                </div>

                {/* Filters */}
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="flex">
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search name / phone / email / referral…"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                    />
                  </div>
                  <div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="">All Roles</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="seller">Seller</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="">All Status</option>
                      <option value="1">Active (1)</option>
                      <option value="0">Inactive (0)</option>
                    </select>
                  </div>
                </div>

                {errMsg && (
                  <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                    {errMsg}
                  </div>
                )}

                <div className="flex flex-col items-center max-w-5xl w-full rounded-2xl bg-white ring-1 ring-black/5">
                  <div className="w-full">
                    {users.length === 0 ? <EmptyState /> : users.map((u) => (
                      <Row key={u._id} user={u} />
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <div className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </div>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
