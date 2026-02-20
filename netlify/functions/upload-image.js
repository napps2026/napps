const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    // ... (CORS Headers same as before)

    try {
        // --- ADMIN ROLE CHECK ---
        const authHeader = event.headers?.authorization || '';
        const token = authHeader.split(' ')[1];
        
        let role = "";
        if (token === process.env.KEY_PRESIDENT) role = "President";
        else if (token === process.env.KEY_PRO) role = "PRO";
        else if (token === process.env.KEY_SECRETARY) role = "Secretary";
        else if (token === process.env.ADMIN_KEY) role = "System_Admin";

        if (!role) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized Upload Access' }) };
        }

        const { fileName, data } = JSON.parse(event.body || '{}');
        // ... (S3 Setup and Upload Logic same as your original) ...

        await client.send(command);
        const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

        // --- LOGGING TO DATABASE ---
        const sql = neon(process.env.DATABASE_URL);
        await sql`INSERT INTO logs (actor, action, target_name, details) 
                  VALUES (${role}, 'IMAGE_UPLOAD', ${fileName}, ${url})`;

        return { statusCode: 200, body: JSON.stringify({ success: true, url }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};