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
    if (!databaseUrl) {
      console.error("Missing DATABASE_URL");
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'DB not configured' }) };
    }

    // Safely parse body
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON input' }) };
    }

    const { name, email, phone, qualification, bio } = payload;

    // Validation (Keep your existing validation logic here)
    if (!name || !email) {
       return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const sql = neon(databaseUrl);
    
    // Use a try-catch specifically for the SQL execution to see DB errors
    const result = await sql`
      INSERT INTO teachers (name, email, phone, qualification, bio)
      VALUES (${name}, ${email}, ${phone || null}, ${qualification || null}, ${bio || null})
      RETURNING id;
    `;

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ success: true, id: result[0].id }) 
    };

  } catch (err) {
    // This will show up in your Netlify/Function logs
    console.error('Database Error Details:', err.message);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Failed to register', details: err.message }) 
    };
  }
};