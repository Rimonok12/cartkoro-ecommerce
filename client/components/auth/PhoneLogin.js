// // components/auth/PhoneLogin.js
// "use client";

// import { useState } from "react";

// const COUNTRY_CODES = [
//   { code: "+88", label: "BD (+88)" },
// ];

// export default function PhoneLogin({ onContinue, defaultCode = "+88" }) {
//   const [code, setCode] = useState(defaultCode);
//   const [phone, setPhone] = useState("");
//   const [error, setError] = useState("");

//   const digits = phone.replace(/\D/g, "");
//   const isValidPhone =
//     code === "+88" ? /^\d{11}$/.test(digits) : /^\d{6,15}$/.test(digits);

//   const sendOtp = async () => {
//     if (!isValidPhone) return;
//     setError("");

//     const res = await fetch("/api/user/generateOtp", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ phone: digits, countryCode: code }),
//     });

//     if (res.ok) onContinue && onContinue({ nextPhone: digits, nextCode: code });
//     else {
//       const data = await res.json().catch(() => ({}));
//       setError(data.error || "Failed to send OTP. Please try again.");
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <h2 className="text-2xl font-semibold">Login/Signup</h2>

//       {/* combined field */}
//       <div className="flex items-stretch border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-gray-800">
//         <select
//           value={code}
//           onChange={(e) => setCode(e.target.value)}
//           className="px-3 outline-none bg-transparent text-gray-700"
//         >
//           {COUNTRY_CODES.map((c) => (
//             <option key={c.code} value={c.code}>
//               {c.label}
//             </option>
//           ))}
//         </select>

//         <div className="w-px bg-gray-200" />

//         <input
//           type="tel"
//           value={phone}
//           onChange={(e) => {
//             setPhone(e.target.value);
//             if (error) setError("");
//           }}
//           placeholder="Mobile Number"
//           className="flex-1 px-3 py-2 outline-none"
//         />
//       </div>

//       {error && <p className="text-red-600 text-sm">{error}</p>}

//       <button
//         onClick={sendOtp}
//         disabled={!isValidPhone}
//         className={`w-full py-3 rounded-md uppercase tracking-wide
//           ${
//             isValidPhone
//               ? "bg-gray-700 text-white hover:bg-gray-800"
//               : "bg-gray-300 text-white cursor-not-allowed"
//           }`}
//       >
//         Continue
//       </button>

//       {/* <p className="text-sm text-gray-600">
//         Have trouble logging in?{" "}
//         <a href="/help" className="text-pink-600 font-semibold">
//           Get help
//         </a>
//       </p> */}
//     </div>
//   );
// }



///////////


// components/auth/PhoneLogin.js
"use client";

import { useState } from "react";

const COUNTRY_CODES = [{ code: "+88", label: "BD (+88)" }];

export default function PhoneLogin({ onContinue, defaultCode = "+88" }) {
  const [code, setCode] = useState(defaultCode);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false); // NEW

  const digits = phone.replace(/\D/g, "");
  const isValidPhone =
    code === "+88" ? /^\d{11}$/.test(digits) : /^\d{6,15}$/.test(digits);

  const sendOtp = async () => {
    if (!isValidPhone || sending) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/user/generateOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits, countryCode: code }),
      });

      if (res.ok) {
        onContinue && onContinue({ nextPhone: digits, nextCode: code });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to send OTP. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Login/Signup</h2>

      {/* combined field */}
      <div
        className={`flex items-stretch border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-gray-800 ${
          sending ? "opacity-60" : ""
        }`}
      >
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={sending}
          className="px-3 outline-none bg-transparent text-gray-700 disabled:cursor-not-allowed"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="w-px bg-gray-200" />

        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError("");
          }}
          placeholder="Mobile Number"
          disabled={sending}
          aria-busy={sending ? "true" : "false"}
          className="flex-1 px-3 py-2 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={sendOtp}
        disabled={!isValidPhone || sending}
        className={`w-full py-3 rounded-md uppercase tracking-wide flex items-center justify-center gap-2
          ${
            isValidPhone && !sending
              ? "bg-gray-700 text-white hover:bg-gray-800"
              : "bg-gray-300 text-white cursor-not-allowed"
          }`}
      >
        {sending && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              opacity="0.25"
            />
            <path
              d="M22 12a10 10 0 0 1-10 10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
          </svg>
        )}
        {sending ? "Sending…" : "Continue"}
      </button>
    </div>
  );
}
