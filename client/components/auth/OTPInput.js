// "use client";

// import { useEffect, useRef, useState } from "react";
// import { setAccessToken } from "@/lib/axios";

// const OTP_LENGTH = 6;
// const VALIDITY_SEC = 180; // 3 minutes (unchanged)
// const RESEND_AFTER_SEC = 60; // allow resend after 1 minute

// export default function OTPInput({ phone, countryCode = "+88", onVerify }) {
//   const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
//   const [error, setError] = useState("");
//   const [secondsLeft, setSecondsLeft] = useState(VALIDITY_SEC);
//   const [resending, setResending] = useState(false);

//   const inputs = useRef([]);
//   const timerRef = useRef(null);

//   const handleChange = (value, idx) => {
//     if (!/^\d?$/.test(value)) return;
//     const next = [...otp];
//     next[idx] = value;
//     setOtp(next);
//     if (value && idx < OTP_LENGTH - 1) {
//       inputs.current[idx + 1]?.focus();
//     }
//   };

//   const handleKeyDown = (e, idx) => {
//     if (e.key === "Backspace" && !otp[idx] && idx > 0) {
//       inputs.current[idx - 1]?.focus();
//     }
//   };

//   const handlePaste = (e) => {
//     e.preventDefault();
//     const pasted = e.clipboardData.getData("text").trim();
//     if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(pasted)) return;
//     setOtp(pasted.split(""));
//     inputs.current[OTP_LENGTH - 1]?.focus();
//   };

//   const verify = async (code) => {
//     const res = await fetch("/api/user/verifyOtp", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ phone, otp: code }),
//       credentials: "include",
//     });
//     const data = await res.json().catch(() => ({}));

//     if (res.ok && !data.error) {
//       setError("");
//       setAccessToken(data.accessToken);
//       if (onVerify) await onVerify(!!data.newUser);
//     } else {
//       setError(data.error || "Invalid OTP, please try again.");
//     }
//   };

//   useEffect(() => {
//     const code = otp.join("");
//     if (code.length === OTP_LENGTH && /^\d+$/.test(code)) {
//       verify(code);
//     }
//   }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

//   const startTimer = () => {
//     setSecondsLeft(VALIDITY_SEC);
//     if (timerRef.current) clearInterval(timerRef.current);
//     timerRef.current = setInterval(() => {
//       setSecondsLeft((s) => {
//         if (s <= 1) {
//           clearInterval(timerRef.current);
//           return 0;
//         }
//         return s - 1;
//       });
//     }, 1000);
//   };

//   useEffect(() => {
//     startTimer();
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [phone, countryCode]);

//   const mmss = (total) => {
//     const m = Math.floor(total / 60)
//       .toString()
//       .padStart(1, "0");
//     const s = (total % 60).toString().padStart(2, "0");
//     return `${m}:${s}`;
//   };

//   // NEW: show "Resend" once 60s have elapsed (even if code still valid)
//   const canResend = secondsLeft <= VALIDITY_SEC - RESEND_AFTER_SEC;

//   const resendOtp = async () => {
//     if (!canResend || resending) return;
//     setResending(true);
//     setError("");
//     try {
//       const r = await fetch("/api/user/generateOtp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ phone, countryCode }),
//         credentials: "include",
//       });
//       if (!r.ok) {
//         const d = await r.json().catch(() => ({}));
//         throw new Error(d.error || "Failed to resend OTP");
//       }
//       setOtp(Array(OTP_LENGTH).fill(""));
//       inputs.current[0]?.focus();
//       startTimer(); // reset the 3-minute validity window + 1-minute resend window
//     } catch (e) {
//       setError(e.message || "Failed to resend OTP. Try again.");
//     } finally {
//       setResending(false);
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <label className="block font-medium">Enter OTP</label>

//       <div className="flex space-x-2 justify-center">
//         {otp.map((digit, i) => (
//           <input
//             key={i}
//             ref={(el) => (inputs.current[i] = el)}
//             value={digit}
//             onChange={(e) => handleChange(e.target.value, i)}
//             onKeyDown={(e) => handleKeyDown(e, i)}
//             onPaste={handlePaste}
//             maxLength={1}
//             inputMode="numeric"
//             className="border w-12 h-12 text-center rounded-md text-lg
//                        focus:outline-none focus:ring-2 focus:ring-orange-500"
//           />
//         ))}
//       </div>

//       <div className="flex items-center justify-center gap-3 text-sm">
//         {!canResend ? (
//           <>
//             <span className="text-gray-600">Code expires in</span>
//             <span className="font-semibold text-gray-800">
//               {mmss(secondsLeft)}
//             </span>
//           </>
//         ) : (
//           <>
//             <span className="text-gray-600">Didn’t get the code?</span>
//             <button
//               onClick={resendOtp}
//               disabled={resending}
//               className="text-orange-600 font-semibold hover:underline disabled:opacity-60"
//             >
//               {resending ? "Sending…" : "Resend OTP"}
//             </button>
//           </>
//         )}
//       </div>

//       {error && <p className="text-red-600 text-sm text-center">{error}</p>}
//     </div>
//   );
// }



/////////


// "use client";

// import { useEffect, useRef, useState } from "react";
// import { setAccessToken } from "@/lib/axios";

// const OTP_LENGTH = 6;
// const VALIDITY_SEC = 180; // 3 minutes
// const RESEND_AFTER_SEC = 20; // allow resend after 20s

// export default function OTPInput({ phone, countryCode = "+88", onVerify }) {
//   const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
//   const [error, setError] = useState("");
//   const [secondsLeft, setSecondsLeft] = useState(VALIDITY_SEC);
//   const [resending, setResending] = useState(false);

//   const inputs = useRef([]);
//   const timerRef = useRef(null);

//   const handleChange = (value, idx) => {
//     if (!/^\d?$/.test(value)) return;
//     const next = [...otp];
//     next[idx] = value;
//     setOtp(next);
//     if (value && idx < OTP_LENGTH - 1) {
//       inputs.current[idx + 1]?.focus();
//     }
//   };

//   const handleKeyDown = (e, idx) => {
//     if (e.key === "Backspace" && !otp[idx] && idx > 0) {
//       inputs.current[idx - 1]?.focus();
//     }
//   };

//   const handlePaste = (e) => {
//     e.preventDefault();
//     const pasted = e.clipboardData.getData("text").trim();
//     if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(pasted)) return;
//     setOtp(pasted.split(""));
//     inputs.current[OTP_LENGTH - 1]?.focus();
//   };

//   const verify = async (code) => {
//     const res = await fetch("/api/user/verifyOtp", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ phone, otp: code }),
//       credentials: "include",
//     });
//     const data = await res.json().catch(() => ({}));

//     if (res.ok && !data.error) {
//       setError("");
//       setAccessToken(data.accessToken);
//       if (onVerify) await onVerify(!!data.newUser);
//     } else {
//       setError(data.error || "Invalid OTP, please try again.");
//     }
//   };

//   useEffect(() => {
//     const code = otp.join("");
//     if (code.length === OTP_LENGTH && /^\d+$/.test(code)) {
//       verify(code);
//     }
//   }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

//   const startTimer = () => {
//     setSecondsLeft(VALIDITY_SEC);
//     if (timerRef.current) clearInterval(timerRef.current);
//     timerRef.current = setInterval(() => {
//       setSecondsLeft((s) => {
//         if (s <= 1) {
//           clearInterval(timerRef.current);
//           return 0;
//         }
//         return s - 1;
//       });
//     }, 1000);
//   };

//   useEffect(() => {
//     startTimer();
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [phone, countryCode]);

//   const mmss = (total) => {
//     const m = Math.floor(total / 60).toString();
//     const s = (total % 60).toString().padStart(2, "0");
//     return `${m}:${s}`;
//   };

//   // Resend after 20s
//   const canResend = secondsLeft <= VALIDITY_SEC - RESEND_AFTER_SEC;

//   const resendOtp = async () => {
//     if (!canResend || resending) return;
//     setResending(true);
//     setError("");
//     try {
//       const r = await fetch("/api/user/generateOtp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ phone, countryCode }),
//         credentials: "include",
//       });
//       if (!r.ok) {
//         const d = await r.json().catch(() => ({}));
//         throw new Error(d.error || "Failed to resend OTP");
//       }
//       setOtp(Array(OTP_LENGTH).fill(""));
//       inputs.current[0]?.focus();
//       startTimer();
//     } catch (e) {
//       setError(e.message || "Failed to resend OTP. Try again.");
//     } finally {
//       setResending(false);
//     }
//   };

//   return (
//     <div className="space-y-4">
//       {/* <label className="block font-medium">Enter OTP</label> */}

//       <div className="flex space-x-2 justify-center">
//         {otp.map((digit, i) => (
//           <input
//             key={i}
//             ref={(el) => (inputs.current[i] = el)}
//             value={digit}
//             onChange={(e) => handleChange(e.target.value, i)}
//             onKeyDown={(e) => handleKeyDown(e, i)}
//             onPaste={handlePaste}
//             maxLength={1}
//             inputMode="numeric"
//             className="border w-12 h-12 text-center rounded-md text-lg
//                       focus:outline-none focus:ring-2 focus:ring-orange-500"
//           />
//         ))}
//       </div>

//       <div className="flex items-center justify-center gap-3 text-sm">
//         {!canResend ? (
//           <>
//             <span className="text-gray-600">Resend available in</span>
//             <span className="font-semibold text-gray-800">
//               {mmss(Math.max(0, RESEND_AFTER_SEC - (VALIDITY_SEC - secondsLeft)))}
//             </span>
//           </>
//         ) : (
//           <>
//             <span className="text-gray-600">Didn’t get the code?</span>
//             <button
//               onClick={resendOtp}
//               disabled={resending}
//               className="text-orange-600 font-semibold hover:underline disabled:opacity-60"
//             >
//               {resending ? "Sending…" : "Resend OTP"}
//             </button>
//           </>
//         )}
//       </div>

//       {/* Small note in brackets */}
//       <p className="text-center text-xs text-gray-500">
//         (This OTP will expire in next 3 minutes)
//       </p>

//       {error && <p className="text-red-600 text-sm text-center">{error}</p>}
//     </div>
//   );

// }



////////


"use client";

import { useEffect, useRef, useState } from "react";
import { setAccessToken } from "@/lib/axios";

const OTP_LENGTH = 6;
const VALIDITY_SEC = 180; // 3 minutes
const RESEND_AFTER_SEC = 20; // allow resend after 20s

export default function OTPInput({ phone, countryCode = "+88", onVerify }) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(VALIDITY_SEC);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false); // NEW: manual control

  const inputs = useRef([]);
  const timerRef = useRef(null);

  const handleChange = (value, idx) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    if (value && idx < OTP_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(pasted)) return;
    setOtp(pasted.split(""));
    inputs.current[OTP_LENGTH - 1]?.focus();
  };

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const verify = async (code) => {
    try {
      setVerifying(true);
      setError("");
      clearTimer(); // stop timer while verifying
      const res = await fetch("/api/user/verifyOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && !data.error) {
        setAccessToken(data.accessToken);
        if (onVerify) await onVerify(!!data.newUser);
      } else {
        setError(data.error || "Invalid OTP, please try again.");
        setCanResend(true); // enable resend immediately
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setCanResend(true); // allow resend on error too
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const code = otp.join("");
    if (code.length === OTP_LENGTH && /^\d+$/.test(code)) {
      verify(code);
    }
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  const startTimer = () => {
    setSecondsLeft(VALIDITY_SEC);
    setCanResend(false);
    clearTimer();
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTimer();
          return 0;
        }
        // unlock resend after 20s if no verification has happened
        if (VALIDITY_SEC - s >= RESEND_AFTER_SEC) {
          setCanResend(true);
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, [phone, countryCode]);

  const mmss = (total) => {
    const m = Math.floor(total / 60).toString();
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const resendOtp = async () => {
    if (!canResend || resending || verifying) return;
    setResending(true);
    setError("");
    try {
      const r = await fetch("/api/user/generateOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, countryCode }),
        credentials: "include",
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Failed to resend OTP");
      }
      setOtp(Array(OTP_LENGTH).fill(""));
      inputs.current[0]?.focus();
      startTimer(); // reset timer after resend
    } catch (e) {
      setError(e.message || "Failed to resend OTP. Try again.");
      setCanResend(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* OTP boxes */}
      <div className="flex space-x-2 justify-center">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            maxLength={1}
            inputMode="numeric"
            disabled={verifying || resending}
            aria-busy={verifying ? "true" : "false"}
            className={`border w-12 h-12 text-center rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition
              ${verifying ? "opacity-60" : ""} ${verifying || resending ? "bg-gray-50 cursor-not-allowed" : ""}`}
          />
        ))}
      </div>

      {/* Verifying text */}
      {verifying && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-600" role="status">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>
          <span>Verifying…</span>
        </div>
      )}

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {/* Resend row */}
      <div className="flex items-center justify-center gap-3 text-sm">
        {!canResend ? (
          <>
            <span className="text-gray-600">Resend available in</span>
            <span className="font-semibold text-gray-800">
              {mmss(Math.max(0, RESEND_AFTER_SEC - (VALIDITY_SEC - secondsLeft)))}
            </span>
          </>
        ) : (
          <>
            <span className="text-gray-600">Didn’t get the code?</span>
            <button
              onClick={resendOtp}
              disabled={resending || verifying}
              className="text-orange-600 font-semibold hover:underline disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend OTP"}
            </button>
          </>
        )}
      </div>

      {/* Small note in brackets */}
      <p className="text-center text-xs text-gray-500">
        (This OTP will expire in next 3 minutes)
      </p>

    </div>
  );
}
