import { useRef, useState, useEffect } from 'react';
import {setAccessToken} from "@/lib/axios";
import { useAppContext } from '@/context/AppContext';


export default function OTPInput({ phone, onVerify }) {
  const { login } = useAppContext();
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const inputs = useRef([]);

  const handleChange = (value, idx) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && idx < 5) {
      inputs.current[idx + 1].focus();
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
  };

  const handleVerify = async (code) => {
    const res = await fetch('/api/user/verifyOtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp: code }),
      credentials: 'include',
    });

    const data = await res.json();

    if (res.ok && !data.error) {
      setError('');
      onVerify(data.newUser);
      setAccessToken(data.accessToken);
      login(data.firstName);
    } else {
      setError(data.error || 'Invalid OTP, please try again.');
    }
  };

  // Watch for complete OTP
  useEffect(() => {
    const code = otp.join('');
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      handleVerify(code);
    }
  }, [otp]);

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
    </div>
  );
}
