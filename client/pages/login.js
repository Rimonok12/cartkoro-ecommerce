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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full  max-w-md bg-white rounded-2xl shadow overflow-hidden">
        {/* Banner on top (use your file in /public/images/login-offer.png) */}
        <div className="relative w-full h-28 md:h-32 ">
          <Image
            src="/banner.png"
            alt="offers"
            width={500}
            height={222}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="w-full rounded-t-2xl h-auto object-top "
            priority
          />
        </div>

        <div className="p-6 space-y-4">
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
                countryCode={countryCode} // optional; backend can ignore
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
    </div>
  );
}
