const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.RAILWAY_DB_HOST || 'localhost',
  port: process.env.RAILWAY_DB_PORT || 3306,
  user: process.env.RAILWAY_DB_USER || 'root',
  password: process.env.RAILWAY_DB_PASSWORD || '',
  database: process.env.RAILWAY_DB_NAME || 'chokosfera',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database table
async function initializeDatabase() {
  try {
    const conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    conn.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chokosfera.html'));
});

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  
  try {
    const conn = await pool.getConnection();
    
    // Check if email already exists
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      conn.release();
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    // Hash password and insert user
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await conn.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
      [name, email, hashed]);
    
    conn.release();
    
    const userId = result.insertId.toString();
    const token = jwt.sign({ id: userId, email: email, name: name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: userId, name: name, email: email }, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  
  try {
    const conn = await pool.getConnection();
    
    // Find user by email
    const [users] = await conn.query('SELECT id, username, password FROM users WHERE email = ?', [email]);
    conn.release();
    
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = users[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, email: email, name: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.username, email: email }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

app.get('/api/profile', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: payload });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/logout', (req, res) => {
  // Logout is handled client-side by removing token from localStorage
  // This endpoint exists for consistency
  res.json({ success: true, message: 'Logged out successfully' });
});

const ordersRouter = require('./order_backend');
app.use('/api/orders', ordersRouter);

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => console.log(`Chokosfera backend running at http://localhost:${PORT}`));
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
