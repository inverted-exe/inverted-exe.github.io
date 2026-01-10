nline scripts
- DOM monitoring: Detect jika ada script diinjeksi ke DOM

**File:** `security-enhanced.js` (Line 110-125)

**Penggunaan:**
```javascript
// Sanitize user input sebelum ditampilkan
const cleanInput = EnhancedSecurityManager.sanitize(userInput);

// Sanitize HTML content
const cleanHTML = EnhancedSecurityManager.sanitizeHTML(htmlContent);
```

---

### 2. **SQL Injection Protection**
Mencegah attacker memanipulasi database queries

**Bagaimana:**
- Pattern detection: Cek untuk SQL keywords (SELECT, INSERT, DROP, etc)
- Input validation: Validate format input
- Warning system: Alert dan log jika terdeteksi

**File:** `security-enhanced.js` (Line 127-135)

**Contoh SQL Injection yang ditangkap:**
```
' OR '1'='1
; DROP TABLE users;
UNION SELECT * FROM passwords
```

---

### 3. **CSRF (Cross-Site Request Forgery) Protection**
Mencegah attacker membuat request dari website lain atas nama user

**Bagaimana:**
- Generate unique CSRF token per session
- Token di-embed di setiap form
- Server validate token sebelum process request

**File:** `security-enhanced.js` (Line 164-180)

**Otomatis:** Token ditambahkan ke semua `<form>` elements secara otomatis

---

### 4. **Input Validation & Sanitization**
Validate dan clean semua user input real-time

**Bagaimana:**
- Real-time input monitoring
- Detect XSS, SQL injection, command injection
- Visual feedback (red border untuk invalid input)
- Auto-sanitize jika terdeteksi pattern

**File:** `security-enhanced.js` (Line 182-213)

---

### 5. **Command Injection Protection**
Mencegah OS command execution

**Bagaimana:**
- Detect dangerous characters: `; & | $ ( ) { } ` ` etc
- Prevent eval() execution
- Block template injection: `${}` ```` 

**File:** `security-enhanced.js` (Line 229-234)

---

### 6. **Path Traversal Protection**
Mencegah attacker access file di luar directory yang diizinkan

**Bagaimana:**
- Detect `../` patterns
- Detect encoded variants: `%2f` `%5c`
- Validate URLs dan file paths

**File:** `security-enhanced.js` (Line 221-226)

---

### 7. **Rate Limiting**
Mencegah brute force attacks dan DDoS

**Bagaimana:**
- Track requests per endpoint per minute
- Limit: maksimal 60 requests per menit per endpoint
- Configurable di `config.maxRequestsPerMinute`

**File:** `security-enhanced.js` (Line 235-260)

**Konfigurasi:**
```javascript
maxRequestsPerMinute: 60,  // Adjust sesuai kebutuhan
```

---

### 8. **Session Management**
Manage user sessions secara aman

**Bagaimana:**
- Track user activity (clicks, keypress)
- Auto-logout jika inactive > 30 minutes
- Session token validation
- Secure session storage (sessionStorage bukan localStorage)

**File:** `security-enhanced.js` (Line 262-285)

**Konfigurasi:**
```javascript
sessionTimeout: 30 * 60 * 1000,  // 30 minutes
```

---

### 9. **Content Security Policy (CSP)**
Browser-level protection untuk XSS dan injection attacks

**Bagaimana:**
- Define mana saja sources yang diizinkan untuk scripts, styles, fonts
- Block inline scripts
- Block unsafe-eval
- Prevent frame loading

**File:** `index.html` (meta tag) dan `security-enhanced.js`

**Current Policy:**
```
default-src 'self'
script-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: https:
connect-src 'self' https://firebase.googleapis.com
```

---

### 10. **Password Security**
Proteksi akun admin dengan password policy

**Bagaimana:**
- Password strength validation
- Failed login attempt tracking
- Account lockout setelah 5 failed attempts (15 minutes)
- Session timeout protection

**File:** `admin/login.html`

**Requirements untuk strong password:**
- Minimal 8 characters
- Contains uppercase letters
- Contains lowercase letters  
- Contains numbers
- Contains special characters (!@#$%^&*)

---

### 11. **Form Protection**
Protect semua forms dari submission dengan invalid/dangerous data

**Bagaimana:**
- Validate semua inputs sebelum submit
- CSRF token validation
- Auto-reject dangerous patterns
- Visual feedback untuk user

**File:** `security-enhanced.js` (Line 329-351)

---

### 12. **Admin Login Security**
Enhanced security untuk admin panel

**Features:**
✅ Failed login tracking
✅ Account lockout (5 attempts = 15 min lockout)
✅ Secure password comparison
✅ Session token generation
✅ Login activity logging
✅ Logout on suspicious activity

**File:** `admin/login.html`

---

## 🔧 Konfigurasi Keamanan

Buka `security-enhanced.js` dan ubah config sesuai kebutuhan:

```javascript
this.config = {
  enableCSP: true,                    // Content Security Policy
  enableRateLimiting: true,           // Rate limiting
  enableInputValidation: true,        // Input validation
  enableFormProtection: true,         // Form protection
  maxRequestsPerMinute: 60,           // API rate limit
  maxFailedLogins: 5,                 // Max login attempts
  failedLoginLockoutDuration: 15 * 60 * 1000,  // 15 minutes
  sessionTimeout: 30 * 60 * 1000,     // 30 minutes
  enablePasswordPolicy: true,         // Password strength check
};
```

---

## 🚨 Serangan yang Dicegah

### 1. XSS (Cross-Site Scripting)
❌ **Blocked:**
```html
<img src=x onerror="alert('XSS')">
<script>malicious code</script>
javascript:alert('XSS')
```

### 2. SQL Injection
❌ **Blocked:**
```
' OR '1'='1
; DROP TABLE users;--
UNION SELECT password FROM users
```

### 3. CSRF (Cross-Site Request Forgery)
❌ **Blocked:**
- Form submission dari website lain tanpa token
- Request dari different origin

### 4. Command Injection
❌ **Blocked:**
```
; rm -rf /
| cat /etc/passwd
$(/malicious/command)
```

### 5. Path Traversal
❌ **Blocked:**
```
../../../../../../etc/passwd
..%2f..%2fetc%2fpasswd
```

### 6. Brute Force
❌ **Blocked:**
- 60+ requests per menit = rate limit
- 5+ failed logins = 15 min account lockout

### 7. Session Hijacking
❌ **Protected:**
- Unique session tokens
- Session timeout
- SessionStorage (not localStorage)

---

## 📊 Security Monitoring

### View Security Logs
Buka console (F12) untuk melihat security events:

```javascript
// Di console, ketik:
securityManager.logs      // View semua security events
securityMonitor.metrics   // View security metrics
enhancedSecurity.state    // View security state
```

---

## 🔑 Admin Login

### Default Password:
```
inverted2025
```

**⚠️ IMPORTANT:** Ubah password ini!

**Dimana:**
File: `admin/login.html` (Line ~235)
```javascript
const ADMIN_PASSWORD = 'inverted2025';  // ← Change this!
```

**Recommendations:**
1. Ubah password ke sesuatu yang strong dan unique
2. Gunakan minimum 12 characters
3. Include uppercase, lowercase, numbers, special chars
4. Jangan share password dengan siapa pun

---

## 🛡️ Best Practices untuk User

### 1. Use HTTPS
- Selalu gunakan HTTPS (enkripsi data in transit)
- Pastikan SSL certificate valid

### 2. Strong Passwords
- Admin: minimum 12 characters
- Include: uppercase, lowercase, numbers, special chars
- Change secara regular (every 90 days)

### 3. Don't Trust User Input
- Server-side validation harus dilakukan
- Never trust client-side validation alone

### 4. Update Dependencies
- Keep libraries up-to-date
- Monitor security advisories

### 5. Regular Backups
- Backup database regularly
- Test restore process

---

## 🔐 Server-Side Security (Backend Checklist)

Fitur di atas adalah **client-side protection**. Untuk production, juga implementasi:

### 1. Backend Input Validation
```javascript
// Backend: validate semua input
if (!isValidEmail(email)) {
  return { error: 'Invalid email' };
}
```

### 2. Database Security
- Use parameterized queries
- Limit database permissions
- Encrypt sensitive data

### 3. API Security
- Implement JWT or OAuth2
- Rate limit di backend (tidak hanya frontend)
- Validate CORS properly

### 4. HTTPS & Security Headers
```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### 5. Logging & Monitoring
- Log semua suspicious activities
- Monitor untuk attack patterns
- Set up alerts

### 6. Regular Security Audits
- Penetration testing
- Code reviews
- Dependency scanning

---

## 📋 Testing Security

### Test XSS Protection:
1. Go to input field
2. Try: `<script>alert('XSS')</script>`
3. Input akan di-sanitize, script tidak execute

### Test SQL Injection Detection:
1. Go to search/form input
2. Try: `' OR '1'='1`
3. Input field akan mendapat red border, log security event

### Test Rate Limiting:
1. Open console
2. Run:
```javascript
for(let i=0; i<70; i++) {
  fetch('/api/endpoint');
}
```
3. Requests 61+ akan blocked

### Test CSRF Protection:
1. Form submissions dari source lain akan rejected
2. Token mismatch = error

---

## 🆘 Troubleshooting

### "Rate limit exceeded" error
- Reduce number of API calls
- Wait 60 seconds untuk reset

### "Invalid input" on form submit
- Check console untuk detail
- Remove special characters
- Use sanitized input

### Admin login locked
- Wait 15 minutes
- Or clear localStorage

### CSP violations
- Check console untuk blocked resources
- Update CSP policy jika needed

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [CSP Reference](https://content-security-policy.com/)

---

## 📞 Support

Jika ada pertanyaan tentang security implementation, dokumentasi detail ada di:
- `security.js` - Core security features
- `security-monitoring.js` - Activity monitoring
- `security-enhanced.js` - Enhanced protection layer
- `admin/login.html` - Admin login security

---

**Last Updated:** January 6, 2025
**Security Status:** ✅ ACTIVE
