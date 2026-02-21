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

            // 1. PUBLIC VIEWS (No Key Required)
            if (type === 'schools') {
                const data = await sql`SELECT * FROM schools WHERE status = 'verified' ORDER BY created_at DESC`;
                return { statusCode: 200, headers, body: JSON.stringify(data) };
            } 
            
            if (type === 'gallery') {
                const data = await sql`SELECT * FROM gallery ORDER BY created_at DESC`;
                return { statusCode: 200, headers, body: JSON.stringify(data) };
            }

            // 2. EXECUTIVE VIEWS (Key Required)
            if (!isAnyExec) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized: Invalid Security Key" }) };
            }

            let data;
            // Handle 'admin_teachers' or 'all_schools' labels from HTML
            if (type === 'teachers' || type === 'admin_teachers') {
                data = await sql`SELECT * FROM teachers ORDER BY created_at DESC`;
            } else if (type === 'logs') {
                data = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC`;
            } else if (type === 'all_schools' || type === 'schools') {
                data = await sql`SELECT * FROM schools ORDER BY created_at DESC`;
            } else {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid resource type" }) };
            }
            
            return { statusCode: 200, headers, body: JSON.stringify(data) };
        }

        // ==========================================
        // POST: ACTIONS
        // ==========================================
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');

            // --- PUBLIC REGISTRATIONS ---
            if (body.type === 'register' && !body.action) {
                const { name, lga, owner, logoData, receiptData } = body;
                const result = await sql`
                    INSERT INTO schools (name, location, phone, image_url, receipt_url, status) 
                    VALUES (${name}, ${lga}, ${owner}, ${logoData}, ${receiptData}, 'pending')
                    RETURNING id`;
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, regId: result[0].id }) };
            }

            // --- EXECUTIVE ACTIONS (Verify/Delete) ---
            // This is where the "Insufficient Privileges" error usually happens
            if (!isAnyExec) {
                return { statusCode: 403, headers, body: JSON.stringify({ error: "Insufficient Privileges: Executive Key Required" }) };
            }

            // Clean the table name (e.g., 'admin_teachers' -> 'teachers')
            const cleanTable = body.type.replace('admin_', '').replace('all_', '');
            const validTables = ['schools', 'teachers', 'gallery'];

            if (!validTables.includes(cleanTable)) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid table: ${cleanTable}` }) };
            }

            // ACTION: VERIFY
            if (body.action === 'verify') {
                await sql`UPDATE ${sql(cleanTable)} SET status = 'verified' WHERE id = ${body.id}`;
                await sql`INSERT INTO audit_logs (actor, action, target_name) 
                          VALUES (${USER_ROLE || 'Executive'}, 'Verified Record', ${cleanTable + ' ID: ' + body.id})`;
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }

            // ACTION: DELETE (President Only)
            if (body.action === 'delete') {
                if (!isPresident) {
                    return { statusCode: 403, headers, body: JSON.stringify({ error: "Presidential Authority Required to Delete" }) };
                }
                await sql`DELETE FROM ${sql(cleanTable)} WHERE id = ${body.id}`;
                await sql`INSERT INTO audit_logs (actor, action, target_name) 
                          VALUES ('President', 'Permanent Delete', ${cleanTable + ' ID: ' + body.id})`;
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }
        }

    } catch (err) {
        console.error("API Error:", err);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: "Server Error", details: err.message }) 
        };
    }
};