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
    const { school_id, subject } = payload;
    
    // Validation
    if (!school_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'School ID is required' }) };
    }
    if (!subject || subject.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Subject is required' }) };
    }
    if (subject.length > 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Subject too long (max 200 chars)' }) };
    }

    const sql = neon(databaseUrl);
    const result = await sql`
      INSERT INTO jobs (school_id, subject)
      VALUES (${school_id}, ${subject})
      RETURNING id, school_id, subject, created_at
    `;

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, job: result[0] }) };
  } catch (err) {
    console.error('post-job error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to post job' }) };
  }
};