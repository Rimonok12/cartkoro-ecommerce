// pages/rewards.jsx
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import { essentialsOnLoad } from "@/lib/ssrHelper";

/* --------------------------- SSR (do not change) --------------------------- */
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies || {};
  if (!cookies["CK-REF-T"]) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const essentials = await essentialsOnLoad(context);
  return { props: { ...essentials.props } };
}

/* ------------------------------- Helpers ---------------------------------- */

const BDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(n) || 0));

const getCashbackBalance = (cashbackData) => {
  if (cashbackData == null) return 0;
  if (typeof cashbackData === "number") return cashbackData;
  // support various shapes
  return cashbackData;
};

/* --------------------------------- Page ----------------------------------- */

export default function RewardsPage(props) {
  // Prefer context (seeded by AppContextProvider via pageProps from SSR)
  const { userData, cashbackData, currency } = useAppContext() || {};

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-gradient-to-b from-white via-orange-50/50 to-white">
        {/* soft glows */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 right-[-20%] h-72 w-[55%] rounded-full bg-gradient-to-br from-orange-200/50 via-amber-200/40 to-rose-200/40 blur-3xl" />
          <div className="absolute -bottom-24 left-[-10%] h-72 w-[45%] rounded-full bg-gradient-to-br from-rose-200/40 via-amber-200/40 to-orange-200/50 blur-3xl" />
        </div>

        {/* Centered content */}
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-6">
          <GCard>
            <div className="text-center">
              <p className="text-sm font-semibold text-amber-700">
                Total Cashback
              </p>
              <div className="mt-1 text-5xl font-extrabold tracking-tight text-gray-900">
                {currency}{cashbackData}
              </div>

              {/* New: minimum order notice */}
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
                Your cashback will be auto applied at checkout.
              </div>
  
              <hr className="my-6 border-gray-100" />

              <h3 className="text-lg font-semibold text-gray-900">
                How it works
              </h3>
              <ol className="mx-auto mt-3 max-w-md space-y-2 text-sm text-gray-700 text-left">
                <li className="flex gap-2">
                  <Step>1</Step> Earn cashback on Signup as welcome bonus.
                </li>
                <li className="flex gap-2">
                  <Step>2</Step> It will be auto applied on checkout.
                </li>
                <li className="flex gap-2">
                  <Step>3</Step> Cashback can be usable on orders of {currency}500 or more
                </li>
              </ol>

              <div className="mt-4 text-xs text-gray-500">
                * Terms and condition apply based above points.
              </div>
            </div>
          </GCard>
        </div>
      </main>
      <Footer/>
    </>
  );
}

/* ------------------------- Tiny UI helpers ------------------------- */

function GCard({ children }) {
  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-orange-200/60 via-orange-300/45 to-orange-100/60 p-[1px] shadow-lg ring-1 ring-black/5">
      <div className="rounded-2xl border border-white/60 bg-white/90 p-8 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

const Step = ({ children }) => (
  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-orange-600 text-[11px] font-bold text-white">
    {children}
  </span>
);
