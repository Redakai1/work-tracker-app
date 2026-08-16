require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
    if (!res.rows || res.rows.length === 0) {
      console.log('No users found');
    } else {
      console.log(JSON.stringify(res.rows, null, 2));
    }
  } catch (err) {
    console.error('Error querying users:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
