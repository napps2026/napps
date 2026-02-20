const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    const sql = neon(process.env.DATABASE_URL);

    try {
        if (event.httpMethod === 'GET') {
            const { type, subject, level } = event.queryStringParameters || {};

            // Fetch Random Questions for the CBT Engine
            if (type === 'questions') {
                const rows = await sql`
                    SELECT id, question_text, option_a, option_b, option_c, option_d 
                    FROM questions 
                    WHERE subject = ${subject} AND class_level = ${level} 
                    ORDER BY RANDOM() LIMIT 40`;
                return { statusCode: 200, headers, body: JSON.stringify(rows) };
            }
        }

        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');

            // AUTO-GRADER LOGIC
            if (body.action === 'submit_exam') {
                const { student_name, school_name, subject, level, student_answers } = body.data;
                
                // Fetch correct answers from DB
                const correctKeys = await sql`SELECT id, correct_option FROM questions WHERE subject = ${subject} AND class_level = ${level}`;
                
                let score = 0;
                correctKeys.forEach(q => {
                    if (student_answers[q.id] === q.correct_option) score++;
                });

                // Save result
                await sql`INSERT INTO exam_results (student_name, school_name, subject, score, total_questions) 
                          VALUES (${student_name}, ${school_name}, ${subject}, ${score}, ${correctKeys.length})`;

                return { statusCode: 200, headers, body: JSON.stringify({ success: true, score, total: correctKeys.length }) };
            }
        }
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};