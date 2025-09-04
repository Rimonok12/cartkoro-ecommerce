// lib/ssrHelper.js
import axios from "axios";
/**
 * Redirects to login if user has no refresh token
 */
export async function requireAuth(context, redirectTo = "/login") {
  const { req } = context;
  const cookies = req.cookies || {};

  const refreshToken = cookies["CK-REF-T"];

  if (!refreshToken) {
    return {
      redirect: {
        destination: redirectTo,
        permanent: false,
      },
    };
  }

  return { props: {} };
}

/**
 * Fetches essential user data (profile, cart, cashback)
 */
export async function essentialsOnLoad(context) {
  const { req } = context;
  const cookies = req.cookies || {};
  const refreshToken = cookies["CK-REF-T"];

  if (!refreshToken) return { props: {} };
  try {
    const controller = new AbortController();

    const res = await axios.post(
      `${process.env.NODE_HOST}/api/user/getUserRedisData`,
      {},
      {
        withCredentials: true,
        headers: {
          cookie: req.headers.cookie || "", // forward cookies
        },
        signal: controller.signal,
      }
    );

    const data = res.data; // use res.data, not res.json()
    console.log("data from essential", data)

    return {
      props: {
        initialUserData: data.profile || {},
        initialCartData: data.cart || {},
        initialCashbackData: data.cashback || 0,
        initialRecentAddress: data.recentAddress || {},
      },
    };
  } catch (err) {
    console.error("Error in essentialsOnLoad:", err);
    return { props: {} };
  }
}
