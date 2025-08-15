// lib/forwardCookies.js
export function forwardCookies(fromResponse, toResponse) {
    const cookies = fromResponse.headers.get('set-cookie');
    if (cookies) {
      // Pass cookies directly to the browser
      toResponse.setHeader('set-cookie', cookies);
    }
  }
  