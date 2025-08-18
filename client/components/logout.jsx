// import { useRouter } from 'next/router';
// import api, { setAccessToken } from '@/lib/axios';
// import { useAppContext } from '@/context/AppContext';

// export default function LogoutButton() {
//   const router = useRouter();
//   const { logout } = useAppContext();

//   const handleLogout = async () => {
//     try {
//       await api.post('/user/logout', {}, { withCredentials: true });
//       setAccessToken(null); // clear access token from memory
//       logout(); // clear username globally + from localStorage
//       router.push('/login');
//     } catch (err) {
//       console.error('Logout failed:', err?.response?.data || err.message);
//     }
//   };

//   return (
//     <button
//       onClick={handleLogout}
//       className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
//     >
//       Logout
//     </button>
//   );
// }
// components/logout.js
import { useRouter } from "next/router";
import api, { setAccessToken } from "@/lib/axios";
import { useAppContext } from "@/context/AppContext";

export default function LogoutButton({ variant = "button", className = "" }) {
  const router = useRouter();
  const { logout } = useAppContext();

  const handleLogout = async () => {
    try {
      await api.post("/user/logout", {}, { withCredentials: true });
      setAccessToken(null);
      logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err?.response?.data || err.message);
    }
  };

  if (variant === "menu") {
    return (
      <button
        onClick={handleLogout}
        className={`w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 ${className}`}
      >
        Logout
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition ${className}`}
    >
      Logout
    </button>
  );
}
