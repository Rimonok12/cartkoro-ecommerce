import { useRouter } from 'next/router';
import { useState } from 'react';

export default function NewUserForm({ phone }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [referral, setReferral] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: username,
          email,
          phone_number: phone,
          referral_used: referral || null, // if you track who referred them
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Something went wrong');
        return;
      }

      router.push('/');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Server error');
    }
  };

  return (
    <div className="p-6 space-y-4 w-full max-w-sm bg-white shadow rounded">
      <h1 className="text-xl font-semibold">Complete your profile</h1>
      <input
        placeholder="Full Name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border px-3 py-2 rounded w-full"
        required
      />
      <input
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      />
      <input
        placeholder="Referral Code (optional)"
        value={referral}
        onChange={(e) => setReferral(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-orange-600 text-white py-2 rounded"
      >
        Finish
      </button>
    </div>
  );
}
