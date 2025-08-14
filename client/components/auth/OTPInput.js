// components/auth/OTPInput.js
import { useRef, useState } from 'react';

export default function OTPInput({ phone, onVerify }) {
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const inputs = useRef([]);

  const handleChange = (value, idx) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);

    // Move to next box
    if (value && idx < 5) {
      inputs.current[idx + 1].focus();
    }

    // Auto-submit on last digit
    if (idx === 5 && value) {
      handleVerify([...newOtp].join(''));
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasted)) return;

    const pastedArray = pasted.split('');
    setOtp(pastedArray);
    inputs.current[5].focus();
    handleVerify(pasted);
  };

  const handleVerify = async (manualCode) => {
    const code = manualCode || otp.join('');

    if (code.length !== 6) {
      setError('Please enter the complete OTP');
      return;
    }

    const res = await fetch('/api/user/verifyOtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp: code }),
    });

    const data = await res.json();

    if (res.ok && !data.error) {
      setError('');
      onVerify(data.newUser);
    } else {
      setError(data.error || 'Invalid OTP, please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <label className="block font-medium">Enter OTP</label>
      <div className="flex space-x-2 justify-center">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            maxLength="1"
            className="border w-10 h-10 text-center rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        ))}
      </div>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <button
        type="button"
        onClick={() => handleVerify()}
        className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition"
      >
        Verify OTP
      </button>
    </div>
  );
}
