import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <Head>

        {/* <h1> hello Rimon-shachi</h1> */}
        <title>About Us — CartKoro</title>
        <meta
          name="description"
          content="CartKoro is an e-commerce company based in Comilla, Bangladesh. We deliver authentic products, fast shipping, and best prices across Bangladesh."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 right-[-20%] h-72 w-[55%] rounded-full bg-gradient-to-br from-pink-200/40 via-fuchsia-200/30 to-indigo-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-72 w-[45%] rounded-full bg-gradient-to-br from-indigo-200/30 via-fuchsia-200/30 to-pink-200/40 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <span className="inline-block rounded-full bg-gradient-to-r from-pink-100 to-fuchsia-100 px-3 py-1 text-xs font-semibold text-pink-700 ring-1 ring-pink-200">
                  Based in Comilla, Bangladesh
                </span>

                <h1 className="mt-4 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                  We make shopping simple, fast & trusted.
                </h1>

                <p className="mt-4 text-gray-600">
                  CartKoro is a modern marketplace focused on authentic
                  products, fair prices, and delightful delivery. From daily
                  essentials to the latest gadgets, we make sure every order
                  lands at your doorstep safely and quickly.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/all-products"
                    className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
                  >
                    Start Shopping
                  </Link>
                  <a
                    href="tel:+8801540670260"
                    className="rounded-xl border border-gray-300 bg-white/80 px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
                  >
                    Call Us: +880 1540-670260
                  </a>
                </div>
              </div>

              {/* glossy image card */}
              <div className="relative w-full">
                <div className="rounded-3xl bg-gradient-to-br from-pink-200/50 via-fuchsia-200/40 to-indigo-200/50 p-[1px] shadow-2xl ring-1 ring-black/5">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-white">
                    <Image
                      src="/about-hero.svg"
                      alt="CartKoro customers unboxing with a smile"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="border-y bg-white/80 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 text-center sm:grid-cols-4 lg:px-8">
            <Stat k="10L+" v="Products Browsed" />
            <Stat k="4.8/5" v="Customer Rating" />
            <Stat k="48h" v="Avg. Delivery Time" />
            <Stat k="100%" v="Genuine & Verified" />
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Why shoppers choose CartKoro
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              title="Fast & reliable delivery"
              desc="Nationwide coverage with real-time tracking. Most orders arrive within 48 hours."
              icon={TruckIcon}
            />
            <Feature
              title="Best price, honest deals"
              desc="Transparent pricing, seasonal offers, and referral bonuses without hidden fees."
              icon={TagIcon}
            />
            <Feature
              title="Secure payments"
              desc="SSL protection with Cash on Delivery, cards, and mobile wallets."
              icon={ShieldIcon}
            />
            <Feature
              title="Easy returns"
              desc="7-day return window on eligible items with no-hassle pickups."
              icon={RefreshIcon}
            />
            <Feature
              title="Verified sellers"
              desc="Every seller and product goes through a quality & authenticity check."
              icon={CheckIcon}
            />
            <Feature
              title="Customer-first support"
              desc="Friendly team in Comilla ready to help via phone, chat, or email."
              icon={SupportIcon}
            />
          </div>
        </section>

        {/* OUR STORY / MISSION */}
        <section className="bg-white/70 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
            <div className="grid items-start gap-10 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Our Mission
                </h3>
                <p className="mt-4 text-gray-600">
                  To build Bangladesh’s most customer-centric marketplace—where
                  people can discover great products, save time, and shop with
                  total peace of mind.
                </p>
                <ul className="mt-6 space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <Bullet /> Empower local businesses and brands with a fair,
                    transparent platform.
                  </li>
                  <li className="flex items-start gap-3">
                    <Bullet /> Deliver joy—fast shipping, careful packaging, and
                    responsive support.
                  </li>
                  <li className="flex items-start gap-3">
                    <Bullet /> Keep prices honest while maintaining quality you
                    can trust.
                  </li>
                </ul>
              </div>

              {/* glass card with gradient border */}
              <GCard>
                <h4 className="text-lg font-semibold text-gray-900">
                  Company at a glance
                </h4>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Info k="Headquarters" v="Comilla, Bangladesh" />
                  <Info k="Support" v="+880 1540-670260" />
                  <Info k="Service Hours" v="10:00–20:00 (GMT+6), 7 days" />
                  <Info k="Email" v="support@cartkoro.com" />
                </dl>
                <div className="mt-6">
                  <a
                    href="tel:+8801540670260"
                    className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
                  >
                    Contact Support
                  </a>
                </div>
              </GCard>
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900">How we got here</h3>
          <ol className="mt-8 relative">
            {/* vertical gradient line */}
            <div className="absolute left-3 top-0 h-full w-[3px] rounded-full bg-gradient-to-b from-pink-400 via-fuchsia-400 to-indigo-400" />
            <TimelineItem
              title="The idea"
              body="Started in Comilla with a simple goal: make trusted online shopping accessible to everyone."
            />
            <TimelineItem
              title="First 10,000 orders"
              body="Scaled logistics partners and built a delightful order tracking experience."
            />
            <TimelineItem
              title="Growing community"
              body="Expanded categories, launched referral rewards, and onboarded verified sellers."
            />
          </ol>
        </section>

        {/* CTA */}
        <section className="border-t bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-12 text-center lg:px-8">
            <h4 className="text-xl font-semibold text-gray-900">
              Ready to experience better shopping?
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/all-products"
                className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
              >
                Browse Products
              </Link>
              <a
                href="tel:+8801540670260"
                className="rounded-xl border border-gray-300 bg-white/80 px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
              >
                Talk to us: +880 1540-670260
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------- helpers ---------- */

// Gradient-border + glass content card
function GCard({ children }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-pink-200/60 via-fuchsia-200/50 to-indigo-200/60 p-[1px] shadow-lg ring-1 ring-black/5">
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

function Stat({ k, v }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-[1px] shadow-sm ring-1 ring-black/5">
      <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-6 backdrop-blur-sm">
        <div className="text-2xl font-bold text-gray-900">{k}</div>
        <div className="mt-1 text-sm text-gray-600">{v}</div>
      </div>
    </div>
  );
}

function Feature({ title, desc, icon: Icon }) {
  return (
    <div className="group rounded-2xl bg-gradient-to-br from-white to-gray-50 p-[1px] shadow-sm ring-1 ring-black/5 transition hover:shadow-md hover:-translate-y-0.5">
      <div className="rounded-2xl border border-white/70 bg-white/80 p-5 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-content-center rounded-lg bg-gradient-to-br from-pink-100 to-indigo-100 text-gray-700 ring-1 ring-black/5">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ k, v }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-[1px] shadow-sm ring-1 ring-black/5">
      <div className="rounded-xl border border-white/70 bg-white/80 p-4 backdrop-blur-sm">
        <dt className="text-xs uppercase tracking-wide text-gray-500">{k}</dt>
        <dd className="mt-1 font-medium text-gray-900">{v}</dd>
      </div>
    </div>
  );
}

function TimelineItem({ title, body }) {
  return (
    <li className="relative ml-8 mb-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 p-[1px] shadow-sm ring-1 ring-black/5 last:mb-0">
      <div className="rounded-2xl border border-white/70 bg-white/80 p-5 backdrop-blur-sm">
        {/* node */}
        <span className="absolute left-[-31px] top-5 h-3 w-3 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 ring-4 ring-white" />
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="mt-1 text-gray-600">{body}</p>
      </div>
    </li>
  );
}

/* tiny inline icons */
function TruckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.8" d="M3 7h11v7H3zM14 10h4l3 3v1h-7z" />
      <circle cx="7.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
    </svg>
  );
}
function TagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.8" d="M3 12l9-9 9 9-9 9-9-9z" />
      <circle cx="12" cy="8" r="1.6" />
    </svg>
  );
}
function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="1.8"
        d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"
      />
      <path strokeWidth="1.8" d="M9 12l2 2 4-4" />
    </svg>
  );
}
function RefreshIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.8" d="M20 12a8 8 0 1 1-2.3-5.6M20 5v4h-4" />
    </svg>
  );
}
function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.8" d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function SupportIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path strokeWidth="1.8" d="M7 12h10M12 7v10" />
    </svg>
  );
}
function Bullet() {
  return (
    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-gray-400" />
  );
}
