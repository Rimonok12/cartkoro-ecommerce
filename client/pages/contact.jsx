// import Head from 'next/head';
// import Link from 'next/link';
// import api from '@/lib/axios'; // baseURL: '/api'

// export default function ContactPage() {
//   return (
//     <>
//       <Head>
//         <title>Contact Us — CartKoro</title>
//         <meta
//           name="description"
//           content="Get in touch with CartKoro — support, partnerships, and general inquiries."
//         />
//       </Head>

//       <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
//         {/* HERO */}
//         <section className="relative overflow-hidden">
//           <div className="pointer-events-none absolute -top-24 right-[-20%] h-72 w-[55%] rounded-full bg-gradient-to-br from-pink-200/40 via-fuchsia-200/30 to-indigo-200/30 blur-3xl" />
//           <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-72 w-[45%] rounded-full bg-gradient-to-br from-indigo-200/30 via-fuchsia-200/30 to-pink-200/40 blur-3xl" />

//           <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
//             <div className="grid items-center gap-10 md:grid-cols-2">
//               <div>
//                 <span className="inline-block rounded-full bg-gradient-to-r from-pink-100 to-fuchsia-100 px-3 py-1 text-xs font-semibold text-pink-700 ring-1 ring-pink-200">
//                   We’re here to help
//                 </span>
//                 <h1 className="mt-4 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
//                   Contact CartKoro Support
//                 </h1>
//                 <p className="mt-4 text-gray-600">
//                   Questions, feedback, or partnership ideas? Reach out—our team
//                   in Comilla is ready to help every day from 10:00–20:00
//                   (GMT+6).
//                 </p>

//                 <div className="mt-6 flex flex-wrap gap-3">
//                   <a
//                     href="tel:+8801540670260"
//                     className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
//                   >
//                     Call: +880 1540-670260
//                   </a>
//                   <Link
//                     href="/all-products"
//                     className="rounded-xl border border-gray-300 bg-white/80 px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
//                   >
//                     Browse Products
//                   </Link>
//                 </div>
//               </div>

//               {/* Quick info cards */}
//               <div className="grid gap-4 sm:grid-cols-2">
//                 <GCard>
//                   <h3 className="font-semibold text-gray-900">Support Hours</h3>
//                   <p className="mt-1 text-sm text-gray-600">
//                     10:00–20:00 (GMT+6), 7 days
//                   </p>
//                 </GCard>
//                 <GCard>
//                   <h3 className="font-semibold text-gray-900">Head Office</h3>
//                   <p className="mt-1 text-sm text-gray-600">
//                     Comilla, Bangladesh
//                   </p>
//                 </GCard>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* FORM + DETAILS */}
//         <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
//           <div className="grid gap-10 md:grid-cols-5">
//             {/* Glass detail card */}
//             <div className="md:col-span-2">
//               <GCard>
//                 <h4 className="text-lg font-semibold text-gray-900">
//                   Contact details
//                 </h4>
//                 <dl className="mt-4 space-y-3 text-sm text-gray-700">
//                   <div className="flex items-start gap-3">
//                     <Dot />
//                     <div>
//                       <dt className="font-medium text-gray-900">Phone</dt>
//                       <dd>
//                         <a href="tel:+8801540670260" className="text-pink-600">
//                           +880 1540-670260
//                         </a>
//                       </dd>
//                     </div>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <Dot />
//                     <div>
//                       <dt className="font-medium text-gray-900">Email</dt>
//                       <dd>
//                         <a
//                           href="mailto:support@cartkoro.com"
//                           className="text-pink-600"
//                         >
//                           support@cartkoro.com
//                         </a>
//                       </dd>
//                     </div>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <Dot />
//                     <div>
//                       <dt className="font-medium text-gray-900">Address</dt>
//                       <dd>Comilla, Bangladesh</dd>
//                     </div>
//                   </div>
//                 </dl>
//                 <p className="mt-6 text-xs text-gray-500">
//                   For order-related queries, include your Order ID to help us
//                   resolve faster.
//                 </p>
//               </GCard>
//             </div>

//             {/* Form */}
//             <div className="md:col-span-3">
//               <ContactForm />
//             </div>
//           </div>
//         </section>
//       </main>
//     </>
//   );
// }

// /* ---------- components ---------- */

// function GCard({ children }) {
//   return (
//     <div className="rounded-2xl bg-gradient-to-br from-pink-200/60 via-fuchsia-200/50 to-indigo-200/60 p-[1px] shadow-lg ring-1 ring-black/5">
//       <div className="rounded-2xl border border-white/60 bg-white/80 p-6 backdrop-blur-sm">
//         {children}
//       </div>
//     </div>
//   );
// }

// function Dot() {
//   return (
//     <span className="mt-2 inline-block h-2 w-2 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500" />
//   );
// }

// /* Contact form as a client component */
// function ContactForm() {
//   const [form, setForm] = React.useState({
//     name: '',
//     email: '',
//     subject: '',
//     message: '',
//     orderId: '',
//     hp: '', // honeypot
//   });
//   const [busy, setBusy] = React.useState(false);
//   const [ok, setOk] = React.useState('');
//   const [err, setErr] = React.useState('');

//   const onChange = (e) =>
//     setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

//   const submit = async (e) => {
//     e.preventDefault();
//     setOk('');
//     setErr('');

//     if (form.hp) return; // bot caught

//     if (!form.name.trim() || !form.message.trim()) {
//       setErr('Please provide your name and a short message.');
//       return;
//     }

//     setBusy(true);
//     try {
//       const res = await api.post(
//         '/contact',
//         {
//           name: form.name.trim(),
//           email: form.email.trim(),
//           subject: form.subject.trim(),
//           message: form.message.trim(),
//           orderId: form.orderId.trim() || undefined,
//         },
//         { withCredentials: true }
//       );

//       if (res.status >= 200 && res.status < 300) {
//         setOk('Thanks! Your message has been received. We’ll reply soon.');
//         setForm({
//           name: '',
//           email: '',
//           subject: '',
//           message: '',
//           orderId: '',
//           hp: '',
//         });
//       } else {
//         setErr(res.data?.error || 'Could not submit. Please try again.');
//       }
//     } catch (e2) {
//       setErr(
//         e2?.response?.data?.error || 'Could not submit. Please try again.'
//       );
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <GCard>
//       <h4 className="text-lg font-semibold text-gray-900">Send us a message</h4>

//       <form onSubmit={submit} className="mt-4 space-y-4">
//         {/* honeypot */}
//         <input
//           type="text"
//           name="hp"
//           value={form.hp}
//           onChange={onChange}
//           className="hidden"
//           aria-hidden="true"
//         />

//         <div className="grid gap-4 sm:grid-cols-2">
//           <div>
//             <label className="text-sm text-gray-600">Name</label>
//             <input
//               name="name"
//               value={form.name}
//               onChange={onChange}
//               className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
//               placeholder="Your full name"
//               required
//             />
//           </div>
//           <div>
//             <label className="text-sm text-gray-600">Email (optional)</label>
//             <input
//               type="email"
//               name="email"
//               value={form.email}
//               onChange={onChange}
//               className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
//               placeholder="you@example.com"
//             />
//           </div>
//         </div>

//         <div className="grid gap-4 sm:grid-cols-2">
//           <div>
//             <label className="text-sm text-gray-600">Subject</label>
//             <input
//               name="subject"
//               value={form.subject}
//               onChange={onChange}
//               className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
//               placeholder="Support / Order / Partnership"
//             />
//           </div>
//           <div>
//             <label className="text-sm text-gray-600">Order ID (optional)</label>
//             <input
//               name="orderId"
//               value={form.orderId}
//               onChange={onChange}
//               className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
//               placeholder="#CK12345"
//             />
//           </div>
//         </div>

//         <div>
//           <label className="text-sm text-gray-600">Message</label>
//           <textarea
//             name="message"
//             value={form.message}
//             onChange={onChange}
//             rows={5}
//             className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
//             placeholder="How can we help?"
//             required
//           />
//         </div>

//         {ok && <p className="text-green-600 text-sm">{ok}</p>}
//         {err && <p className="text-red-600 text-sm">{err}</p>}

//         <div className="pt-1">
//           <button
//             type="submit"
//             disabled={busy}
//             className={`rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${
//               busy
//                 ? 'bg-gray-400'
//                 : 'bg-gray-900 hover:-translate-y-0.5 hover:bg-black'
//             }`}
//           >
//             {busy ? 'Sending…' : 'Send message'}
//           </button>
//         </div>
//       </form>
//     </GCard>
//   );
// }

// // tiny runtime import to avoid React undefined in ContactForm
// import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as React from 'react';
import emailjs from '@emailjs/browser';

const SERVICE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_9rujgm8';
const TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'cartkoro_contact_us';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact Us — CartKoro</title>
        <meta
          name="description"
          content="Get in touch with CartKoro — support, partnerships, and general inquiries."
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
                  We’re here to help
                </span>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                  Contact CartKoro Support
                </h1>
                <p className="mt-4 text-gray-600">
                  Questions, feedback, or partnership ideas? Reach out—our team
                  in Comilla is ready to help every day from 10:00–20:00
                  (GMT+6).
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="tel:+8801540670260"
                    className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
                  >
                    Call: +880 1540-670260
                  </a>
                  <Link
                    href="/all-products"
                    className="rounded-xl border border-gray-300 bg-white/80 px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <GCard>
                  <h3 className="font-semibold text-gray-900">Support Hours</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    10:00–20:00 (GMT+6), 7 days
                  </p>
                </GCard>
                <GCard>
                  <h3 className="font-semibold text-gray-900">Head Office</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Comilla, Bangladesh
                  </p>
                </GCard>
              </div>
            </div>
          </div>
        </section>

        {/* FORM + DETAILS */}
        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <GCard>
                <h4 className="text-lg font-semibold text-gray-900">
                  Contact details
                </h4>
                <dl className="mt-4 space-y-3 text-sm text-gray-700">
                  <Row title="Phone">
                    <a href="tel:+8801540670260" className="text-pink-600">
                      +880 1540-670260
                    </a>
                  </Row>
                  <Row title="Email">
                    <a
                      href="mailto:support@cartkoro.com"
                      className="text-pink-600"
                    >
                      support@cartkoro.com
                    </a>
                  </Row>
                  <Row title="Address">Comilla, Bangladesh</Row>
                </dl>
                <p className="mt-6 text-xs text-gray-500">
                  For order queries, include your Order ID to help us resolve
                  faster.
                </p>
              </GCard>
            </div>

            <div className="md:col-span-3">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------- UI helpers ---------- */
function GCard({ children }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-pink-200/60 via-fuchsia-200/50 to-indigo-200/60 p-[1px] shadow-lg ring-1 ring-black/5">
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
function Row({ title, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2 inline-block h-2 w-2 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500" />
      <div>
        <dt className="font-medium text-gray-900">{title}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

/* ---------- Contact form (EmailJS) ---------- */
function ContactForm() {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    orderId: '',
    hp: '', // honeypot
  });
  const [busy, setBusy] = React.useState(false);
  const [ok, setOk] = React.useState('');
  const [err, setErr] = React.useState('');

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setOk('');
    setErr('');

    if (form.hp) return; // simple bot trap
    if (!form.name.trim() || !form.message.trim()) {
      setErr('Please provide your name and a short message.');
      return;
    }
    if (!PUBLIC_KEY) {
      setErr(
        'Missing EmailJS public key. Add NEXT_PUBLIC_EMAILJS_PUBLIC_KEY in .env.local'
      );
      return;
    }

    setBusy(true);
    try {
      const params = {
        to_email: 'rimonon12@gmail.com',

        name: form.name.trim(),
        email: (form.email || '').trim(), // shown inside the email body
        reply_to: (form.email || '').trim() || '', // used by EmailJS "Reply To" field

        subject: (form.subject || 'Contact').trim(),
        orderId: (form.orderId || '').trim(),
        message: form.message.trim(),

        page_url: typeof window !== 'undefined' ? window.location.href : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        sent_at: new Date().toLocaleString(),
      };

      // optional: drop empty keys so EmailJS doesn't complain
      Object.keys(params).forEach(
        (k) => (params[k] === '' || params[k] == null) && delete params[k]
      );

      const resp = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, {
        publicKey: PUBLIC_KEY,
      });

      if (resp.status === 200) {
        setOk('Thanks! Your message has been received. We’ll reply soon.');
        setForm({
          name: '',
          email: '',
          subject: '',
          message: '',
          orderId: '',
          hp: '',
        });
      } else {
        setErr('Could not submit. Please try again.');
      }
    } catch (e2) {
      setErr(e2?.text || e2?.message || 'Could not submit. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GCard>
      <h4 className="text-lg font-semibold text-gray-900">Send us a message</h4>

      <form onSubmit={submit} className="mt-4 space-y-4">
        {/* honeypot */}
        <input
          type="text"
          name="hp"
          value={form.hp}
          onChange={onChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Email (optional)</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={onChange}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Support / Order / Partnership"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Order ID (optional)</label>
            <input
              name="orderId"
              value={form.orderId}
              onChange={onChange}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="#CK12345"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Message</label>
          <textarea
            name="message"
            value={form.message}
            onChange={onChange}
            rows={5}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="How can we help?"
            required
          />
        </div>

        {ok && <p className="text-green-600 text-sm">{ok}</p>}
        {err && <p className="text-red-600 text-sm">{err}</p>}

        <div className="pt-1">
          <button
            type="submit"
            disabled={busy}
            className={`rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${
              busy
                ? 'bg-gray-400'
                : 'bg-gray-900 hover:-translate-y-0.5 hover:bg-black'
            }`}
          >
            {busy ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </form>
    </GCard>
  );
}
