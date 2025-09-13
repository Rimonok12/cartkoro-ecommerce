"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAppContext } from "@/context/AppContext";
import LogoutButton from "./logout";

export default function AccountDropdown() {
  const { userData } = useAppContext();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const userName = userData?.firstName || "";
  const isSuperAdmin = Boolean(userData?.is_super_admin);
  const isAdmin = Boolean(userData?.is_admin);
  const isSeller = Boolean(userData?.is_seller);

  // Close on outside click + Esc
  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleButton = () => {
    const hasUser = !!(
      userData &&
      (userData._id || userData.id || userData.firstName)
    );
    if (!hasUser) {
      router.push("/login?redirect=account/profile");
      return;
    }
    setOpen((v) => !v); // logged-in: just toggle the dropdown (same behavior as before)
  };

  const Item = ({ href, children }) => (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
      onClick={() => setOpen(false)}
      role="menuitem"
    >
      {children}
    </Link>
  );

  return (
    <div className="relative z-[220]" ref={ref}>
      <button
        type="button"
        onClick={handleButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={userName ? `Account for ${userName}` : "Login"}
        className="flex items-center gap-2 rounded-xl px-3 py-2 border border-gray-200
                  hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <svg
          className="h-5 w-5 text-gray-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19c1.8-3 5.2-3 7-3s5.2 0 7 3" />
        </svg>

        {/* Hide label on mobile, show from sm+; also truncate long names */}
        <span className="text-sm hidden sm:inline max-w-[9rem] truncate">
          {userName ? `Hi, ${userName}` : "Login"}
        </span>

        {userName && (
          <svg
            className={`h-4 w-4 text-gray-700 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
          </svg>
        )}
      </button>


      {userName && open && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl
                     border border-white/60 bg-white/95 shadow-2xl backdrop-blur
                     ring-1 ring-black/5 z-[230]"
        >
          <div className="h-1 w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400" />

          <div className="py-2">
            <Item href="/account/profile">
              <svg
                className="h-5 w-5 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.58-.915 3.316.821 2.401 2.4a1.724 1.724 0 0 0 1.066 2.574c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.915 1.58-.821 3.316-2.4 2.401a1.724 1.724 0 0 0-2.574 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.58.915-3.316-.821-2.401-2.4a1.724 1.724 0 0 0-1.066-2.574c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.915-1.58.821-3.316 2.4-2.401.97.562 2.213.11 2.574-1.066z"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  fill="currentColor"
                  className="text-gray-600"
                />
              </svg>
              <span>Profile settings</span>
            </Item>

            <Item href="/account/address">
              <svg
                className="h-5 w-5 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21s-6-5.373-6-10a6 6 0 1 1 12 0c0 4.627-6 10-6 10z"
                />
                <circle cx="12" cy="11" r="2.5" />
              </svg>
              <span>Manage addresses</span>
            </Item>

            <Item href="/my-orders">
              <svg
                className="h-5 w-5 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 13V7a2 2 0 0 0-2-2h-3l-2-2-2 2H6a2 2 0 0 0-2 2v6m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4"
                />
              </svg>
              <span>My orders</span>
            </Item>

            {isSuperAdmin && (
              <Item href="/admin">
                <svg
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeWidth="2" d="M4 13h16M4 9h16M4 17h10" />
                </svg>
                <span>Super Admin dashboard</span>
              </Item>
            )}

            {isAdmin && (
              <Item href="/admin">
                <svg
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeWidth="2" d="M4 13h16M4 9h16M4 17h10" />
                </svg>
                <span>Admin dashboard</span>
              </Item>
            )}

            {isSeller && (
              <Item href="/seller">
                <svg
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeWidth="2" d="M4 13h16M4 9h16M4 17h10" />
                </svg>
                <span>Seller dashboard</span>
              </Item>
            )}

            <div className="my-2 h-px bg-gray-100" />
            <LogoutButton
              variant="menu"
              className="text-red-600 hover:text-red-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
