const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const origin = event.headers?.origin || '';
  const ALLOWED_ORIGINS = ['https://ogunstatenapps.netlify.app'];
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return { statusCode: 500, headers, body: JSON.stringify({ error: 'DB not configured' }) };

    const payload = JSON.parse(event.body || '{}');
    const { name, location, image_url, contact } = payload;

    // Validation
    if (!name || name.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'School name is required' }) };
    }
    if (name.length > 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'School name too long (max 200 chars)' }) };
    }
    if (!location || location.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Location is required' }) };
    }
    if (location.length > 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Location too long (max 200 chars)' }) };
    }

    const sql = neon(databaseUrl);
    const result = await sql`
      INSERT INTO schools (name, location, image_url)
      VALUES (${name}, ${location}, ${image_url})
      RETURNING id, name, location, image_url
    `;

    // Optionally store contact in a separate table or send notification

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, school: result[0] }) };
  } catch (err) {
    console.error('register-school error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to register school' }) };
  }
};