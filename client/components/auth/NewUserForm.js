import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/axios';
import { useAppContext } from '@/context/AppContext';

export default function NewUserForm({ phone }) {
  const router = useRouter();
  const { login } = useAppContext();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [referral, setReferral] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await api.post(
        '/user/register',
        {
          full_name: username,
          email,
          phone_number: phone,
          referrerCode: referral || null,
        },
        { withCredentials: true }
      );

      const data = res.data;
      login(data.firstName);
      router.push('/');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Server error');
    }
  };

  return (
    <>
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
    </>
  );
}
