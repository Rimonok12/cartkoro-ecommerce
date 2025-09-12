// pages/rewards.jsx
import React, { useMemo, useState } from "react";
import { requireAuth, essentialsOnLoad } from "@/lib/ssrHelper";
import { useAppContext } from "@/context/AppContext";

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

/* ------------------------------- Page UI ---------------------------------- */

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

export default function RewardsPage(props) {
  // Prefer context (already seeded by AppContextProvider via pageProps from SSR)
  const { userData, cashbackData } = useAppContext() || {};

  // Fallback to props if context not ready for any reason
  const profile = userData || props.initialUserData || {};
  const referralCode = profile.referral_code || "REF1234";

  const balance = getCashbackBalance(
    cashbackData != null ? cashbackData : props.initialCashbackData
  );

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://cartkoro.com";
  const referralLink = `${origin}/signup?ref=${encodeURIComponent(
    referralCode
  )}`;

  // Simulator (frontend-only)
  const [orderTotal, setOrderTotal] = useState(2500);
  const [applyAmount, setApplyAmount] = useState(0);
  const canApply = useMemo(
    () => Math.min(orderTotal, balance),
    [orderTotal, balance]
  );
  const toPay = useMemo(
    () => Math.max(0, orderTotal - applyAmount),
    [orderTotal, applyAmount]
  );

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
      alert("Copied!");
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join CartKoro – get cashback!",
          text: "Use my link to sign up and earn cashback on your first order.",
          url: referralLink,
        });
      } else {
        await copy(referralLink);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/50 to-white relative">
      {/* soft glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-20%] h-72 w-[55%] rounded-full bg-gradient-to-br from-orange-200/50 via-amber-200/40 to-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-24 left-[-10%] h-72 w-[45%] rounded-full bg-gradient-to-br from-rose-200/40 via-amber-200/40 to-orange-200/50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Cashback & Referrals
          </h1>
          <p className="mt-2 text-gray-600">
            Earn on every order, share with friends, and save more—faster.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          {/* Left column */}
          <section className="space-y-6">
            <GCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-amber-700">
                    Your balance
                  </p>
                  <div className="mt-1 text-4xl font-extrabold tracking-tight text-gray-900">
                    {BDT(balance)}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Use cashback instantly at checkout.
                  </p>
                </div>
                <Badge label="Active" />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {/* Order total */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Order total
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={orderTotal}
                      onChange={(e) =>
                        setOrderTotal(Math.max(0, Number(e.target.value || 0)))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <span className="text-gray-500 text-sm">
                      {BDT(orderTotal)}
                    </span>
                  </div>
                </div>

                {/* Apply slider */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Apply cashback
                  </label>
                  <div className="mt-1">
                    <input
                      type="range"
                      min={0}
                      max={canApply}
                      step={50}
                      value={Math.min(applyAmount, canApply)}
                      onChange={(e) => setApplyAmount(Number(e.target.value))}
                      className="w-full accent-orange-600"
                    />
                    <div className="mt-1 flex justify-between text-xs text-gray-600">
                      <span>0</span>
                      <span>Max {BDT(canApply)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Applied</span>
                  <span className="font-semibold text-gray-900">
                    {BDT(applyAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">You’ll pay</span>
                  <span className="font-bold text-gray-900">{BDT(toPay)}</span>
                </div>
              </div>

              <div className="mt-5">
                <button
                  onClick={() =>
                    alert("This will be applied at checkout (frontend demo).")
                  }
                  disabled={applyAmount <= 0}
                  className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
                >
                  Apply at checkout
                </button>
              </div>
            </GCard>

            {/* Recent activity (placeholder) */}
            <GCard>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent activity
                </h3>
                <span className="text-xs rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                  Last 30 days
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/70 bg-white/80">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-700">
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    {DUMMY.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100/80">
                        <td className="px-4 py-3 flex items-center gap-2">
                          {row.type === "credit" ? <PlusIcon /> : <MinusIcon />}
                          <span className="truncate">{row.title}</span>
                        </td>
                        <td className="px-4 py-3">{row.date}</td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${
                            row.type === "credit"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {row.type === "credit" ? "+" : "-"} {BDT(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GCard>
          </section>

          {/* Right column */}
          <section className="space-y-6">
            <GCard>
              <h3 className="text-lg font-semibold text-gray-900">
                Invite & earn
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Share your link. Friends get a welcome bonus. You get cashback
                on their first order.
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/70 bg-white/80 p-3">
                  <label className="text-xs font-medium text-gray-600">
                    Your referral code
                  </label>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-lg font-bold tracking-wider text-gray-900">
                      {referralCode}
                    </span>
                    <button
                      onClick={() => copy(referralCode)}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-white"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-white/70 bg-white/80 p-3">
                  <label className="text-xs font-medium text-gray-600">
                    Referral link
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      readOnly
                      value={referralLink}
                      className="w-full truncate rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm outline-none"
                    />
                    <button
                      onClick={() => copy(referralLink)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
                    >
                      Copy
                    </button>
                    <button
                      onClick={share}
                      className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>

              <ul className="mt-5 space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Dot /> Friend signs up with your link or code
                </li>
                <li className="flex items-start gap-2">
                  <Dot /> They place their first order
                </li>
                <li className="flex items-start gap-2">
                  <Dot /> You receive instant cashback 🎉
                </li>
              </ul>
            </GCard>

            <GCard>
              <h3 className="text-lg font-semibold text-gray-900">
                How it works
              </h3>
              <ol className="mt-3 space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <Step>1</Step> Earn cashback on eligible products.
                </li>
                <li className="flex gap-2">
                  <Step>2</Step> Apply it at checkout—no coupon needed.
                </li>
                <li className="flex gap-2">
                  <Step>3</Step> Invite friends to boost your balance.
                </li>
              </ol>
              <div className="mt-4 text-xs text-gray-500">
                * Cashback may not apply on certain items, shipping, or returns.
              </div>
            </GCard>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ------------------------- Tiny UI helpers ------------------------- */

function GCard({ children }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-200/60 via-orange-300/45 to-orange-100/60 p-[1px] shadow-lg ring-1 ring-black/5">
      <div className="rounded-2xl border border-white/60 bg-white/90 p-5 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

function Badge({ label = "Active" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}

const Dot = () => (
  <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
);
const Step = ({ children }) => (
  <span className="grid h-5 w-5 place-items-center rounded-full bg-orange-600 text-[11px] font-bold text-white">
    {children}
  </span>
);

const PlusIcon = () => (
  <svg
    className="h-4 w-4 text-emerald-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path strokeWidth="2" d="M12 5v14M5 12h14" />
  </svg>
);
const MinusIcon = () => (
  <svg
    className="h-4 w-4 text-rose-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path strokeWidth="2" d="M5 12h14" />
  </svg>
);

/* ---------------------- Dummy recent activity ---------------------- */
const DUMMY = [
  {
    title: "Referral bonus – 1 friend joined",
    date: "Aug 21, 2025",
    amount: 350,
    type: "credit",
  },
  {
    title: "Cashback used on Order #KORO-1842",
    date: "Aug 19, 2025",
    amount: 500,
    type: "debit",
  },
  {
    title: "Order cashback – #KORO-1835",
    date: "Aug 17, 2025",
    amount: 220,
    type: "credit",
  },
];
