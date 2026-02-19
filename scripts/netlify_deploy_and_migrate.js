(async ()=>{
  try{
    // Load from environment variables for security
    const TOKEN = process.env.NETLIFY_AUTH_TOKEN || '';  // Set via environment
    const SITE_NAME = 'ogunstatenapps';
    const MIGRATION_URL = 'https://ogunstatenapps.netlify.app/.netlify/functions/run-migration';
    const ADMIN_KEY = process.env.ADMIN_KEY || '';  // Set via environment

    const headers = { Authorization: `Bearer ${TOKEN}` };
    console.log('== GET /sites ==');
    const sitesRes = await fetch('https://api.netlify.com/api/v1/sites', { headers });
    if(!sitesRes.ok) throw new Error('Failed fetching sites: '+sitesRes.statusText);
    const sites = await sitesRes.json();
    console.log('Sites count:', sites.length);
    const site = sites.find(s => s.name===SITE_NAME || s.slug===SITE_NAME || s.site_name===SITE_NAME);
    if(!site) { console.error('Site not found'); process.exit(2) }
    console.log('Found site id:', site.id);

    console.log('== trigger build ==');
    const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/builds`, { method: 'POST', headers: {...headers, 'content-type':'application/json'}, body: '{}' });
    if(!buildRes.ok) throw new Error('Build trigger failed: '+buildRes.statusText);
    const build = await buildRes.json();
    console.log('Build triggered:', build.id);

    console.log('== poll latest deploy ==');
    let state = '';
    for(let i=0;i<100;i++){
      const dRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys?per_page=1`, { headers });
      if(!dRes.ok) throw new Error('Failed fetching deploys: '+dRes.statusText);
      const d = await dRes.json();
      if(Array.isArray(d) && d.length>0) { state = d[0].state; console.log(i, 'deploy-state', state); }
      else { state = 'no_deploys'; console.log(i, 'no_deploys'); }
      if(state==='ready'){ console.log('deploy ready'); break }
      await new Promise(r=>setTimeout(r,6000));
    }
    if(state!=='ready') { throw new Error('Deploy did not become ready in time'); }
    console.log('== calling migration endpoint ==');
    const migRes = await fetch(MIGRATION_URL, { method: 'POST', headers: { Authorization: `Bearer ${ADMIN_KEY}` } });
    const migText = await migRes.text();
    console.log('Migration status:', migRes.status);
    console.log(migText);
  }catch(e){ console.error('Error:', e); process.exitCode=1 }
})();
