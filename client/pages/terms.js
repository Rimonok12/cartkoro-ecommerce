// pages/terms.js
"use client";

import Head from "next/head";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { essentialsOnLoad } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);
  return { props: { ...essentials.props } };
}
export default function TermsPage() {
  return (
    <>
      <Navbar />
      <Head>
        <title>Terms of Use</title>
        <meta
          name="description"
          content="The rules for using our website and services."
        />
      </Head>

      <main className="min-h-screen bg-[#f6f7fb]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <article className="prose prose-gray max-w-none bg-white rounded-2xl shadow ring-1 ring-black/5 p-6">
            <h1>Terms of Use</h1>
            <p><em>Last updated: September 19, 2025</em></p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using our website and services, you agree to be
              bound by these Terms of Use. If you do not agree, please do not
              use our services.
            </p>

            <h2>2. Accounts & Eligibility</h2>
            <p>
              To use certain features, you may need to create an account and
              provide accurate information.
            </p>

            <h2>3. Orders, Pricing & Promotions</h2>
            <p>
              All orders are subject to acceptance. Pricing and offers may
              change without notice.
            </p>

            <h2>4. Acceptable Use</h2>
            <ul>
              <li>No unlawful, harmful, or abusive behavior.</li>
              <li>No interference with service integrity or security.</li>
            </ul>

            <h2>5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we are not liable for
              indirect or consequential damages.
            </p>

            <h2>6. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Continued use constitutes
              acceptance of the revised terms.
            </p>

            <h2>7. Contact</h2>
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
