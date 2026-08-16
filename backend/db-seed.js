// db-seed.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const saltRounds = 10;

const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Connected to the database for seeding.');

    // Clear existing data
    await client.query('DELETE FROM time_entries;');
    await client.query('DELETE FROM tasks;');
    await client.query('DELETE FROM admin_employees;');
    await client.query('DELETE FROM users;');
    console.log('Cleared existing data.');

    // --- Create Users ---
    const adminPassword = await bcrypt.hash('adminpass', saltRounds);
    const adminRes = await client.query(
      `INSERT INTO users (username, password, role) VALUES ('admin', $1, 'admin') RETURNING id`,
      [adminPassword]
    );
    const adminId = adminRes.rows[0].id;
    console.log(`Created admin user with ID: ${adminId}`);

    const employee1Password = await bcrypt.hash('employeepass1', saltRounds);
    const employee1Res = await client.query(
      `INSERT INTO users (username, password, role) VALUES ('employee1', $1, 'employee') RETURNING id`,
      [employee1Password]
    );
    const employee1Id = employee1Res.rows[0].id;
    console.log(`Created employee1 user with ID: ${employee1Id}`);

    const employee2Password = await bcrypt.hash('employeepass2', saltRounds);
    const employee2Res = await client.query(
      `INSERT INTO users (username, password, role) VALUES ('employee2', $1, 'employee') RETURNING id`,
      [employee2Password]
    );
    const employee2Id = employee2Res.rows[0].id;
    console.log(`Created employee2 user with ID: ${employee2Id}`);

    const employee3Password = await bcrypt.hash('employeepass3', saltRounds);
    const employee3Res = await client.query(
      `INSERT INTO users (username, password, role) VALUES ('employee3', $1, 'employee') RETURNING id`,
      [employee3Password]
    );
    const employee3Id = employee3Res.rows[0].id;
    console.log(`Created employee3 user with ID: ${employee3Id}`);

    // --- Link Employees to Admin ---
    await client.query(
      'INSERT INTO admin_employees (admin_id, employee_id) VALUES ($1, $2), ($1, $3), ($1, $4)',
      [adminId, employee1Id, employee2Id, employee3Id]
    );
    console.log('Linked employees to admin.');

    // --- Create Tasks ---
    await client.query(
      `INSERT INTO tasks (title, creator_id, assignee_id) VALUES
        ('Review project proposal', $1, $2),
        ('Develop feature X', $1, $2),
        ('Fix bug in login page', $1, $3),
        ('Prepare weekly report', $1, $4)`,
      [adminId, employee1Id, employee2Id, employee3Id]
    );
    console.log('Created sample tasks.');

    console.log('Database seeding completed successfully.');

  } catch (err) {
    console.error('Error during database seeding:', err);
  } finally {
    await client.release();
    await pool.end();
    console.log('Database connection closed.');
  }
};

seedDatabase();
