// pages/login.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import PhoneLogin from "@/components/auth/PhoneLogin";
import OTPInput from "@/components/auth/OTPInput";
import NewUserForm from "@/components/auth/NewUserForm";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/axios";

export async function getServerSideProps(context) {
  const { req, query } = context;
  const cookies = req.cookies || {};
  const refreshToken = cookies["CK-REF-T"];

  if (refreshToken) {
    const destination =
      typeof query.redirect === "string" && query.redirect.trim()
        ? `/${query.redirect.replace(/^\/+/, "")}`
        : "/";
    return { redirect: { destination, permanent: false } };
  }
  return { props: {} };
}

const INTENT_KEY = "lastitemtoaddtocart";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState("phone"); // "phone" | "otp" | "newUser"
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+880");

  const redirectParam =
    typeof router.query.redirect === "string" ? router.query.redirect : "";
  const redirectTarget = redirectParam ? `/${redirectParam.replace(/^\/+/, "")}` : "/";

  // Clear stale intent safely:
  useEffect(() => {
    if (!router.isReady) return;

    // If not cart flow, wipe immediately
    if (redirectParam !== "cart") {
      try { localStorage.removeItem(INTENT_KEY); } catch {}
    }

    const handleRouteStart = () => {
      try { localStorage.removeItem(INTENT_KEY); } catch {}
    };
    const handleBeforeUnload = () => {
      try { localStorage.removeItem(INTENT_KEY); } catch {}
    };

    router.events.on("routeChangeStart", handleRouteStart);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      router.events.off("routeChangeStart", handleRouteStart);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      try { localStorage.removeItem(INTENT_KEY); } catch {}
    };
  }, [router.isReady, router.events, redirectParam]);

  // Add the LAST pending item immediately after OTP verifies:
  // - Only when redirect=cart
  // - Only when INTENT_KEY has source: "product"
  // - Rely on server-side merge in /user/updateCart
  const addLastItemToCart = async () => {
    if (redirectParam !== "cart") return;

    try {
      const raw = localStorage.getItem(INTENT_KEY);
      if (!raw) return;

      const { sku_id, quantity, source } = JSON.parse(raw) || {};
      if (!sku_id || source !== "product") {
        localStorage.removeItem(INTENT_KEY);
        return;
      }

      await api.post(
        "/user/updateCart",
        {
          items: [{ sku_id, quantity: quantity || 1 }],
          merge: true, // <-- server will merge with existing cart
        },
        { withCredentials: true }
      );

      localStorage.removeItem(INTENT_KEY);
    } catch (e) {
      console.error("Add-to-cart after OTP (server-merge) failed:", e);
      try { localStorage.removeItem(INTENT_KEY); } catch {}
    }
  };

  const handleCompletedRegistration = async () => {
    window.location.href = redirectTarget; // force SSR
  };

  return (
    <>
      <Navbar />

      <div className="login-page min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
        <div aria-hidden className="mesh z-0" />
        <div aria-hidden className="orb o1 z-0" />
        <div aria-hidden className="orb o2 z-0" />
        <div aria-hidden className="orb o3 z-0" />
        <div aria-hidden className="sparks z-0" />

        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow overflow-hidden ring-1 ring-black/5">
          <div className="relative w-full h-28 md:h-32">
            <Image
              src="/banner.png"
              alt="offers"
              width={500}
              height={222}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="w-full h-auto object-top rounded-t-2xl"
              priority
            />
          </div>

          <div className="p-6 pt-22 space-y-4">
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
              <>
                <h2 className="text-2xl font-semibold">Enter OTP</h2>
                <OTPInput
                  phone={phone}
                  countryCode={countryCode}
                  onVerify={async (isNew) => {
                    // 1) Immediately add last item once OTP is confirmed (server merges)
                    await addLastItemToCart();

                    // 2) Finish login flow
                    if (isNew) {
                      setStep("newUser");
                    } else {
                      window.location.href = redirectTarget; // force SSR
                    }
                  }}
                />
              </>
            )}

            {step === "newUser" && (
              <NewUserForm phone={phone} onCompleted={handleCompletedRegistration} />
            )}
          </div>
        </div>

        <style jsx>{`
          .login-page { background: #f6f7fb; }
          .mesh, .orb, .sparks { position: absolute; inset: 0; pointer-events: none; }
          .mesh {
            inset: -40%; filter: blur(28px);
            background:
              radial-gradient(50% 60% at 20% 10%, rgba(255, 169, 64, 0.35), transparent 60%),
              radial-gradient(60% 50% at 82% 18%, rgba(255, 99, 132, 0.28), transparent 60%),
              radial-gradient(50% 60% at 50% 90%, rgba(99, 102, 241, 0.28), transparent 60%),
              conic-gradient(from 180deg at 50% 50%, #ffe9d3, #ffd5e6, #e3e6ff, #ffe9d3);
            animation: meshSpin 60s linear infinite;
          }
          @keyframes meshSpin { to { transform: rotate(360deg) scale(1.02); } }
          .orb { width: 22rem; height: 22rem; border-radius: 9999px; filter: blur(30px); opacity: .5; }
          .o1 { top: 10%; left: -6%; background: radial-gradient(closest-side, rgba(255,140,60,.60), rgba(255,140,60,0)); animation: float1 16s ease-in-out infinite; }
          .o2 { right: 10%; bottom: -6%; background: radial-gradient(closest-side, rgba(120,80,255,.55), rgba(120,80,255,0)); animation: float2 20s ease-in-out infinite; }
          .o3 { right: -8%; top: 55%; background: radial-gradient(closest-side, rgba(255,80,140,.55), rgba(255,80,140,0)); animation: float3 18s ease-in-out infinite; }
          .sparks {
            inset: 0;
            background-image:
              radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,.35), transparent),
              radial-gradient(2px 2px at 80% 40%, rgba(255,255,255,.25), transparent),
              radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,.20), transparent),
              radial-gradient(3px 3px at 60% 20%, rgba(255,255,255,.20), transparent),
              radial-gradient(2px 2px at 70% 80%, rgba(255,255,255,.25), transparent);
            animation: twinkle 8s linear infinite;
          }
          @keyframes twinkle { 50% { opacity: .65; } }
        `}</style>
      </div>

      <Footer />
    </>
  );
}
