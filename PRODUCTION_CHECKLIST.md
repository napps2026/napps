# Quick Fix Checklist

## 🔴 Critical (Fix Before Deploy)

### 1. Remove Hardcoded PINs in `js/admin-board.js`
**File:** `js/admin-board.js` lines 22-25
```javascript
// ❌ CURRENT
if (val === '2024' || val === '2026') { unlockSystem(); }

// ✅ FIX
const PIN = prompt('Enter admin PIN'); // Or load from page var
if (val === PIN && val.length === 4) { unlockSystem(); }
```

---

### 2. Make ADMIN_KEY Required in `netlify/functions/api.js`
**File:** `netlify/functions/api.js` line 56-58
```javascript
// ❌ CURRENT
const expected = process.env.ADMIN_KEY || ''; // Can be empty!

// ✅ FIX
const expected = process.env.ADMIN_KEY;
if (!expected) {
  console.error('ADMIN_KEY not configured');
  return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
}
```
**Repeat for:** `upload-image.js`, `run-migration.js` (same fix)

---

### 3. Restrict CORS in All Functions
**Files affected:** `api.js`, `gallery.js`, `register-school.js`, `register-teacher.js`, `post-job.js`, `upload-image.js`, `admin-auth.js`, `run-migration.js`

```javascript
// ❌ CURRENT
'Access-Control-Allow-Origin': '*'

// ✅ FIX
const ALLOWED_ORIGINS = ['https://ogunstatenapps.netlify.app'];
const origin = event.headers?.origin || '';
const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
const headers = {
  'Access-Control-Allow-Origin': allowOrigin,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
```

---

### 4. Remove Admin Key from SessionStorage
**Files:** `admin/upload.html`, `js/admin-board.js`
- DON'T: `sessionStorage.setItem('adminKey', ...)`
- USE: Server-side httpOnly cookies instead (requires Netlify Identity)
- OR: Use JWT from `/api/auth` endpoint

---

### 5. Add Input Validation
**Files:** `register-school.js`, `register-teacher.js`, `post-job.js`
```javascript
// ADD THIS BEFORE INSERT
if (!name || name.trim().length === 0) 
  return { statusCode: 400, body: JSON.stringify({ error: 'Name required' }) };
if (name.length > 200) 
  return { statusCode: 400, body: JSON.stringify({ error: 'Name too long' }) };
```

---

## 🟡 Medium Priority (Strong Recommendation)

- [ ] Hide error details (return 500, log internally)
- [ ] Protect `/logs` endpoint with auth
- [ ] Add rate limiting (Cloudflare)
- [ ] Add security headers to `netlify.toml`
- [ ] Review S3 upload ACL (set to private if needed)
- [ ] Test all auth flows

---

## ✅ Already Good
- No hardcoded DB credentials
- Parameterized queries (no SQL injection risk)
- Audit logging in place
- Separate serverless functions

---

**Read full report:** [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md)
