// db-init.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const setupDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Connected to the database.');

    // Drop tables in reverse order of creation due to dependencies
    await client.query('DROP TABLE IF EXISTS time_entries;');
    await client.query('DROP TABLE IF EXISTS tasks;');
    await client.query('DROP TABLE IF EXISTS admin_employees;');
    await client.query('DROP TABLE IF EXISTS users;');
    console.log('Existing tables dropped.');

    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL, -- 'admin' or 'employee'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "users" is ready.');

    // Create admin_employees table
    await client.query(`
      CREATE TABLE admin_employees (
        admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (admin_id, employee_id)
      );
    `);
    console.log('Table "admin_employees" is ready.');

    // Create tasks table
    await client.query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
        total_time_spent INTEGER NOT NULL DEFAULT 0, -- in seconds
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    console.log('Table "tasks" is ready.');

    // Create time_entries table
    await client.query(`
      CREATE TABLE time_entries (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "time_entries" is ready.');

    console.log('Database setup completed successfully.');

  } catch (err) {
    console.error('Error during database setup:', err);
  } finally {
    await client.release();
    await pool.end();
    console.log('Database connection closed.');
  }
};

setupDatabase();