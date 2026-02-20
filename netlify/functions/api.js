const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    const origin = event.headers?.origin || '';
    const headers = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    const databaseUrl = process.env.DATABASE_URL;
    const sql = neon(databaseUrl);

    try {
        // --- GET: FETCHING DATA ---
        if (event.httpMethod === 'GET') {
            const params = event.queryStringParameters || {};
            const type = (params.type || 'schools').toLowerCase();

            if (type === 'schools') {
                const rows = await sql`SELECT id, name, location, phone, image_url as image, status FROM schools ORDER BY name`;
                return { statusCode: 200, headers, body: JSON.stringify(rows) };
            }
            if (type === 'teachers') {
                // Added bio to the selection
                const rows = await sql`SELECT id, name, email, phone, qualification, bio, image_url as image, status FROM teachers ORDER BY name`;
                return { statusCode: 200, headers, body: JSON.stringify(rows) };
            }
        }

        // --- POST: ACTIONS ---
        if (event.httpMethod === 'POST') {
            const payload = JSON.parse(event.body || '{}');
            const { type, action, id, data } = payload;
            const t = type?.toLowerCase();

            // 1. PUBLIC ACTION: REGISTRATION (No Admin Key Required)
            if (action === 'register') {
                if (t === 'schools') {
                    const ins = await sql`INSERT INTO schools (name, location, phone, image_url, status) 
                        VALUES (${data.name}, ${data.location}, ${data.phone}, ${data.image_url}, 'pending') RETURNING id`;
                    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: ins[0].id }) };
                }
                if (t === 'teachers') {
                    // Added Bio and proper column mapping
                    const ins = await sql`INSERT INTO teachers (name, email, phone, qualification, bio, image_url, status) 
                        VALUES (${data.name}, ${data.email}, ${data.phone}, ${data.qualification}, ${data.bio || null}, ${data.image_url}, 'pending') RETURNING id`;
                    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: ins[0].id }) };
                }
            }

            // 2. PROTECTED ACTIONS (Admin Key REQUIRED)
            const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
            const expected = process.env.ADMIN_KEY;
            if (!auth || !auth.startsWith('Bearer ') || auth.split(' ')[1] !== expected) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
            }

            if (action === 'verify') {
                if (t === 'schools') await sql`UPDATE schools SET status = 'verified' WHERE id = ${id}`;
                if (t === 'teachers') await sql`UPDATE teachers SET status = 'verified' WHERE id = ${id}`;
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }

            if (action === 'delete') {
                if (t === 'schools') await sql`DELETE FROM schools WHERE id = ${id}`;
                if (t === 'teachers') await sql`DELETE FROM teachers WHERE id = ${id}`;
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    } catch (err) {
        console.error(err);
        // Smart Error handling for duplicate emails
        const isDuplicate = err.message.includes('unique constraint');
        return { 
            statusCode: isDuplicate ? 409 : 500, 
            headers, 
            body: JSON.stringify({ 
                error: isDuplicate ? 'This email is already registered.' : 'Server Error', 
                details: err.message 
            }) 
        };
    }
};