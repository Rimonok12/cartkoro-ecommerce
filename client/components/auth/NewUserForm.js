// components/auth/NewUserForm.js
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/router";
// import api from "@/lib/axios";

// export default function NewUserForm({ phone, onCompleted }) {
//   const router = useRouter();
//   const [username, setUsername] = useState("");
//   const [email, setEmail] = useState("");
//   const [referral, setReferral] = useState("");
//   const [agree, setAgree] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async () => {
//     if (!agree) {
//       setError("Please agree to the Terms & Privacy Policy");
//       return;
//     }
//     setError("");

//     try {
//       await api.post(
//         "/user/register",
//         {
//           full_name: username,
//           email,
//           phone_number: phone,
//           referrerCode: referral || null,
//         },
//         { withCredentials: true }
//       );

//       // After successful registration, let the parent decide where to go.
//       if (onCompleted) onCompleted();
//       else window.location.href="/";
//     } catch (err) {
//       console.error("Registration error:", err);
//       const msg = err?.response?.data?.error || "Server error";
//       setError(msg);
//     }
//   };

//   return (
//     <>
//       <h1 className="text-xl font-semibold">Complete your profile</h1>

//       <input
//         placeholder="Full Name"
//         value={username}
//         onChange={(e) => setUsername(e.target.value)}
//         className="border px-3 py-2 rounded w-full"
//         required
//       />
//       <input
//         placeholder="Email (optional)"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         className="border px-3 py-2 rounded w-full"
//       />
//       {/* <input
//         placeholder="Referral Code (optional)"
//         value={referral}
//         onChange={(e) => setReferral(e.target.value)}
//         className="border px-3 py-2 rounded w-full"
//       /> */}

//       <label className="flex items-start gap-3 text-sm text-gray-700">
//         <input
//           type="checkbox"
//           className="mt-1"
//           checked={agree}
//           onChange={(e) => setAgree(e.target.checked)}
//         />
//         <span>
//           By continuing, I agree to the{" "}
//           <a className="text-pink-600 font-semibold" href="/terms" target="_blank">
//             Terms of Use
//           </a>{" "}
//           &{" "}
//           <a className="text-pink-600 font-semibold" href="/privacy" target="_blank">
//             Privacy Policy
//           </a>{" "}
//           .
//         </span>
//       </label>

//       {error && <p className="text-red-600 text-sm">{error}</p>}

//       <button
//         onClick={handleSubmit}
//         disabled={!agree}
//         className={`w-full bg-orange-600 text-white py-2 rounded ${
//           agree ? "hover:bg-orange-700" : "opacity-60 cursor-not-allowed"
//         }`}
//       >
//         Finish
//       </button>
//     </>
//   );
// }



////////////



// "use client";

// import { useState } from "react";
// import { useRouter } from "next/router";
// import api from "@/lib/axios";

// export default function NewUserForm({ phone, onCompleted }) {
//   const router = useRouter();
//   const [username, setUsername] = useState("");
//   const [email, setEmail] = useState("");
//   const [referral, setReferral] = useState("");
//   const [agree, setAgree] = useState(false);
//   const [error, setError] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [nameTouched, setNameTouched] = useState(false);

//   const isNameValid = username.trim().length > 0;

//   const handleSubmit = async () => {
//     if (!agree || submitting) return;
//     if (!isNameValid) {
//       setNameTouched(true);
//       setError("Full Name is required.");
//       return;
//     }

//     setError("");
//     setSubmitting(true);

//     try {
//       await api.post(
//         "/user/register",
//         {
//           full_name: username.trim(),
//           email,
//           phone_number: phone,
//           referrerCode: referral || null,
//         },
//         { withCredentials: true }
//       );

//       if (onCompleted) onCompleted();
//       else window.location.href = "/";
//     } catch (err) {
//       console.error("Registration error:", err);
//       const msg = err?.response?.data?.error || "Server error";
//       setError(msg);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <>
//       <h1 className="text-xl font-semibold">Complete your profile</h1>

//       <div className="space-y-1">
//         <input
//           placeholder="Full Name"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           onBlur={() => setNameTouched(true)}
//           className={`border px-3 py-2 rounded w-full disabled:bg-gray-50 ${
//             nameTouched && !isNameValid ? "border-red-500" : ""
//           }`}
//           required
//           aria-invalid={nameTouched && !isNameValid ? "true" : "false"}
//           aria-describedby="name-error"
//           disabled={submitting}
//         />
//         {nameTouched && !isNameValid && (
//           <p id="name-error" className="text-red-600 text-xs">
//             Full Name is required.
//           </p>
//         )}
//       </div>

//       <input
//         placeholder="Email (optional)"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         className="border px-3 py-2 rounded w-full disabled:bg-gray-50"
//         disabled={submitting}
//       />

//       {/* Referral (optional, disabled for now) */}
//       {/* <input
//         placeholder="Referral Code (optional)"
//         value={referral}
//         onChange={(e) => setReferral(e.target.value)}
//         className="border px-3 py-2 rounded w-full disabled:bg-gray-50"
//         disabled={submitting}
//       /> */}

//       <label className="flex items-start gap-3 text-sm text-gray-700">
//         <input
//           type="checkbox"
//           className="mt-1"
//           checked={agree}
//           onChange={(e) => setAgree(e.target.checked)}
//           disabled={submitting}
//         />
//         <span>
//           By continuing, I agree to the{" "}
//           <a
//             className="text-pink-600 font-semibold"
//             href="/terms"
//             target="_blank"
//           >
//             Terms of Use
//           </a>{" "}
//           &{" "}
//           <a
//             className="text-pink-600 font-semibold"
//             href="/privacy"
//             target="_blank"
//           >
//             Privacy Policy
//           </a>
//           .
//         </span>
//       </label>

//       {error && <p className="text-red-600 text-sm">{error}</p>}

//       <button
//         onClick={handleSubmit}
//         disabled={!agree || submitting || !isNameValid}
//         className={`w-full py-2 rounded flex items-center justify-center gap-2 ${
//           agree && !submitting && isNameValid
//             ? "bg-orange-600 hover:bg-orange-700 text-white"
//             : "bg-orange-300 text-white cursor-not-allowed"
//         }`}
//         aria-busy={submitting ? "true" : "false"}
//       >
//         {submitting && (
//           <svg
//             className="animate-spin h-4 w-4"
//             viewBox="0 0 24 24"
//             aria-hidden="true"
//           >
//             <circle
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//               fill="none"
//               opacity="0.25"
//             />
//             <path
//               d="M22 12a10 10 0 0 1-10 10"
//               stroke="currentColor"
//               strokeWidth="4"
//               fill="none"
//             />
//           </svg>
//         )}
//         {submitting ? "Finishing…" : "Finish"}
//       </button>
//     </>
//   );
// }



/////////



"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/axios";

export default function NewUserForm({ phone, onCompleted }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [referral, setReferral] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const isNameValid = username.trim().length > 0;

  const handleSubmit = async () => {
    if (!agree || submitting) return;
    if (!isNameValid) {
      setNameTouched(true);
      setError("Full Name is required.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await api.post(
        "/user/register",
        {
          full_name: username.trim(),
          email,
          phone_number: phone,
          referrerCode: referral || null,
        },
        { withCredentials: true }
      );

      // Keep loading until the next page is reached.
      if (onCompleted) {
        // If parent handles redirect (e.g., full reload), wait for it to resolve.
        await onCompleted();
        return; // don't flip submitting off — we're leaving this page
      }

      // Otherwise navigate here and await success.
      const ok = await router.replace("/", undefined, { scroll: true });
      if (!ok) {
        // Fallback to hard reload if client nav returns false
        window.location.href = "/";
      }
      // Do not setSubmitting(false); component will unmount on success.
    } catch (err) {
      console.error("Registration error:", err);
      const msg = err?.response?.data?.error || "Server error";
      setError(msg);
      setSubmitting(false); // only stop loading on error
    }
  };

  return (
    <>
      <h1 className="text-xl font-semibold">Complete your profile</h1>

      <div className="space-y-1">
        <input
          placeholder="Full Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => setNameTouched(true)}
          className={`border px-3 py-2 rounded w-full disabled:bg-gray-50 ${
            nameTouched && !isNameValid ? "border-red-500" : ""
          }`}
          required
          aria-invalid={nameTouched && !isNameValid ? "true" : "false"}
          aria-describedby="name-error"
          disabled={submitting}
        />
        {nameTouched && !isNameValid && (
          <p id="name-error" className="text-red-600 text-xs">
            Full Name is required.
          </p>
        )}
      </div>

      <input
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-3 py-2 rounded w-full disabled:bg-gray-50"
        disabled={submitting}
      />

      {/* Referral (optional) */}
      {/* <input
        placeholder="Referral Code (optional)"
        value={referral}
        onChange={(e) => setReferral(e.target.value)}
        className="border px-3 py-2 rounded w-full disabled:bg-gray-50"
        disabled={submitting}
      /> */}

      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          disabled={submitting}
        />
        <span>
          By continuing, I agree to the{" "}
          <a className="text-pink-600 font-semibold" href="/terms" target="_blank">
            Terms of Use
          </a>{" "}
          &{" "}
          <a className="text-pink-600 font-semibold" href="/privacy" target="_blank">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!agree || submitting || !isNameValid}
        className={`w-full py-2 rounded flex items-center justify-center gap-2 ${
          agree && !submitting && isNameValid
            ? "bg-orange-600 hover:bg-orange-700 text-white"
            : "bg-orange-300 text-white cursor-not-allowed"
        }`}
        aria-busy={submitting ? "true" : "false"}
      >
        {submitting && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>
        )}
        {submitting ? "Finishing…" : "Finish"}
      </button>
    </>
  );
}
