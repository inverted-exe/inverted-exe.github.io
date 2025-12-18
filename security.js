/**
 * Security Manager untuk melindungi website dari serangan
 * Direkomendasikan untuk production
 */

class SecurityManager {
  constructor() {
    this.isProduction = !window.location.hostname.includes('localhost');
    this.apiEndpoint = '/api/security-log';
    this.maxLogSize = 50; // Max logs sebelum dikirim ke server
    this.logs = [];
  }

  /**
   * Sanitize input untuk prevent XSS attacks
   * @param {string} input - User input yang perlu di-sanitize
   * @returns {string} - Sanitized text
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text untuk di-escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Validate email format
   * @param {string} email - Email untuk divalidasi
   * @returns {boolean} - True jika valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   * @param {string} url - URL untuk divalidasi
   * @returns {boolean} - True jika valid
   */
  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate input dengan regex pattern
   * @param {string} input - Input untuk divalidasi
   * @param {RegExp} pattern - Regex pattern
   * @returns {boolean} - True jika valid
   */
  validateInput(input, pattern) {
    return pattern.test(input);
  }

  /**
   * Rate limit function calls
   * Mencegah multiple calls dalam interval pendek
   * @param {Function} fn - Function untuk di-rate limit
   * @param {number} delay - Delay dalam milliseconds
   * @returns {Function} - Rate limited function
   */
  rateLimit(fn, delay = 1000) {
    let lastCall = 0;
    let lastResult;
    
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        lastResult = fn(...args);
      }
      return lastResult;
    };
  }

  /**
   * Debounce function calls
   * Menunda execution sampai user selesai melakukan action
   * @param {Function} fn - Function untuk di-debounce
   * @param {number} delay - Delay dalam milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(fn, delay = 300) {
    let timeoutId;
    
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Throttle function calls
   * Membatasi execution frequency
   * @param {Function} fn - Function untuk di-throttle
   * @param {number} delay - Delay dalam milliseconds
   * @returns {Function} - Throttled function
   */
  throttle(fn, delay = 1000) {
    let lastCall = 0;
    
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  /**
   * Generate CSRF token
   * @returns {string} - Random CSRF token
   */
  generateCSRFToken() {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    localStorage.setItem('csrf-token', token);
    return token;
  }

  /**
   * Verify CSRF token
   * @param {string} token - Token untuk diverifikasi
   * @returns {boolean} - True jika valid
   */
  verifyCSRFToken(token) {
    const storedToken = localStorage.getItem('csrf-token');
    return token === storedToken;
  }

  /**
   * Hash string menggunakan SHA-256
   * @param {string} str - String untuk di-hash
   * @returns {Promise<string>} - Hashed string
   */
  async hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check apakah developer tools sedang terbuka
   * @returns {boolean} - True jika developer tools terbuka
   */
  isDevToolsOpen() {
    const threshold = 160;
    return window.outerHeight - window.innerHeight > threshold ||
           window.outerWidth - window.innerWidth > threshold;
  }

  /**
   * Log security event
   * @param {string} event - Event name
   * @param {Object} details - Event details
   */
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      hostname: window.location.hostname
    };

    // Log ke console (development)
    if (!this.isProduction) {
      console.warn('[SECURITY EVENT]', logEntry);
    }

    this.logs.push(logEntry);

    // Kirim ke server jika log sudah banyak
    if (this.logs.length >= this.maxLogSize) {
      this.flushLogs();
    }
  }

  /**
   * Kirim logs ke server
   */
  flushLogs() {
    if (this.logs.length === 0) return;

    const logsToSend = [...this.logs];
    this.logs = [];

    fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logs: logsToSend }),
      keepalive: true
    }).catch(error => {
      console.error('Failed to flush logs:', error);
      // Re-add logs jika gagal
      this.logs = [...logsToSend, ...this.logs];
    });
  }

  /**
   * Detect suspicious activities
   */
  detectSuspiciousActivity() {
    // Detect inline scripts
    const inlineScripts = document.querySelectorAll('script:not([src])');
    if (inlineScripts.length > 0) {
      this.logSecurityEvent('INLINE_SCRIPTS_DETECTED', {
        count: inlineScripts.length
      });
    }

    // Monitor untuk XSS attempts
    const originalEval = window.eval;
    window.eval = function(...args) {
      this.logSecurityEvent('EVAL_EXECUTION_ATTEMPTED', {
        code: String(args[0]).substring(0, 100)
      });
      return originalEval.apply(this, args);
    }.bind(this);

    // Monitor DOM modifications
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const addedScripts = Array.from(mutation.addedNodes)
            .filter(node => node.tagName === 'SCRIPT');
          
          if (addedScripts.length > 0) {
            this.logSecurityEvent('SCRIPT_INJECTION_DETECTED', {
              count: addedScripts.length
            });
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Setup error logging
   */
  setupErrorLogging() {
    window.addEventListener('error', (event) => {
      this.logSecurityEvent('RUNTIME_ERROR', {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logSecurityEvent('UNHANDLED_PROMISE_REJECTION', {
        reason: String(event.reason)
      });
    });
  }

  /**
   * Monitor developer tools
   */
  monitorDevTools() {
    let devToolsOpen = false;
    
    setInterval(() => {
      if (this.isDevToolsOpen()) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          this.logSecurityEvent('DEVELOPER_TOOLS_OPENED', {
            timestamp: new Date().toISOString()
          });
        }
      } else {
        devToolsOpen = false;
      }
    }, 1000);
  }

  /**
   * Monitor network requests untuk suspicious patterns
   * (Menggunakan PerformanceObserver)
   */
  monitorNetworkRequests() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            // Cek untuk suspicious domains
            const suspiciousDomains = ['malicious.com', 'evil.com'];
            const isToSuspiciousDomain = suspiciousDomains.some(domain =>
              entry.name.includes(domain)
            );

            if (isToSuspiciousDomain) {
              this.logSecurityEvent('SUSPICIOUS_REQUEST_DETECTED', {
                url: entry.name
              });
            }
          });
        });

        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.error('Failed to setup network monitoring:', error);
      }
    }
  }

  /**
   * Initialize semua security features
   */
  initialize() {
    try {
      this.setupErrorLogging();
      this.detectSuspiciousActivity();
      this.monitorNetworkRequests();

      if (!this.isProduction) {
        // Hanya monitor dev tools di production
        // this.monitorDevTools();
      }

      // Flush logs sebelum halaman ditutup
      window.addEventListener('beforeunload', () => {
        this.flushLogs();
      });

      console.log('🔒 SecurityManager initialized');
    } catch (error) {
      console.error('Failed to initialize SecurityManager:', error);
    }
  }
}

// Create global instance
const securityManager = new SecurityManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    securityManager.initialize();
  });
} else {
  securityManager.initialize();
}

// Export untuk penggunaan di modules lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityManager;
}
