// import { useState, useEffect } from "react";
// import Image from "next/image";
// import { useRouter } from "next/router";
// import PhoneLogin from "@/components/auth/PhoneLogin";
// import OTPInput from "@/components/auth/OTPInput";
// import NewUserForm from "@/components/auth/NewUserForm";

// // keep your cookie redirect so logged-in users can't see login page
// export async function getServerSideProps(context) {
//   const { req } = context;
//   const cookies = req.cookies || {};
//   const accessToken = cookies["CK-ACC-T"];
//   const refreshToken = cookies["CK-REF-T"];

//   if (accessToken || refreshToken) {
//     return { redirect: { destination: "/", permanent: false } };
//   }
//   return { props: {} };
// }

// export default function LoginPage() {
//   const router = useRouter();
//   const [step, setStep] = useState("phone"); // 'phone' | 'otp' | 'newUser'
//   const [phone, setPhone] = useState("");
//   const [countryCode, setCountryCode] = useState("+880");

//   // optional: reset state when route changes away/back
//   useEffect(() => {
//     return () => {
//       setStep("phone");
//       setPhone("");
//       setCountryCode("+880");
//     };
//   }, []);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//       <div className="w-full  max-w-md bg-white rounded-2xl shadow overflow-hidden">
//         {/* Banner on top (use your file in /public/images/login-offer.png) */}
//         <div className="relative w-full h-28 md:h-32 ">
//           <Image
//             src="/banner.png"
//             alt="offers"
//             width={500}
//             height={222}
//             sizes="(max-width: 768px) 100vw, 33vw"
//             className="w-full rounded-t-2xl h-auto object-top "
//             priority
//           />
//         </div>

//         <div className="p-6 pt-22 space-y-4">
//           {step === "phone" && (
//             <PhoneLogin
//               defaultCode="+880"
//               onContinue={({ nextPhone, nextCode }) => {
//                 setPhone(nextPhone);
//                 setCountryCode(nextCode);
//                 setStep("otp");
//               }}
//             />
//           )}

//           {step === "otp" && (
//             <>
//               <h2 className="text-2xl font-semibold">Enter OTP</h2>
//               <OTPInput
//                 phone={phone}
//                 countryCode={countryCode} // optional; backend can ignore
//                 onVerify={(isNew) => {
//                   if (isNew) {
//                     setStep("newUser");
//                   } else {
//                     window.location.href = "/";
//                   }
//                 }}
//               />
//             </>
//           )}

//           {step === "newUser" && <NewUserForm phone={phone} />}
//         </div>
//       </div>
//     </div>
//   );
// }



import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import PhoneLogin from "@/components/auth/PhoneLogin";
import OTPInput from "@/components/auth/OTPInput";
import NewUserForm from "@/components/auth/NewUserForm";

// keep your cookie redirect so logged-in users can't see login page
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies || {};
  const accessToken = cookies["CK-ACC-T"];
  const refreshToken = cookies["CK-REF-T"];

  if (accessToken || refreshToken) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState("phone"); // 'phone' | 'otp' | 'newUser'
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+880");

  // optional: reset state when route changes away/back
  useEffect(() => {
    return () => {
      setStep("phone");
      setPhone("");
      setCountryCode("+880");
    };
  }, []);

  return (
    <div className="login-page min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      {/* Animated background layers */}
      <div aria-hidden className="mesh z-0" />
      <div aria-hidden className="orb o1 z-0" />
      <div aria-hidden className="orb o2 z-0" />
      <div aria-hidden className="orb o3 z-0" />
      <div aria-hidden className="sparks z-0" />

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow overflow-hidden ring-1 ring-black/5">
        {/* Banner on top */}
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
                onVerify={(isNew) => {
                  if (isNew) {
                    setStep("newUser");
                  } else {
                    window.location.href = "/";
                  }
                }}
              />
            </>
          )}

          {step === "newUser" && <NewUserForm phone={phone} />}
        </div>
      </div>

      {/* Page-scoped CSS for the animated background */}
      <style jsx>{`
        .login-page {
          background: #f6f7fb;
        }

        /* --- Vibrant animated gradient mesh --- */
        .mesh,
        .orb,
        .sparks {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .mesh {
          /* expand beyond viewport for smooth rotation */
          inset: -40%;
          filter: blur(28px);
          background:
            radial-gradient(50% 60% at 20% 10%, rgba(255, 169, 64, 0.35), transparent 60%),
            radial-gradient(60% 50% at 82% 18%, rgba(255, 99, 132, 0.28), transparent 60%),
            radial-gradient(50% 60% at 50% 90%, rgba(99, 102, 241, 0.28), transparent 60%),
            conic-gradient(from 180deg at 50% 50%, #ffe9d3, #ffd5e6, #e3e6ff, #ffe9d3);
          animation: meshSpin 60s linear infinite;
        }
        @keyframes meshSpin {
          to { transform: rotate(360deg) scale(1.02); }
        }

        /* floating color orbs */
        .orb {
          width: 22rem; height: 22rem;
          border-radius: 9999px;
          filter: blur(30px);
          opacity: 0.5;
        }
        .o1 {
          top: 10%; left: -6%;
          background: radial-gradient(closest-side, rgba(255,140,60,.60), rgba(255,140,60,0));
          animation: float1 16s ease-in-out infinite;
        }
        .o2 {
          right: 10%; bottom: -6%;
          background: radial-gradient(closest-side, rgba(120,80,255,.55), rgba(120,80,255,0));
          animation: float2 20s ease-in-out infinite;
        }
        .o3 {
          right: -8%; top: 55%;
          background: radial-gradient(closest-side, rgba(255,80,140,.55), rgba(255,80,140,0));
          animation: float3 18s ease-in-out infinite;
        }
        @keyframes float1 { 50% { transform: translate(20px,-10px) scale(1.05); } }
        @keyframes float2 { 50% { transform: translate(-16px,12px) scale(1.08); } }
        @keyframes float3 { 50% { transform: translate(-10px,-14px) scale(1.03); } }

        /* tiny sparkles that “breathe” */
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
  );
}
