/**
 * Security Monitoring & Logging System
 * Track suspicious activities dan potential attacks
 */

class SecurityMonitoringSystem {
  constructor() {
    this.apiEndpoint = '/api/security-logs';
    this.batchSize = 50;
    this.flushInterval = 5 * 60 * 1000; // 5 minutes
    this.logs = [];
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivities: 0,
      xssAttempts: 0,
      sqlInjectionAttempts: 0,
      bruteForceAttempts: 0
    };
  }

  /**
   * Initialize monitoring system
   */
  initialize() {
    // Auto-flush logs every interval
    setInterval(() => this.flushLogs(), this.flushInterval);

    // Log before page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs();
    });

    console.log('🔍 SecurityMonitoringSystem initialized');
  }

  /**
   * Detect XSS attempts
   */
  detectXSSAttempts() {
    // Monitor untuk suspicious script tags
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src && !this.isAllowedSource(script.src)) {
        this.log('SECURITY_THREAT', {
          type: 'XSS_ATTEMPT',
          source: script.src,
          severity: 'HIGH'
        });
        this.metrics.xssAttempts++;
      }
    });
  }

  /**
   * Detect SQL Injection patterns
   * @param {string} input - User input untuk dicek
   */
  detectSQLInjection(input) {
    const sqlPatterns = [
      /union\s+select/i,
      /select\s+.*\s+from/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /drop\s+table/i,
      /update\s+.*\s+set/i,
      /exec\s*\(/i,
      /execute\s*\(/i,
      /;\s*drop/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        this.log('SECURITY_THREAT', {
          type: 'SQL_INJECTION_ATTEMPT',
          pattern: pattern.toString(),
          input: input.substring(0, 100),
          severity: 'CRITICAL'
        });
        this.metrics.sqlInjectionAttempts++;
        return true;
      }
    }
    return false;
  }

  /**
   * Monitor untuk brute force attempts
   * @param {string} endpoint - API endpoint
   * @param {boolean} success - Apakah request berhasil
   */
  monitorBruteForce(endpoint, success) {
    const key = `brute-force:${endpoint}:${this.getClientIdentifier()}`;
    const attempts = sessionStorage.getItem(key) || 0;
    const newAttempts = parseInt(attempts) + 1;

    if (newAttempts > 10) {
      this.log('SECURITY_THREAT', {
        type: 'BRUTE_FORCE_ATTEMPT',
        endpoint,
        attempts: newAttempts,
        severity: 'HIGH'
      });
      this.metrics.bruteForceAttempts++;
    }

    sessionStorage.setItem(key, newAttempts);

    // Reset after 1 hour
    setTimeout(() => {
      sessionStorage.removeItem(key);
    }, 60 * 60 * 1000);
  }

  /**
   * Monitor network requests
   */
  monitorNetworkRequests() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource] = args;
      const url = typeof resource === 'string' ? resource : resource.url;

      this.metrics.totalRequests++;

      // Log suspicious requests
      if (this.isSuspiciousRequest(url)) {
        this.metrics.blockedRequests++;
        this.log('SUSPICIOUS_REQUEST', {
          url,
          method: args[1]?.method || 'GET',
          severity: 'MEDIUM'
        });
      }

      return originalFetch.apply(this, args);
    };
  }

  /**
   * Monitor untuk unauthorized access attempts
   */
  monitorAccessControl() {
    // Track 403 Forbidden responses
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Cek untuk 403 responses (kalau bisa di-track dari performance API)
        if (entry.transferSize === 0) {
          // Possible blocked request
          this.log('ACCESS_DENIED', {
            url: entry.name,
            timestamp: new Date(entry.responseEnd).toISOString()
          });
        }
      });
    });

    if ('PerformanceObserver' in window) {
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Check if source is allowed
   */
  isAllowedSource(source) {
    const allowedHosts = [
      'inverted.exe',
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
      'firebase.googleapis.com'
    ];

    return allowedHosts.some(host => source.includes(host));
  }

  /**
   * Check if request is suspicious
   */
  isSuspiciousRequest(url) {
    const suspiciousPatterns = [
      /\.\.\//, // Directory traversal
      /union.*select/i, // SQL injection
      /<script/, // XSS
      /on\w+\s*=/i, // Event handlers
      /javascript:/ // JavaScript protocol
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Get unique client identifier
   */
  getClientIdentifier() {
    let clientId = localStorage.getItem('client-id');
    
    if (!clientId) {
      clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('client-id', clientId);
    }

    return clientId;
  }

  /**
   * Log security event
   */
  log(eventType, eventData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      eventData,
      clientId: this.getClientIdentifier(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    };

    this.logs.push(logEntry);

    // Log ke console (development)
    if (!window.location.hostname.includes('production')) {
      console.warn(`[${eventType}]`, eventData);
    }

    // Auto-flush jika log penuh
    if (this.logs.length >= this.batchSize) {
      this.flushLogs();
    }
  }

  /**
   * Kirim logs ke server
   */
  async flushLogs() {
    if (this.logs.length === 0) return;

    const logsToSend = [...this.logs];
    this.logs = [];

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          metrics: this.metrics
        }),
        keepalive: true
      });

      if (!response.ok) {
        // Re-add logs jika gagal
        this.logs = [...logsToSend, ...this.logs];
        console.error('Failed to flush logs');
      }
    } catch (error) {
      console.error('Error flushing logs:', error);
      // Re-add logs jika gagal
      this.logs = [...logsToSend, ...this.logs];
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      suspiciousActivityRatio: this.metrics.suspiciousActivities / Math.max(this.metrics.totalRequests, 1)
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivities: 0,
      xssAttempts: 0,
      sqlInjectionAttempts: 0,
      bruteForceAttempts: 0
    };
  }
}

// Create global instance
const securityMonitor = new SecurityMonitoringSystem();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    securityMonitor.initialize();
    securityMonitor.detectXSSAttempts();
    securityMonitor.monitorNetworkRequests();
    securityMonitor.monitorAccessControl();
  });
} else {
  securityMonitor.initialize();
  securityMonitor.detectXSSAttempts();
  securityMonitor.monitorNetworkRequests();
  securityMonitor.monitorAccessControl();
}

// Export untuk penggunaan di modules lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityMonitoringSystem;
}
