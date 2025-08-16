// // components/auth/PhoneLogin.js
// import { useState } from 'react';

// export default function PhoneLogin({ onContinue }) {
//   const [phone, setPhone] = useState('');
//   const [error, setError] = useState('');

//   return (
//     <div className="p-6 space-y-4 w-full max-w-sm bg-white shadow rounded">
//       <h1 className="text-xl font-semibold">Enter your phone number</h1>
//       <input
//         type="tel"
//         value={phone}
//         onChange={(e) => {
//           setPhone(e.target.value);
//           if (error) setError('');
//         }}
//         placeholder="Phone number"
//         className="border px-3 py-2 rounded w-full"
//       />
//       {error && <p className="text-red-600 text-sm">{error}</p>}

//     </div>
//   );
// }
'use client';
import { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+880', label: 'BD (+880)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'United States (+1)' },
  { code: '+44', label: 'United Kingdom (+44)' },
];

export default function PhoneLogin({ onContinue, defaultCode = '+880' }) {
  const [code, setCode] = useState(defaultCode);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const digits = phone.replace(/\D/g, '');
  const isValidPhone =
    code === '+880' ? /^\d{11}$/.test(digits) : /^\d{6,15}$/.test(digits);

  const sendOtp = async () => {
    if (!isValidPhone) return;
    setError('');

    const res = await fetch('/api/user/generateOtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: digits, countryCode: code }),
    });

    if (res.ok) onContinue?.({ nextPhone: digits, nextCode: code });
    else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Login or Signup</h2>

      {/* combined field like Myntra */}
      <div className="flex items-stretch border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-gray-800">
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="px-3 outline-none bg-transparent text-gray-700"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="w-px bg-gray-200" />
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError('');
          }}
          placeholder="Mobile Number"
          className="flex-1 px-3 py-2 outline-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={sendOtp}
        disabled={!isValidPhone}
        className={`w-full py-3 rounded-md uppercase tracking-wide
          ${
            isValidPhone
              ? 'bg-gray-700 text-white hover:bg-gray-800'
              : 'bg-gray-300 text-white cursor-not-allowed'
          }`}
      >
        Continue
      </button>

      <p className="text-sm text-gray-600">
        Have trouble logging in?{' '}
        <a href="/help" className="text-pink-600 font-semibold">
          Get help
        </a>
      </p>
    </div>
  );
}
