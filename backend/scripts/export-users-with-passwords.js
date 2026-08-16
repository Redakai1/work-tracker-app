require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Known plain-text passwords from db-seed.js
const seedPasswords = {
  admin: 'adminpass',
  employee1: 'employeepass1',
  employee2: 'employeepass2',
  employee3: 'employeepass3',
};

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const outPath = path.join(__dirname, 'users-with-passwords.csv');
  try {
    const res = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
    const rows = res.rows || [];

    const header = ['id', 'username', 'role', 'created_at', 'plain_password'];
    const lines = [header.join(',')];

    rows.forEach(r => {
      const plain = seedPasswords[r.username] || '';
      // Escape values that may contain commas or quotes
      const esc = v => (v === null || v === undefined) ? '' : (`"${String(v).replace(/"/g, '""')}"`);
      lines.push([r.id, r.username, r.role, r.created_at, plain].map(esc).join(','));
    });

    fs.writeFileSync(outPath, lines.join('\n'));
    console.log('CSV written to', outPath);
    console.log('Preview:');
    console.log(lines.slice(0, 20).join('\n'));
  } catch (err) {
    console.error('Error exporting users:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
