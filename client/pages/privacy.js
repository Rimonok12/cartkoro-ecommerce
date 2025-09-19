// pages/privacy.js
"use client";

import Head from "next/head";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { essentialsOnLoad } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);
  return { props: { ...essentials.props } };
}
export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <Head>
        <title>Privacy Policy</title>
        <meta
          name="description"
          content="How we collect, use, and protect your information."
        />
      </Head>

      <main className="min-h-screen bg-[#f6f7fb]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <article className="prose prose-gray max-w-none bg-white rounded-2xl shadow ring-1 ring-black/5 p-6">
            <h1>Privacy Policy</h1>
            <p><em>Last updated: September 19, 2025</em></p>

            <h2>1. Scope</h2>
            <p>
              This policy explains what data we collect, how we use it, and your
              choices.
            </p>

            <h2>2. Information We Collect</h2>
            <ul>
              <li>Account & contact details you provide.</li>
              <li>Usage data, device info, and cookies.</li>
            </ul>

            <h2>3. How We Use Information</h2>
            <ul>
              <li>Provide, maintain, and improve our services.</li>
              <li>Personalize experience and communicate with you.</li>
              <li>Ensure security, prevent fraud, comply with laws.</li>
            </ul>

            <h2>4. Sharing & Third-Parties</h2>
            <p>
              We may share data with service providers under strict agreements.
            </p>

            <h2>5. Cookies & Similar Technologies</h2>
            <p>
              We use cookies to keep you signed in and analyze traffic. You can
              control cookies in your browser.
            </p>

            <h2>6. Your Rights & Choices</h2>
            <ul>
              <li>Access, update, or delete your data (subject to law).</li>
              <li>Opt out of marketing communications.</li>
            </ul>

            <h2>7. Security & Retention</h2>
            <p>
              We use reasonable safeguards and retain data only as long as
              necessary.
            </p>

            <h2>8. Changes</h2>
            <p>
              We’ll post updates here. Continued use means you accept the
              updated policy.
            </p>

            <h2>9. Contact</h2>
            <p>
              Questions? Email{" "}
              <a href="mailto:info@cartkoro.com">info@cartkoro.com</a>.
            </p>
          </article>
        </div>
      </main>

      <Footer />
    </>
  );
}
