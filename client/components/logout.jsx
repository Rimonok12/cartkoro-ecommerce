"use client";

import { useState } from "react";
import { useRouter } from "next/router"; // (pages router)
import api, { setAccessToken } from "@/lib/axios";
import { useAppContext } from "@/context/AppContext";

export default function LogoutButton({ variant = "button", className = "" }) {
  const router = useRouter();
  const { logoutContext } = useAppContext();
  const [busy, setBusy] = useState(false);

  const finish = () => {
    setAccessToken(null); // clear in-memory token (if you use one)
    logoutContext();
    router.push("/login");
  };

  const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Important: tell interceptor not to refresh for this request
      await fetch("/api/user/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      finish();
    } catch (err) {
      const status = err?.response?.status;
      // If the session is already gone, treat as success UX-wise
      if (status === 401 || status === 403) {
        finish();
      } else {
        console.error("Logout failed:", err?.response?.data || err.message);
        // Still force local logout so the user isn’t stuck
        finish();
      }
    } finally {
      setBusy(false);
    }
  };

  if (variant === "menu") {
    return (
      <button
        onClick={handleLogout}
        disabled={busy}
        className={`w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60 ${className}`}
      >
        Logout
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-60 ${className}`}
    >
      {busy ? "Logging out..." : "Logout"}
    </button>
  );
}
