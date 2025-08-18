// components/auth/PhoneLogin.js
import { useState } from 'react';

export default function PhoneLogin({ onContinue }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="p-6 space-y-4 w-full max-w-sm bg-white shadow rounded">
      <h1 className="text-xl font-semibold">Enter your phone number</h1>
      <input
        type="tel"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          if (error) setError('');
        }}
        placeholder="Phone number"
        className="border px-3 py-2 rounded w-full"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      
    </div>
  );
}
