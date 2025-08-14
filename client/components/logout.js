import api, { setAccessToken } from '@/lib/axios'; // Your Axios wrapper

const handleLogout = async () => {
  try {
    await api.post('/user/logout', {}, { withCredentials: true });
    setAccessToken(null);
    router.push('/login'); // redirect to login
  } catch (err) {
    console.error('Logout failed:', err.message);
  }
};
