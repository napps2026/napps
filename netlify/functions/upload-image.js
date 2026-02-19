const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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
    // Admin key check: require Authorization: Bearer <token>
    const expectedKey = process.env.ADMIN_KEY;
    if (!expectedKey) {
      console.error('ADMIN_KEY environment variable not configured');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
    }
    const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization) || null;
    const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!(bearer && bearer === expectedKey)) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { fileName, data } = body;

    if (!data) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No image data provided' }) };

    // Get S3 config from env
    const BUCKET = process.env.S3_BUCKET;
    const REGION = process.env.AWS_REGION || process.env.S3_REGION;

    if (!BUCKET || !REGION) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'S3_BUCKET or AWS_REGION not configured' }) };
    }

    // Parse base64 data URI if provided
    let base64 = data;
    let contentType = 'image/jpeg';
    if (data.startsWith('data:')) {
      const match = data.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
      if (!match) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid data URI' }) };
      contentType = match[1];
      base64 = match[2];
    }

    const buffer = Buffer.from(base64, 'base64');
    const ext = contentType.split('/')[1] || 'jpg';
    const key = `${Date.now()}-${(fileName || 'upload').replace(/[^a-zA-Z0-9-_\.]/g, '')}.${ext}`;

    const client = new S3Client({ region: REGION });
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    });

    await client.send(command);

    const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    // Insert audit log (if DATABASE_URL is configured)
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (databaseUrl) {
        const sql = neon(databaseUrl);
        const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization) || null;
        const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : 'admin';
        const details = JSON.stringify({ url, key, fileName: fileName || null });
        await sql`INSERT INTO logs (actor, action, target_id, details) VALUES (${bearer}, 'upload:image', ${key}, ${details})`;
      }
    } catch (e) { console.error('log insert failed', e); }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, url }) };
  } catch (err) {
    console.error('upload-image error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Upload failed' }) };
  }
};