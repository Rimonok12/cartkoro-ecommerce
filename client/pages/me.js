'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/user/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  if (!user) return <p>Loading...</p>;
  return <div>Welcome {user.email}</div>;
}
