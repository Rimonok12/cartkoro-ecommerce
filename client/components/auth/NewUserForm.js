// components/auth/NewUserForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/axios";

export default function NewUserForm({ phone, onCompleted }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [referral, setReferral] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!agree) {
      setError("Please agree to the Terms & Privacy Policy");
      return;
    }
    setError("");

    try {
      await api.post(
        "/user/register",
        {
          full_name: username,
          email,
          phone_number: phone,
          referrerCode: referral || null,
        },
        { withCredentials: true }
      );

      // After successful registration, let the parent decide where to go.
      if (onCompleted) onCompleted();
      else window.location.href="/";
    } catch (err) {
      console.error("Registration error:", err);
      const msg = err?.response?.data?.error || "Server error";
      setError(msg);
    }
  };

  return (
    <>
      <h1 className="text-xl font-semibold">Complete your profile</h1>

      <input
        placeholder="Full Name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border px-3 py-2 rounded w-full"
        required
      />
      <input
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      />
      {/* <input
        placeholder="Referral Code (optional)"
        value={referral}
        onChange={(e) => setReferral(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      /> */}

      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <span>
          By continuing, I agree to the{" "}
          <a className="text-pink-600 font-semibold" href="/terms" target="_blank">
            Terms of Use
          </a>{" "}
          &{" "}
          <a className="text-pink-600 font-semibold" href="/privacy" target="_blank">
            Privacy Policy
          </a>{" "}
          and conditions.
        </span>
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!agree}
        className={`w-full bg-orange-600 text-white py-2 rounded ${
          agree ? "hover:bg-orange-700" : "opacity-60 cursor-not-allowed"
        }`}
      >
        Finish
      </button>
    </>
  );
}
