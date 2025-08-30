// components/auth/OTPInput.js
"use client";

import { useEffect, useRef, useState } from "react";
import { setAccessToken } from "@/lib/axios";

const OTP_LENGTH = 6;
const VALIDITY_SEC = 180; // 3 minutes

export default function OTPInput({ phone, countryCode = "+880", onVerify }) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(VALIDITY_SEC);
  const [resending, setResending] = useState(false);

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

  const verify = async (code) => {
    const res = await fetch("/api/user/verifyOtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp: code }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && !data.error) {
      setError("");
      setAccessToken(data.accessToken);
      if (onVerify) await onVerify(!!data.newUser);
    } else {
      setError(data.error || "Invalid OTP, please try again.");
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
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phone, countryCode]);

  const mmss = (total) => {
    const m = Math.floor(total / 60).toString().padStart(1, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const resendOtp = async () => {
    if (secondsLeft > 0 || resending) return;
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
      startTimer();
    } catch (e) {
      setError(e.message || "Failed to resend OTP. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block font-medium">Enter OTP</label>

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
            className="border w-12 h-12 text-center rounded-md text-lg
                       focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 text-sm">
        {secondsLeft > 0 ? (
          <>
            <span className="text-gray-600">Code expires in</span>
            <span className="font-semibold text-gray-800">{mmss(secondsLeft)}</span>
          </>
        ) : (
          <>
            <span className="text-gray-600">Didn’t get the code?</span>
            <button
              onClick={resendOtp}
              disabled={resending}
              className="text-orange-600 font-semibold hover:underline disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend OTP"}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  );
}
