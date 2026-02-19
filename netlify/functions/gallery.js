const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const origin = event.headers?.origin || '';
  const ALLOWED_ORIGINS = ['https://ogunstatenapps.netlify.app'];
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`SELECT NOW(), VERSION();`;
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      message: "Connection Successful", 
      time: result[0].now,
      version: result[0].version 
    })
  };
} catch (dbError) {
  console.error("Connection Failed:", dbError);
  return { 
    statusCode: 500, 
    headers, 
    body: JSON.stringify({ error: "DB Connection Failed", details: dbError.message }) 
  };
}

  // try {
  //   const databaseUrl = process.env.DATABASE_URL;
  //   if (!databaseUrl) {
  //     return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database not configured' }) };
  //   }

  //   const sql = neon(databaseUrl);
  //   const images = await sql`
  //     SELECT id, title, image_url as url, caption
  //     FROM gallery
  //     ORDER BY created_at DESC
  //   `;

  //   return { statusCode: 200, headers, body: JSON.stringify(images) };
  // } catch (err) {
  //   console.error('Gallery error:', err);
  //   return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch gallery' }) };
  // }
};