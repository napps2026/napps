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
    const { name, email, phone, qualification, bio } = payload;

    // Validation
    if (!name || name.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Teacher name is required' }) };
    }
    if (name.length > 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Teacher name too long (max 200 chars)' }) };
    }
    if (!email || email.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
    }
    if (email.length > 255 || !email.includes('@')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email format' }) };
    }

    const sql = neon(databaseUrl);
    const result = await sql`
      INSERT INTO teachers (name, email, phone, qualification, bio)
      VALUES (${name}, ${email}, ${phone}, ${qualification}, ${bio})
      RETURNING id, name, email, phone
    `;

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, teacher: result[0] }) };
  } catch (err) {
    console.error('register-teacher error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to register teacher' }) };
  }
};