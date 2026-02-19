const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
(async ()=>{
  try{
    const envDoc = fs.readFileSync(path.join(process.cwd(),'ENV_SETUP.md'),'utf8');
    const m = envDoc.match(/postgresql:\/\/[^"\n\s]+/);
    if(!m) return console.error('Database URL not found in ENV_SETUP.md');
    const databaseUrl = m[0];
    const sql = neon(databaseUrl);
    const col = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='logs' AND column_name='details'`;
    console.log('Column info:', col);
    const sample = await sql`SELECT id, action, timestamp, details FROM logs ORDER BY timestamp DESC NULLS LAST LIMIT 5`;
    console.log('Sample rows:', sample);
    process.exit(0);
  }catch(err){
    console.error(err);process.exit(1);
  }
})();
