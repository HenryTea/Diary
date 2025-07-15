import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Unsafe HTML content
 * @returns {string} - Safe HTML content
 */
export const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div', 'h1', 'h2', 'h3', 
      'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'sub', 'sup'
    ],
    ALLOWED_ATTR: ['style', 'class', 'href', 'target', 'rel', 'data-username', 'contenteditable'],
    ALLOWED_SCHEMES: ['http', 'https', 'mailto'],
    ALLOW_DATA_ATTR: ['data-username'], // Allow data-username for mentions
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe', 'meta'],
    STRIP_COMMENTS: true,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
    ADD_TAGS: [], // Don't add any additional tags
    ADD_ATTR: [], // Don't add any additional attributes
    HOOKS: {
      // Custom hook to preserve user mentions
      afterSanitizeAttributes: function(node) {
        if (node.classList && node.classList.contains('user-mention')) {
          // Preserve mention styling and make non-editable
          node.style.color = '#3b82f6';
          node.style.fontWeight = '500';
          node.style.cursor = 'pointer';
          node.contentEditable = false;
        }
      }
    }
  });
};

/**
 * Sanitize plain text input
 * @param {string} input - User input
 * @returns {string} - Safe text
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:(?!image\/)/gi, '') // Allow only image data URIs
    .trim();
};

/**
 * Validate entry ID format
 * @param {string} id - Entry ID to validate
 * @returns {boolean} - Is valid
 */
export const validateEntryId = (id) => {
  if (!id || typeof id !== 'string') return false;
  if (id === 'new') return true;
  
  // Allow alphanumeric, hyphens, underscores, max 50 chars
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 50;
};

/**
 * Validate HTML content
 * @param {string} html - HTML content to validate
 * @returns {boolean} - Is valid
 */
export const validateHtmlContent = (html) => {
  if (!html || typeof html !== 'string') return false;
  if (html.length > 2000000) return false; // 2MB limit
  
  // Check for suspicious patterns (excluding safe mention patterns)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // Event handlers like onclick, onload, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i
  ];
  
  // Create a copy of HTML to check after removing safe mention elements
  let htmlToCheck = html;
  
  // Remove safe mention spans before checking
  // Pattern: <span class="user-mention" data-username="..." contenteditable="false" style="...">@username</span>
  const mentionPattern = /<span[^>]*class=["']user-mention["'][^>]*data-username=["'][^"']*["'][^>]*>@[^<]+<\/span>/gi;
  htmlToCheck = htmlToCheck.replace(mentionPattern, '');
  
  // Also remove safe data-username attributes in general
  htmlToCheck = htmlToCheck.replace(/data-username=["'][^"']*["']/gi, '');
  
  // Now check for suspicious patterns in the cleaned HTML
  return !suspiciousPatterns.some(pattern => pattern.test(htmlToCheck));
};

/**
 * Rate limiter for operations
 */
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.attempts = new Map();
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  isAllowed(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  reset(key) {
    this.attempts.delete(key);
  }
}

/**
 * Secure storage utilities
 */
export const secureStorage = {
  // Set user data
  setUser: (user) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('diary_user', JSON.stringify(user));
  },
  
  // Get user data
  getUser: () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = sessionStorage.getItem('diary_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },
  
  // Get authentication token/status
  getToken: () => {
    if (typeof window === 'undefined') return null;
    
    // For cookie-based auth, we check if user exists as a token indicator
    const user = secureStorage.getUser();
    return user ? 'authenticated' : null;
  },
  
  // Remove user data
  removeUser: () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('diary_user');
    localStorage.removeItem('user'); // Remove old localStorage user
  }
};

/**
 * Content Security Policy nonce generator
 */
export const generateNonce = () => {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Escape HTML entities
 */
export const escapeHtml = (unsafe) => {
  if (!unsafe || typeof unsafe !== 'string') return '';
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
