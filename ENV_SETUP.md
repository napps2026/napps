Setup environment variables (Netlify)

**Recommended approach:** Set environment variables in the Netlify dashboard (Site settings → Environment variables).

## Required environment variable:

- **DATABASE_URL** — Your Neon PostgreSQL connection string  
  Example: `postgresql://user:password@host/dbname?sslmode=require`

### Why only DATABASE_URL?

- `DATABASE_URL` is the only production environment variable needed; it powers all serverless functions.
- Do **NOT** expose this in frontend code (it's server-side only via `process.env` in Netlify functions).
- `ADMIN_KEY` is optional — if you implement admin auth, store it as a Netlify secret (not in version control).
- Never commit secrets to the repository.

## Setup steps:

1. Log in to [app.netlify.com](https://app.netlify.com).
2. Select your site (`ogunstatenapps`).
3. Go to **Site settings** → **Environment variables**.
4. Click **Add a variable** and paste:
   - **Key:** `DATABASE_URL`  
   - **Value:** `postgresql://user:password@host/dbname?sslmode=require`
5. Trigger a redeploy to activate the changes.

## For local testing (optional):

If you need to test migrations locally, create a `.env` file (never commit):
```
DATABASE_URL=your_neon_connection_string_here
```

Then run scripts locally with Node.js, e.g.:
```bash
node ./scripts/run_migration_local.js
```

## Testing endpoints after deploy:

Once the deploy is live, test public endpoints (no auth needed):
```bash
curl https://ogunstatenapps.netlify.app/.netlify/functions/api?type=schools
curl https://ogunstatenapps.netlify.app/.netlify/functions/api?type=teachers
curl https://ogunstatenapps.netlify.app/.netlify/functions/api?type=gallery
curl https://ogunstatenapps.netlify.app/.netlify/functions/api?type=logs
```

## Security notes:

1. **Never commit secrets** — use Netlify environment store, not `netlify.toml` or code.
2. **Frontend code never sees credentials** — all DB access is server-side in Netlify functions.
3. **Optional admin auth** — if you add role-based access, create a separate `ADMIN_KEY` secret in Netlify.
4. **Use least-privilege roles** — consider creating a read-only Neon role for `DATABASE_URL` in production.

Note: Using the Netlify dashboard UI is the recommended approach because it stores secrets securely in Netlify's environment store.
