exports.handler = async (event) => {
  const origin = event.headers?.origin || '';
  const ALLOWED_ORIGINS = ['https://ogunstatenapps.netlify.app'];
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // Accept Authorization: Bearer <token>
    const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization) || null;
    const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const expected = process.env.ADMIN_KEY || null;

    if (!expected) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'ADMIN_KEY not configured' }) };
    }

    // Validate bearer token
    if (!(bearer && bearer === expected)) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('admin-auth error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Auth check failed' }) };
  }
};