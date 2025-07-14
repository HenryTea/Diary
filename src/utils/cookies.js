// Cookie utilities for client-side cookie management
export const cookieUtils = {
  // Get a cookie value by name
  getCookie: (name) => {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  },

  // Set a cookie (client-side only - for non-HttpOnly cookies)
  setCookie: (name, value, days = 30) => {
    if (typeof document === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  },

  // Delete a cookie
  deleteCookie: (name) => {
    if (typeof document === 'undefined') return;
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },

  // Check if cookies are enabled
  cookiesEnabled: () => {
    if (typeof document === 'undefined') return false;
    
    try {
      document.cookie = 'test=1';
      const enabled = document.cookie.indexOf('test=1') !== -1;
      document.cookie = 'test=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
      return enabled;
    } catch {
      return false;
    }
  }
};
