// lib/ssrHelper.js
import axios from 'axios';
/**
 * Redirects to login if user has no refresh token
 */
export async function requireAuth(context, redirectTo = '/login') {
  const { req } = context;
  const cookies = req.cookies || {};

  const refreshToken = cookies['CK-REF-T'];

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
  const refreshToken = cookies['CK-REF-T'];

  if (!refreshToken) return { props: {} };
  try {
    const controller = new AbortController();

    const res = await axios.post(
      `${process.env.NODE_HOST}/api/user/getUserRedisData`,
      {},
      {
        withCredentials: true,
        headers: {
          cookie: req.headers.cookie || '', // forward cookies
        },
        signal: controller.signal,
      }
    );

    const data = res.data; // use res.data, not res.json()
    console.log('data from essential', data);

    return {
      props: {
        initialUserData: data.profile || {},
        initialCartData: data.cart || {},
        initialCashbackData: data.cashback || 0,
        initialRecentAddress: data.recentAddress || {},
      },
    };
  } catch (err) {
    console.error('Error in essentialsOnLoad:', err);
    return { props: {} };
  }
}

export async function requireB2B(
  context,
  { anyOf = ['is_seller', 'is_admin', 'is_super_admin'], redirectTo = '/' } = {}
) {
  // Get essentials (and implicitly ensure a valid refresh token)
  const essentials = await essentialsOnLoad(context);

  const profile = essentials?.props?.initialUserData || {};
  // profile contains only role keys that are true — so we just test for presence
  const allowed =
    Array.isArray(anyOf) && anyOf.some((k) => Boolean(profile[k]));

  if (!allowed) {
    return {
      redirect: {
        destination: redirectTo,
        permanent: false,
      },
    };
  }

  // Allowed: pass through all essentials props to the page
  return { props: { ...essentials.props } };
}

export async function requireB2BAdmin(
  context,
  { anyOf = ['is_admin', 'is_super_admin'], redirectTo = '/' } = {}
) {
  // Get essentials (and implicitly ensure a valid refresh token)
  const essentials = await essentialsOnLoad(context);

  const profile = essentials?.props?.initialUserData || {};
  // profile contains only role keys that are true — so we just test for presence
  const allowed =
    Array.isArray(anyOf) && anyOf.some((k) => Boolean(profile[k]));

  if (!allowed) {
    return {
      redirect: {
        destination: redirectTo,
        permanent: false,
      },
    };
  }

  // Allowed: pass through all essentials props to the page
  return { props: { ...essentials.props } };
}
