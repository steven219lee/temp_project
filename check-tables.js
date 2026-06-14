const https = require('https');
const key = 'sb_publishable_m7EoolONhwDDZ-Z9Z2mOlA_zsg9pq9q';

function get(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'iilxpdvfgagplvkoujzd.supabase.co',
      path: '/rest/v1/' + path,
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      method: 'GET',
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: d.slice(0, 500) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Check users table structure
  const u = await get('users?select=*&limit=1');
  console.log('users:', u.status, u.data);

  // Check what tables exist by querying the pg_catalog
  const t = await get('user_logs?select=id&limit=1');
  console.log('user_logs:', t.status, t.data);
}
main().then(() => process.exit(0));