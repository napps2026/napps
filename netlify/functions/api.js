const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const origin = event.headers?.origin || '';
  const ALLOWED_ORIGINS = ['https://ogunstatenapps.netlify.app'];
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database connection not configured' }) };

  const sql = neon(databaseUrl);

  try {
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const type = (params.type || 'schools').toLowerCase();

      if (type === 'schools') {
        const rows = await sql`SELECT id, name, location, phone, image_url as image, receipt, status FROM schools ORDER BY name`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }

      if (type === 'teachers') {
        const rows = await sql`SELECT id, name, email, phone, qualification, image_url as image, status FROM teachers ORDER BY name`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }

      if (type === 'executives') {
        const rows = await sql`SELECT id, name, role, phone, email, status FROM executives ORDER BY name`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }

      if (type === 'gallery') {
        const rows = await sql`SELECT id, title, image_url as url, caption, created_at FROM gallery ORDER BY created_at DESC`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }

      if (type === 'logs') {
        const rows = await sql`SELECT id, actor, action, target_id as targetId, details, timestamp FROM logs ORDER BY timestamp DESC LIMIT 500`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown type' }) };
    }

    // POST - admin actions (verify, delete, register). Require Authorization: Bearer <ADMIN_KEY>
    if (event.httpMethod === 'POST') {
      const expected = process.env.ADMIN_KEY;
      if (!expected) {
        console.error('ADMIN_KEY environment variable not configured');
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
      }
      const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
      if (!auth || !auth.startsWith('Bearer ') || auth.split(' ')[1] !== expected) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const payload = JSON.parse(event.body || '{}');
      const { type, action, id, data } = payload;
      const actor = payload.actor || payload.actorRole || 'admin';
      if (!type || !action) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing type or action' }) };

      const t = type.toLowerCase();

      // Register (manual insert)
      if (action === 'register') {
        if (t === 'schools') {
          const { name, location, phone, image_url, status } = data || {};
          const inserted = await sql`INSERT INTO schools (name, location, phone, image_url, status) VALUES (${name}, ${location}, ${phone}, ${image_url}, ${status || 'verified'}) RETURNING id, name, location, phone, image_url, status`;
          // Audit log
          try { await sql`INSERT INTO logs (actor, action, target_id, details) VALUES (${actor}, 'register:schools', ${inserted[0].id}, ${JSON.stringify(inserted[0])})`; } catch (e) { console.error('log insert failed', e); }
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, record: inserted[0] }) };
        }

        if (t === 'teachers') {
          const { name, email, phone, qualification, image_url, status } = data || {};
          const inserted = await sql`INSERT INTO teachers (name, email, phone, qualification, image_url, status) VALUES (${name}, ${email}, ${phone}, ${qualification}, ${image_url}, ${status || 'verified'}) RETURNING id, name, email, phone, qualification, image_url, status`;
          try { await sql`INSERT INTO logs (actor, action, target_id, details) VALUES (${actor}, 'register:teachers', ${inserted[0].id}, ${JSON.stringify(inserted[0])})`; } catch (e) { console.error('log insert failed', e); }
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, record: inserted[0] }) };
        }

        if (t === 'executives') {
          const { name, role, phone, email, status } = data || {};
          const inserted = await sql`INSERT INTO executives (name, role, phone, email, status) VALUES (${name}, ${role}, ${phone}, ${email}, ${status || 'active'}) RETURNING id, name, role, phone, email, status`;
          try { await sql`INSERT INTO logs (actor, action, target_id, details) VALUES (${actor}, 'register:executives', ${inserted[0].id}, ${JSON.stringify(inserted[0])})`; } catch (e) { console.error('log insert failed', e); }
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, record: inserted[0] }) };
        }
      }

      // Verify (set status)
      if (action === 'verify') {
        if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };
        if (t === 'schools') {
          const updated = await sql`UPDATE schools SET status = 'verified' WHERE id = ${id} RETURNING id, name, status`;
          try { await sql`INSERT INTO logs (actor, action, target_id, details) VALUES (${actor}, 'verify:schools', ${updated[0].id}, ${JSON.stringify(updated[0])})`; } catch (e) { console.error('log insert failed', e); }
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, record: updated[0] }) };
        }
        if (t === 'teachers') {
          const updated = await sql`UPDATE teachers SET status = 'verified' WHERE id = ${id} RETURNING id, name, status`;
          try { await sql`INSERT INTO logs (actor, action, target_id, details) VALUES (${actor}, 'verify:teachers', ${updated[0].id}, ${JSON.stringify(updated[0])})`; } catch (e) { console.error('log insert failed', e); }
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, record: updated[0] }) };
        }
      }

      // Delete
      if (action === 'delete') {
        if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };
        if (t === 'schools') {
          const deleted = await sql`DELETE FROM schools WHERE id = ${id} RETURNING id`;
          try { await sql`INSERT INTO logs (actor, action, target_id, details) VALUES (${actor}, 'delete:schools', ${deleted[0].id}, ${JSON.stringify(deleted[0])})`; } catch (e) { console.error('log insert failed', e); }
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, deleted: deleted[0] }) };
        }
        if (t === 'teachers') {
          const deleted = await sql`DELETE FROM teachers WHERE id = ${id} RETURNING id`;
          try { await sql`INSERT INTO logs (actor, action, target_id, details) VALUES (${actor}, 'delete:teachers', ${deleted[0].id}, ${JSON.stringify(deleted[0])})`; } catch (e) { console.error('log insert failed', e); }
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, deleted: deleted[0] }) };
        }
        if (t === 'executives') {
          const deleted = await sql`DELETE FROM executives WHERE id = ${id} RETURNING id`;
          try { await sql`INSERT INTO logs (actor, action, target_id, details) VALUES (${actor}, 'delete:executives', ${deleted[0].id}, ${JSON.stringify(deleted[0])})`; } catch (e) { console.error('log insert failed', e); }
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, deleted: deleted[0] }) };
        }
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('api error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};