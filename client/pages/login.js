// import { useState } from 'react';
// import { useRouter } from 'next/router';
// import OTPInput from '../components/auth/OTPInput';
// import NewUserForm from '../components/auth/NewUserForm';
// import { requireNoAuth } from '@/lib/checkAuth';

// export async function getServerSideProps(context) {
//   const { req } = context;
//   const cookies = req.cookies || {};

//   const accessToken = cookies['CK-ACC-T'];
//   const refreshToken = cookies['CK-REF-T'];

//   if (accessToken || refreshToken) {
//     return {
//       redirect: {
//         destination: '/',
//         permanent: false,
//       },
//     };
//   }

//   return { props: {} };
// }

// export default function LoginPage() {
//   const router = useRouter();
//   const [step, setStep] = useState('phone');
//   const [phone, setPhone] = useState('');
//   const [error, setError] = useState('');

//   const sendOtp = async () => {
//     if (!/^\d{11}$/.test(phone)) {
//       setError('Please enter a valid 11-digit phone number');
//       return;
//     }

//     setError('');

//     const res = await fetch('/api/user/generateOtp', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ phone }),
//     });

//     if (res.ok) {
//       setStep('otp');
//     } else {
//       const data = await res.json();
//       setError(data.error || 'Failed to send OTP. Please try again.');
//     }
//   };

//   return (

//       <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//         <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4">
//           {(step === 'phone' || step === 'otp') &&
//             <h1 className="text-2xl font-semibold">Sign in with Phone</h1>
//           }

//           {(step === 'phone' || step === 'otp') && (<input
//             type="tel"
//             value={phone}
//             onChange={(e) => {
//               setPhone(e.target.value);
//               if (error) setError('');
//             }}
//             placeholder="Enter phone number"
//             className="border px-3 py-2 rounded w-full"
//             disabled={step === 'otp'}
//           />)}

//           {error && <p className="text-red-600 text-sm">{error}</p>}

//           {step === 'phone' && (
//             <button
//               onClick={sendOtp}
//               className="w-full bg-orange-600 text-white py-2 rounded"
//             >
//               Continue
//             </button>
//           )}

//           {step === 'otp' && (
//             <OTPInput
//               phone={phone}
//               onVerify={(isNew) => {
//                 if (isNew) {
//                   setStep('newUser'); // replace alert with register flow
//                 } else {
//                   router.push('/');
//                 }
//               }}
//             />
//           )}

//         {step === 'newUser' && (
//           <NewUserForm phone={phone} />
//         )}

//         </div>
//       </div>
//   );
// }
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import PhoneLogin from '@/components/auth/PhoneLogin';
import OTPInput from '@/components/auth/OTPInput';
import NewUserForm from '@/components/auth/NewUserForm';

// keep your cookie redirect so logged-in users can't see login page
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies || {};
  const accessToken = cookies['CK-ACC-T'];
  const refreshToken = cookies['CK-REF-T'];

  if (accessToken || refreshToken) {
    return { redirect: { destination: '/', permanent: false } };
  }
  return { props: {} };
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'newUser'
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+880');

  // optional: reset state when route changes away/back
  useEffect(() => {
    return () => {
      setStep('phone');
      setPhone('');
      setCountryCode('+880');
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow overflow-hidden">
        {/* Banner on top (use your file in /public/images/login-offer.png) */}
        <div className="relative w-full h-28 md:h-32">
          <Image
            src="/images/login-offer.png"
            alt="offers"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-6 space-y-4">
          {step === 'phone' && (
            <PhoneLogin
              defaultCode="+880"
              onContinue={({ nextPhone, nextCode }) => {
                setPhone(nextPhone);
                setCountryCode(nextCode);
                setStep('otp');
              }}
            />
          )}

          {step === 'otp' && (
            <>
              <h2 className="text-2xl font-semibold">Enter OTP</h2>
              <OTPInput
                phone={phone}
                countryCode={countryCode} // optional; backend can ignore
                onVerify={(isNew) => {
                  if (isNew) {
                    setStep('newUser');
                  } else {
                    router.replace('/'); // success -> home
                  }
                }}
              />
            </>
          )}

          {step === 'newUser' && <NewUserForm phone={phone} />}
        </div>
      </div>
    </div>
  );
}
