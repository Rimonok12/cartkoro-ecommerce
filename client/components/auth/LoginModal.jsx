"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import PhoneLogin from "@/components/auth/PhoneLogin";
import OTPInput from "@/components/auth/OTPInput";
import NewUserForm from "@/components/auth/NewUserForm";

export default function LoginModal({ open, onClose }) {
  const router = useRouter();
  const [step, setStep] = useState("phone"); // 'phone' | 'otp' | 'newUser'
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+880");

  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setCountryCode("+880");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="relative w-full h-28 md:h-32">
          <Image
            src="/assets/login-offer.png"
            alt="offers"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-6">
          {step === "phone" && (
            <PhoneLogin
              defaultCode="+880"
              onContinue={({ nextPhone, nextCode }) => {
                setPhone(nextPhone);
                setCountryCode(nextCode);
                setStep("otp");
              }}
            />
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Enter OTP</h2>
              <OTPInput
                phone={phone}
                countryCode={countryCode} // optional for your backend
                onVerify={(isNew) => {
                  if (isNew) {
                    setStep("newUser");
                  } else {
                    onClose?.();
                    router.replace(router.asPath);
                  }
                }}
              />
            </div>
          )}

          {step === "newUser" && <NewUserForm phone={phone} />}

          <button
            onClick={onClose}
            className="block mx-auto mt-4 text-sm text-gray-500 underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
