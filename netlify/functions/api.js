const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    // 1. HEADERS & CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: 'OK' };
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Auth Handling
    const authHeader = event.headers.authorization || '';
    const userKey = authHeader.replace('Bearer ', '').trim();
    const lowKey = userKey.toLowerCase();

    // Security Rules
    const isPresident = userKey === process.env.MASTER_SECURITY_KEY;
    const isPRO = lowKey.includes('pro');
    const isTreasurer = lowKey.includes('cash') || lowKey.includes('treasurer');
    const isSecretary = lowKey.includes('sec');
    const isAnyExec = isPresident || isPRO || isTreasurer || isSecretary;

    try {
        // ==========================================
        // GET: FETCHING DATA (President/Exec Only)
        // ==========================================
        if (event.httpMethod === 'GET') {
            const { type } = event.queryStringParameters || {};

            if (!isAnyExec) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid Security Key" }) };
            }

            let data;
            if (type === 'schools') {
                data = await sql`SELECT * FROM schools ORDER BY created_at DESC`;
            } else if (type === 'teachers') {
                data = await sql`SELECT * FROM teachers ORDER BY created_at DESC`;
            } else if (type === 'logs') {
                data = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC`;
            } else if (type === 'gallery') {
                data = await sql`SELECT * FROM gallery ORDER BY created_at DESC`;
            }

            return { statusCode: 200, headers, body: JSON.stringify(data) };
        }

        // ==========================================
        // POST: ACTIONS (Registration/Verify/Delete)
        // ==========================================
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');

            // ACTION 01: SCHOOL REGISTRATION (Public)
            if (body.type === 'register' && !body.action) {
                const { name, lga, owner, logoData, receiptData } = body;
                
                // We use TEXT for image columns to store the Base64 strings
                const result = await sql`
                    INSERT INTO schools (name, location, phone, image_url, receipt_url, status) 
                    VALUES (${name}, ${lga}, ${owner}, ${logoData}, ${receiptData}, 'pending')
                    RETURNING id`;

                return { 
                    statusCode: 200, 
                    headers, 
                    body: JSON.stringify({ success: true, regId: result[0].id }) 
                };
            }

            // ACTION 02: VERIFICATION (Executives)
            if (body.action === 'verify') {
                if (!isAnyExec) return { statusCode: 403, headers };

                await sql`UPDATE ${sql(body.type)} SET status = 'verified' WHERE id = ${body.id}`;
                
                // Audit Log
                await sql`INSERT INTO audit_logs (actor, action, target_name) 
                          VALUES (${userKey}, 'Verified Record', ${body.type + ' ID: ' + body.id})`;

                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }

            // ACTION 03: PRO GALLERY UPLOAD
            if (body.action === 'register' && body.type === 'gallery') {
                if (!isPRO && !isPresident) return { statusCode: 403, headers };
                
                await sql`INSERT INTO gallery (title, url) VALUES (${body.data.title}, ${body.data.url})`;
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }

            // ACTION 04: PRESIDENTIAL DELETE
            if (body.action === 'delete') {
                if (!isPresident) return { statusCode: 403, headers };

                await sql`DELETE FROM ${sql(body.type)} WHERE id = ${body.id}`;
                
                await sql`INSERT INTO audit_logs (actor, action, target_name) 
                          VALUES ('President', 'Permanent Delete', ${body.type + ' ID: ' + body.id})`;

                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }
        }

    } catch (err) {
        console.error("Critical API Error:", err);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: "Server Error", details: err.message }) 
        };
    }
};