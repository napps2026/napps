const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: 'OK' };

    try {
        // --- 1. AUTHENTICATION (Synced with api.js logic) ---
        const authHeader = event.headers.authorization || '';
        const userKey = authHeader.replace('Bearer ', '').trim();
        const lowKey = userKey.toLowerCase();

        let role = "";
        // Match these variables to your Netlify Env settings
        if (userKey === process.env.MASTER_SECURITY_KEY) role = "President";
        else if (lowKey.includes('pro')) role = "PRO";
        else if (lowKey.includes('sec')) role = "Secretary";
        else if (lowKey.includes('cash')) role = "Treasurer";

        if (!role) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized: Invalid Admin Key' }) };
        }

        // --- 2. S3 CONFIGURATION ---
        const s3Client = new S3Client({
            region: process.env.MY_AWS_REGION,
            credentials: {
                accessKeyId: process.env.MY_AWS_ACCESS_KEY,
                secretAccessKey: process.env.MY_AWS_SECRET_KEY,
            },
        });

        const { fileName, data, contentType } = JSON.parse(event.body || '{}');
        
        // Remove the Base64 prefix (e.g., "data:image/jpeg;base64,")
        const base64Content = data.includes(',') ? data.split(',')[1] : data;
        const buffer = Buffer.from(base64Content, 'base64');

        const fileKey = `napps-gallery/${Date.now()}-${fileName}`;
        
        const uploadParams = {
            Bucket: process.env.MY_AWS_BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: contentType || 'image/jpeg'
            // ACL: 'public-read' // Uncomment if your bucket requires explicit public access
        };

        // --- 3. EXECUTE UPLOAD ---
        await s3Client.send(new PutObjectCommand(uploadParams));
        const finalUrl = `https://${process.env.MY_AWS_BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${fileKey}`;

        // --- 4. LOG TO NEON DATABASE ---
        const sql = neon(process.env.DATABASE_URL);
        await sql`INSERT INTO audit_logs (actor, action, target_name) 
                  VALUES (${role}, 'S3_IMAGE_UPLOAD', ${fileName})`;

        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ success: true, url: finalUrl }) 
        };

    } catch (err) {
        console.error("S3 Upload Error:", err);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: 'Upload Failed', details: err.message }) 
        };
    }
};