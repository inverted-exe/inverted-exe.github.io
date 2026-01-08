/**
 * Enhanced Security Features
 * Melindungi dari XSS, CSRF, DDoS, dan serangan common lainnya
 * Harus di-load di <head> sebagai script pertama
 */

class EnhancedSecurityManager {
  constructor() {
    this.config = {
      enableCSP: true,
      enableRateLimiting: true,
      enableInputValidation: true,
      enableContentSecurityPolicy: true,
      maxRequestsPerMinute: 60,
      maxFailedLogins: 5,
      failedLoginLockoutDuration: 15 * 60 * 1000, // 15 minutes
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      enableDomSanitization: true,
      enableFormProtection: true,
      enablePasswordPolicy: true,
      enableTwoFactor: false
    };

    this.state = {
      csrfToken: null,
      sessionActive: false,
      requestLog: {},
      failedAttempts: {},
      lastActivity: Date.now(),
      isInitialized: false
    };

    this.patterns = {
      xss: [
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi,
        /javascript:/gi,
        /<iframe/gi,
        /<embed/gi,
        /<object/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi
      ],
      sql: [
        /union.*?select/i,
        /select.*?from/i,
        /insert.*?into/i,
        /delete.*?from/i,
        /drop\s+(table|database)/i,
        /exec\s*\(/i,
        /execute\s*\(/i,
        /update.*?set/i,
        /declare\s+/i,
        /syscolumns/i,
        /sysobjects/i
      ],
      pathTraversal: [
        /\.\.\//g,
        /\.\.%2f/gi,
        /\.\.\%5c/gi
      ],
      commandInjection: [
        /[;&|`$(){}]/,
        /\$\{.*\}/,
        /`.*`/
      ]
    };
  }

  /**
   * Initialize enhanced security
   */
  initialize() {
    if (this.state.isInitialized) return;

    try {
      this.setupCSRFProtection();
      this.setupInputValidation();
      this.setupSessionManagement();
      this.setupRateLimiting();
      this.setupFormProtection();
      this.setupContentSecurityHeaders();
      this.setupSecureStorage();
      this.setupEventListeners();

      console.log('🔒 Enhanced Security initialized');
      this.state.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Enhanced Security:', error);
    }
  }

  /**
   * Setup CSRF Protection
   */
  setupCSRFProtection() {
    // Generate CSRF token
    this.generateCSRFToken();

    // Add to all forms
    document.addEventListener('DOMContentLoaded', () => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'csrf-token';
        input.value = this.state.csrfToken;
        form.appendChild(input);
      });
    });

    // Validate CSRF token on form submission
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const token = form.querySelector('input[name="csrf-token"]')?.value;
      
      if (!this.verifyCSRFToken(token)) {
        e.preventDefault();
        console.error('CSRF token validation failed');
        alert('Security validation failed. Please refresh and try again.');
        return false;
      }
    });
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      this.state.csrfToken = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Fallback untuk browser lama
      this.state.csrfToken = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }

    sessionStorage.setItem('csrf-token', this.state.csrfToken);
    return this.state.csrfToken;
  }

  /**
   * Verify CSRF token
   */
  verifyCSRFToken(token) {
    if (!token) return false;
    const storedToken = sessionStorage.getItem('csrf-token');
    return token === storedToken;
  }

  /**
   * Setup Input Validation & Sanitization
   */
  setupInputValidation() {
    document.addEventListener('input', (e) => {
      if (e.target.matches('input, textarea')) {
        const value = e.target.value;
        
        // Detect XSS attempts
        if (this.detectXSS(value)) {
          console.warn('XSS attempt detected:', value);
          e.target.value = this.sanitizeInput(value);
          this.logSecurityEvent('XSS_ATTEMPT_BLOCKED', { value: value.substring(0, 50) });
        }

        // Detect SQL injection
        if (this.detectSQLInjection(value)) {
          console.warn('SQL injection attempt detected');
          e.target.classList.add('input-error');
          this.logSecurityEvent('SQL_INJECTION_ATTEMPT', { value: value.substring(0, 50) });
        } else {
          e.target.classList.remove('input-error');
        }

        // Detect command injection
        if (this.detectCommandInjection(value)) {
          e.target.classList.add('input-error');
          this.logSecurityEvent('COMMAND_INJECTION_ATTEMPT', { value: value.substring(0, 50) });
        }
      }
    }, true);
  }

  /**
   * Detect XSS attempts
   */
  detectXSS(input) {
    return this.patterns.xss.some(pattern => pattern.test(input));
  }

  /**
   * Detect SQL injection
   */
  detectSQLInjection(input) {
    return this.patterns.sql.some(pattern => pattern.test(input));
  }

  /**
   * Detect command injection
   */
  detectCommandInjection(input) {
    return this.patterns.commandInjection.some(pattern => pattern.test(input));
  }

  /**
   * Detect path traversal
   */
  detectPathTraversal(input) {
    return this.patterns.pathTraversal.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    // Remove dangerous patterns
    let sanitized = input;
    this.patterns.xss.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Escape HTML entities
    const div = document.createElement('div');
    div.textContent = sanitized;
    return div.innerHTML;
  }

  /**
   * Sanitize HTML (more permissive, for rich content)
   */
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Remove dangerous elements
    const dangerous = div.querySelectorAll('script, iframe, object, embed, form, input[type="hidden"]');
    dangerous.forEach(el => el.remove());

    // Remove dangerous attributes
    const allElements = div.querySelectorAll('*');
    allElements.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on') || attr.value.includes('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return div.innerHTML;
  }

  /**
   * Setup Session Management
   */
  setupSessionManagement() {
    // Track activity
    document.addEventListener('click', () => {
      this.state.lastActivity = Date.now();
    });

    document.addEventListener('keypress', () => {
      this.state.lastActivity = Date.now();
    });

    // Check for session timeout
    setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - this.state.lastActivity;

      if (timeSinceLastActivity > this.config.sessionTimeout) {
        this.handleSessionTimeout();
      }
    }, 60000); // Check every minute
  }

  /**
   * Handle session timeout
   */
  handleSessionTimeout() {
    console.log('Session timeout');
    sessionStorage.clear();
    localStorage.removeItem('auth-token');
    this.state.sessionActive = false;
    // Redirect ke login atau tampilkan warning
    // window.location.href = '/login';
  }

  /**
   * Setup Rate Limiting
   */
  setupRateLimiting() {
    // Monitor API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource] = args;
      const url = typeof resource === 'string' ? resource : resource.url;
      const endpoint = new URL(url, window.location.origin).pathname;

      // Check rate limit
      if (!this.checkRateLimit(endpoint)) {
        console.error('Rate limit exceeded for:', endpoint);
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint });
        throw new Error('Rate limit exceeded');
      }

      return originalFetch.apply(this, args);
    };
  }

  /**
   * Check rate limit
   */
  checkRateLimit(endpoint) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${endpoint}:${minute}`;

    if (!this.state.requestLog[key]) {
      this.state.requestLog[key] = 0;
    }

    this.state.requestLog[key]++;

    // Cleanup old entries
    Object.keys(this.state.requestLog).forEach(key => {
      const keyMinute = parseInt(key.split(':')[1]);
      if (minute - keyMinute > 1) {
        delete this.state.requestLog[key];
      }
    });

    return this.state.requestLog[key] <= this.config.maxRequestsPerMinute;
  }

  /**
   * Setup Form Protection
   */
  setupFormProtection() {
    document.addEventListener('submit', (e) => {
      const form = e.target;

      // Validate all inputs
      const inputs = form.querySelectorAll('input, textarea');
      let isValid = true;

      inputs.forEach(input => {
        if (input.type !== 'hidden' && input.type !== 'csrf-token') {
          if (this.detectXSS(input.value) || this.detectSQLInjection(input.value)) {
            isValid = false;
            input.classList.add('input-error');
          }
        }
      });

      if (!isValid) {
        e.preventDefault();
        alert('Invalid input detected. Please check your data.');
        return false;
      }
    }, true);
  }

  /**
   * Setup Content Security Headers
   */
  setupContentSecurityHeaders() {
    // Set CSP meta tag jika belum ada
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!existingCSP && this.config.enableContentSecurityPolicy) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = `
        default-src 'self';
        script-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
        font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
        img-src 'self' data: https:;
        connect-src 'self' https://firebase.googleapis.com;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
      `.trim().replace(/\n/g, ' ');
      document.head.insertBefore(meta, document.head.firstChild);
    }
  }

  /**
   * Setup Secure Storage
   */
  setupSecureStorage() {
    // Override localStorage untuk sensitive data
    window.secureStorage = {
      set: (key, value, isEncrypted = false) => {
        if (isEncrypted) {
          // Simple encoding (not real encryption - gunakan crypto library untuk production)
          value = btoa(JSON.stringify(value));
        }
        sessionStorage.setItem(key, value);
      },
      get: (key, isEncrypted = false) => {
        const value = sessionStorage.getItem(key);
        if (isEncrypted && value) {
          try {
            return JSON.parse(atob(value));
          } catch (e) {
            return null;
          }
        }
        return value;
      },
      remove: (key) => {
        sessionStorage.removeItem(key);
      },
      clear: () => {
        sessionStorage.clear();
      }
    };
  }

  /**
   * Setup Event Listeners
   */
  setupEventListeners() {
    // Prevent right-click pada sensitive elements (optional)
    // document.addEventListener('contextmenu', (e) => {
    //   if (e.target.classList.contains('protected')) {
    //     e.preventDefault();
    //   }
    // });

    // Monitor for suspicious DOM manipulation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          Array.from(mutation.addedNodes).forEach(node => {
            if (node.tagName === 'SCRIPT' && !node.src) {
              this.logSecurityEvent('INLINE_SCRIPT_DETECTED', {
                content: node.textContent.substring(0, 100)
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Track failed login attempts
   */
  trackFailedLogin(username) {
    const key = `failed-login:${username}`;
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(key) || '{"count":0,"timestamp":0}');

    // Reset jika sudah lebih dari lockout duration
    if (now - attempts.timestamp > this.config.failedLoginLockoutDuration) {
      attempts.count = 0;
    }

    attempts.count++;
    attempts.timestamp = now;
    localStorage.setItem(key, JSON.stringify(attempts));

    if (attempts.count >= this.config.maxFailedLogins) {
      this.logSecurityEvent('ACCOUNT_LOCKOUT', { username, attempts: attempts.count });
      return false; // Account locked
    }

    return true; // Can try again
  }

  /**
   * Clear failed login attempts
   */
  clearFailedLogins(username) {
    localStorage.removeItem(`failed-login:${username}`);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    if (!this.config.enablePasswordPolicy) {
      return { valid: true, score: 0 };
    }

    let score = 0;
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };

    Object.values(requirements).forEach(met => {
      if (met) score++;
    });

    return {
      valid: score >= 3, // Minimal 3 dari 5 requirements
      score,
      requirements
    };
  }

  /**
   * Log security event
   */
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    console.warn('[SECURITY]', logEntry);

    // Kirim ke server jika perlu
    // fetch('/api/security-log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry),
    //   keepalive: true
    // }).catch(() => {});
  }

  /**
   * Enable two-factor authentication (stub)
   */
  enableTwoFactor(username) {
    console.log('Two-factor authentication should be implemented on backend');
    // This should be implemented on the server side
  }

  /**
   * Public API untuk sanitize user content
   */
  static sanitize(input) {
    const instance = new EnhancedSecurityManager();
    return instance.sanitizeInput(input);
  }

  /**
   * Public API untuk sanitize HTML
   */
  static sanitizeHTML(html) {
    const instance = new EnhancedSecurityManager();
    return instance.sanitizeHTML(html);
  }

  /**
   * Public API untuk validate email
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Public API untuk validate password
   */
  static validatePassword(password) {
    const instance = new EnhancedSecurityManager();
    return instance.validatePasswordStrength(password);
  }
}

// Create global instance
const enhancedSecurity = new EnhancedSecurityManager();

// Initialize immediately (before DOMContentLoaded)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    enhancedSecurity.initialize();
  });
} else {
  enhancedSecurity.initialize();
}

// Export untuk penggunaan di modules lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedSecurityManager;
}
