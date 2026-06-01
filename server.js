require('dotenv').config();
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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sarah.karacic@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'donutsarajevo';

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.CLEARDB_DATABASE_URL || process.env.RAILWAY_DATABASE_URL;
let dbHost = process.env.MYSQLHOST || process.env.RAILWAY_DB_HOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost';
let dbPort = process.env.MYSQLPORT || process.env.RAILWAY_DB_PORT || process.env.MYSQL_PORT || process.env.DB_PORT || 3306;
let dbUser = process.env.MYSQLUSER || process.env.RAILWAY_DB_USER || process.env.MYSQL_USER || process.env.DB_USER || 'root';
let dbPassword = process.env.MYSQLPASSWORD || process.env.RAILWAY_DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASS || '';
let dbName = process.env.MYSQLDATABASE || process.env.RAILWAY_DB_NAME || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'chokosfera';

if (databaseUrl) {
  try {
    const parsedUrl = new URL(databaseUrl);
    if (parsedUrl.hostname) dbHost = parsedUrl.hostname;
    if (parsedUrl.port) dbPort = Number(parsedUrl.port);
    if (parsedUrl.username) dbUser = parsedUrl.username;
    if (parsedUrl.password) dbPassword = parsedUrl.password;
    const pathName = parsedUrl.pathname || '';
    if (pathName.length > 1) dbName = pathName.replace(/^\//, '');
  } catch (err) {
    console.warn('Unable to parse database URL:', err.message);
  }
}

const basePool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log('Database connection settings:', {
  host: dbHost,
  port: dbPort,
  database: dbName,
  usingUrl: !!databaseUrl,
});

async function initializeDatabase() {
  const createTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;

  try {
    const conn = await pool.getConnection();
    await conn.query(createTableSql);
    conn.release();
    console.log('Database initialized successfully on', dbHost, dbName);
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.warn('Database does not exist, attempting creation:', dbName);
      const conn = await basePool.getConnection();
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      conn.release();
      const conn2 = await pool.getConnection();
      await conn2.query(createTableSql);
      conn2.release();
      console.log('Database created and initialized successfully');
    } else {
      console.error('Failed to initialize database:', error);
      throw error;
    }
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
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      conn.release();
      return res.status(409).json({ error: 'Email already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, 'user']
    );
    conn.release();
    const userId = result.insertId.toString();
    const token = jwt.sign({ id: userId, email, name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Registration successful!', user: { id: userId, name, email }, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  // Admin check
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ id: 'admin', email: ADMIN_EMAIL, name: 'Admin', isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      message: 'Login successful!',
      user: { id: 'admin', name: 'Admin', email: ADMIN_EMAIL },
      token,
      isAdmin: true
    });
  }

  try {
    const conn = await pool.getConnection();
    const [users] = await conn.query('SELECT id, username, password FROM users WHERE email = ?', [email]);
    conn.release();
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = users[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email, name: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login successful!',
      user: { id: user.id, name: user.username, email },
      token,
      isAdmin: false
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

app.get('/api/profile', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json({ user: payload });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/dbstatus', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    res.json({ ok: true, host: dbHost, database: dbName, usingUrl: !!databaseUrl });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message, host: dbHost, database: dbName });
  }
});

app.post('/api/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

const ordersRouter = require('./order_backend');
app.use('/api/orders', ordersRouter);

initializeDatabase().then(() => {
  app.listen(PORT, () => console.log(`Chokosfera backend running at http://localhost:${PORT}`));
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});