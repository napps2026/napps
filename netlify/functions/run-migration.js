const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const origin = event.headers?.origin || '';
  const ALLOWED_ORIGINS = ['https://ogunstatenapps.netlify.app'];
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const expected = process.env.ADMIN_KEY;
    if (!expected) {
      console.error('ADMIN_KEY environment variable not configured');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
    }
    const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
    if (!auth || !auth.startsWith('Bearer ') || auth.split(' ')[1] !== expected) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Prefer a dedicated migration URL when available
    const databaseUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
    const used = process.env.MIGRATION_DATABASE_URL ? 'MIGRATION_DATABASE_URL' : (process.env.DATABASE_URL ? 'DATABASE_URL' : null);
    if (!databaseUrl) return { statusCode: 500, headers, body: JSON.stringify({ error: 'No database URL configured (set MIGRATION_DATABASE_URL or DATABASE_URL)' }) };

    const migrationPath = path.join(process.cwd(), 'migrations', 'convert_logs_to_jsonb.sql');
    if (!fs.existsSync(migrationPath)) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Migration file not found' }) };

    const sqlText = fs.readFileSync(migrationPath, 'utf8');
    const sql = neon(databaseUrl);

    // Execute migration SQL. Note: this runs potentially many statements.
    await (sql.unsafe ? sql.unsafe(sqlText) : sql`${sqlText}`);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Migration executed', usedEnv: used }) };
  } catch (err) {
    console.error('migration error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Migration failed' }) };
  }
};
