const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

(async ()=>{
  try{
    const envDoc = fs.readFileSync(path.join(process.cwd(),'ENV_SETUP.md'),'utf8');
    const m = envDoc.match(/postgresql:\/\/[^"\n\s]+/);
    if(!m) return console.error('Database URL not found in ENV_SETUP.md');
    const databaseUrl = m[0];
    console.log('Using database URL from ENV_SETUP.md');

    const migrationPath = path.join(process.cwd(),'migrations','convert_logs_to_jsonb.sql');
    if(!fs.existsSync(migrationPath)) return console.error('Migration file not found:', migrationPath);
    const sqlText = fs.readFileSync(migrationPath,'utf8');

    const sql = neon(databaseUrl);
    console.log('Executing migration (this may take a while)...');
    await (sql.unsafe ? sql.unsafe(sqlText) : sql`${sqlText}`);
    console.log('Migration executed successfully');
    process.exit(0);
  }catch(err){
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
