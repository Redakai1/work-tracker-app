require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- Database Pool ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- Express App Setup ---
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// --- JWT Configuration ---
// IMPORTANT: In a production environment, use a strong, secret key stored in environment variables.
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

// --- Middleware ---

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user;
    next();
  });
};

// Middleware to authorize admin users
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// --- Helper function for transactions ---
const runInTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};


// --- API Routers ---
const authRouter = express.Router();
const adminRouter = express.Router();
const employeeRouter = express.Router();
const tasksRouter = express.Router(); // For shared task operations


app.use('/api/auth', authRouter);
app.use('/api/admin', authenticateToken, isAdmin, adminRouter);
app.use('/api/employee', authenticateToken, employeeRouter);
app.use('/api/tasks', authenticateToken, tasksRouter);


// --- Authentication Routes ---

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- Admin Routes ---

// GET /api/admin/employees - Get all employees managed by the admin
adminRouter.get('/employees', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.username FROM users u
             JOIN admin_employees ae ON u.id = ae.employee_id
             WHERE ae.admin_id = $1`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/tasks - Create a new task and assign it to an employee
adminRouter.post('/tasks', async (req, res) => {
    try {
        const { title, assignee_id } = req.body;
        if (!title || !assignee_id) {
            return res.status(400).json({ error: 'Title and assignee_id are required' });
        }

        const result = await pool.query(
            'INSERT INTO tasks (title, creator_id, assignee_id) VALUES ($1, $2, $3) RETURNING *',
            [title, req.user.id, assignee_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET /api/admin/stats - Get time tracking stats for all employees
adminRouter.get('/stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                u.id AS employee_id,
                u.username AS employee_name,
                COALESCE(SUM(t.total_time_spent), 0) AS total_time
             FROM users u
             JOIN admin_employees ae ON u.id = ae.employee_id
             LEFT JOIN tasks t ON u.id = t.assignee_id
             WHERE ae.admin_id = $1
             GROUP BY u.id, u.username
             ORDER BY u.username`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/employees/:employeeId/tasks - Get all tasks for a specific employee
adminRouter.get('/employees/:employeeId/tasks', async (req, res) => {
    try {
        const { employeeId } = req.params;
        // Optional: Check if the admin is allowed to see this employee
        const relationCheck = await pool.query(
            'SELECT * FROM admin_employees WHERE admin_id = $1 AND employee_id = $2',
            [req.user.id, employeeId]
        );
        if (relationCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You are not authorized to view tasks for this employee.' });
        }

        const result = await pool.query(
            'SELECT * FROM tasks WHERE assignee_id = $1 ORDER BY id DESC',
            [employeeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- Employee Routes ---

// GET /api/employee/tasks - Get tasks for the logged-in employee
employeeRouter.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE assignee_id = $1 ORDER BY id DESC', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- Task Time-tracking Routes (shared logic) ---

// POST /api/tasks/:id/start
tasksRouter.post('/:id/start', async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; // Employee's own ID

    try {
        const updatedTask = await runInTransaction(async (client) => {
            // 1. Ensure the task belongs to the user trying to start it
            const taskRes = await client.query('SELECT * FROM tasks WHERE id = $1 AND assignee_id = $2', [id, userId]);
            if (taskRes.rows.length === 0) {
                throw new Error('Task not found or not assigned to you');
            }

            // 2. Stop any other task that the current user has in progress
            const runningTaskRes = await client.query(
                "SELECT id, assignee_id FROM tasks WHERE status = 'in_progress' AND assignee_id = $1",
                [userId]
            );

            if (runningTaskRes.rows.length > 0) {
                const runningTaskId = runningTaskRes.rows[0].id;
                 const lastEntryRes = await client.query(
                    "SELECT id, start_time FROM time_entries WHERE task_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1",
                    [runningTaskId]
                );
                if (lastEntryRes.rows.length > 0) {
                    const lastEntry = lastEntryRes.rows[0];
                    const now = new Date();
                    const duration = Math.round((now.getTime() - lastEntry.start_time.getTime()) / 1000);

                    await client.query("UPDATE time_entries SET end_time = NOW() WHERE id = $1", [lastEntry.id]);
                    await client.query("UPDATE tasks SET total_time_spent = total_time_spent + $1, status = 'pending' WHERE id = $2", [duration, runningTaskId]);
                }
            }

            // 3. Start the new task
            await client.query("INSERT INTO time_entries (task_id, start_time) VALUES ($1, NOW())", [id]);
            const result = await client.query("UPDATE tasks SET status = 'in_progress' WHERE id = $1 RETURNING *", [id]);

            return result.rows[0];
        });

        res.json(updatedTask);

    } catch (err) {
        console.error(err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


// POST /api/tasks/:id/stop
tasksRouter.post('/:id/stop', async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const updatedTask = await runInTransaction(async (client) => {
            // Ensure the task belongs to the user
            const taskRes = await client.query('SELECT * FROM tasks WHERE id = $1 AND assignee_id = $2', [id, userId]);
            if (taskRes.rows.length === 0) {
                throw new Error('Task not found or not assigned to you');
            }
            if (taskRes.rows[0].status !== 'in_progress') {
                throw new Error('Task is not running');
            }

            const lastEntryRes = await client.query(
                "SELECT id, start_time FROM time_entries WHERE task_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1",
                [id]
            );
            if (lastEntryRes.rows.length === 0) throw new Error('Task is not running');

            const lastEntry = lastEntryRes.rows[0];
            const now = new Date();
            const duration = Math.round((now.getTime() - lastEntry.start_time.getTime()) / 1000);

            await client.query("UPDATE time_entries SET end_time = NOW() WHERE id = $1", [lastEntry.id]);
            const result = await client.query(
                "UPDATE tasks SET total_time_spent = total_time_spent + $1, status = 'pending' WHERE id = $2 RETURNING *",
                [duration, id]
            );

            return result.rows[0];
        });

        res.json(updatedTask);
    } catch (err) {
        console.error(err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }
         if (err.message.includes('not running')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/tasks/:id - Delete a task
adminRouter.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Using a transaction to delete a task and its time entries
    await runInTransaction(async (client) => {
      await client.query('DELETE FROM time_entries WHERE task_id = $1', [id]);
      const result = await client.query('DELETE FROM tasks WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        // Throw an error to trigger rollback if the task was not found
        throw new Error('Task not found');
      }
    });
    res.status(204).send(); // No Content
  } catch (err) {
    console.error(err);
    if (err.message === 'Task not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- Root and DB Test (for basic checks) ---
app.get('/', (req, res) => {
  res.send('Hello from the Work Tracker API! V2');
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Database connection successful!',
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Database connection failed!',
      error: err.message,
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});