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
    const isAnyExec = (userKey && (isPresident || isPRO || isTreasurer || isSecretary));

    try {
        // ==========================================
        // GET: FETCHING DATA
        // ==========================================
        if (event.httpMethod === 'GET') {
            const { type } = event.queryStringParameters || {};

            // --- PUBLIC ACCESS: No Key Required ---
            if (type === 'schools') {
                // Only show verified schools to the public
                const data = await sql`SELECT * FROM schools WHERE status = 'verified' ORDER BY created_at DESC`;
                return { statusCode: 200, headers, body: JSON.stringify(data) };
            } 
            
            if (type === 'gallery') {
                const data = await sql`SELECT * FROM gallery ORDER BY created_at DESC`;
                return { statusCode: 200, headers, body: JSON.stringify(data) };
            }

            // --- PRIVATE ACCESS: Requires Executive Key ---
            if (type === 'teachers' || type === 'logs' || type === 'all_schools') {
                if (!isAnyExec) {
                    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized: Invalid Security Key" }) };
                }

                let data;
                if (type === 'teachers') {
                    data = await sql`SELECT * FROM teachers ORDER BY created_at DESC`;
                } else if (type === 'logs') {
                    data = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC`;
                } else if (type === 'all_schools') {
                    // This allows executives to see PENDING schools too
                    data = await sql`SELECT * FROM schools ORDER BY created_at DESC`;
                }
                return { statusCode: 200, headers, body: JSON.stringify(data) };
            }

            return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid resource type" }) };
        }

        // ==========================================
        // POST: ACTIONS (Registration/Verify/Delete)
        // ==========================================
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');

            // --- ACTION 01: PUBLIC SCHOOL REGISTRATION ---
            if (body.type === 'register' && !body.action) {
                const { name, lga, owner, logoData, receiptData } = body;
                const result = await sql`
                    INSERT INTO schools (name, location, phone, image_url, receipt_url, status) 
                    VALUES (${name}, ${lga}, ${owner}, ${logoData}, ${receiptData}, 'pending')
                    RETURNING id`;

                return { statusCode: 200, headers, body: JSON.stringify({ success: true, regId: result[0].id }) };
            }

            // --- ACTION 02: PUBLIC TEACHER REGISTRATION ---
            if (body.type === 'teachers' && body.action === 'register') {
                const { name, email, phone, qualification, bio, image_url } = body.data;

                const existing = await sql`SELECT id FROM teachers WHERE email = ${email}`;
                if (existing.length > 0) {
                    return { statusCode: 409, headers, body: JSON.stringify({ error: "Email already registered." }) };
                }
                
                await sql`
                    INSERT INTO teachers (name, email, phone, qualification, bio, image_url, status) 
                    VALUES (${name}, ${email}, ${phone}, ${qualification}, ${bio}, ${image_url}, 'pending')`;

                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }

            // --- ACTION 03: VERIFICATION (Executives Only) ---
            if (body.action === 'verify') {
                if (!isAnyExec) return { statusCode: 403, headers, body: JSON.stringify({ error: "Unauthorized" }) };

                const validTables = ['schools', 'teachers', 'gallery'];
                if (!validTables.includes(body.type)) throw new Error("Invalid table selection");

                // Note: Neon serverless requires column identifiers to be handled carefully
                await sql`UPDATE ${sql(body.type)} SET status = 'verified' WHERE id = ${body.id}`;
                
                await sql`INSERT INTO audit_logs (actor, action, target_name) 
                          VALUES (${userKey}, 'Verified Record', ${body.type + ' ID: ' + body.id})`;

                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }

            // --- ACTION 04: PRO GALLERY UPLOAD ---
            if (body.action === 'register' && body.type === 'gallery') {
                if (!isPRO && !isPresident) return { statusCode: 403, headers, body: JSON.stringify({ error: "PRO Access Required" }) };
                
                await sql`INSERT INTO gallery (title, url) VALUES (${body.data.title}, ${body.data.url})`;
                await sql`INSERT INTO audit_logs (actor, action, target_name) 
                          VALUES (${userKey}, 'Gallery Upload', ${body.data.title})`;

                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }

            // --- ACTION 05: PRESIDENTIAL DELETE ---
            if (body.action === 'delete') {
                if (!isPresident) return { statusCode: 403, headers, body: JSON.stringify({ error: "Presidential Authority Required" }) };

                const validTables = ['schools', 'teachers', 'gallery'];
                if (!validTables.includes(body.type)) throw new Error("Invalid table selection");

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