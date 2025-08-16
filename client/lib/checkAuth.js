// lib/checkAuth.js
  
  export async function requireAuth(context, redirectTo = '/login') {
    const { req } = context;
    const cookies = req.cookies || {};
  
    const accessToken = cookies['CK-ACC-T'];
    const refreshToken = cookies['CK-REF-T'];
  
    if (!accessToken && !refreshToken) {
      return {
        redirect: {
          destination: redirectTo,
          permanent: false,
        },
      };
    }
  
    return { props: {} };
  }
  