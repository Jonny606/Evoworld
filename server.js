import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Secret key for JWT (use env var in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// Initialize SQLite database
const db = new sqlite3.Database('./evoworld.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT,
      gems INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      stats TEXT DEFAULT '{}',
      banned INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL
    )
  `);

  // Create default admin if missing
  db.get(`SELECT * FROM admins WHERE username = 'admin'`, (err, row) => {
    if (err) {
      console.error('Error checking admin:', err.message);
      return;
    }
    if (!row) {
      const hash = bcrypt.hashSync('admin123', 10);
      db.run(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`, ['admin', hash]);
      console.log('Default admin created (username: admin, password: admin123)');
    }
  });
});

// Middleware to authenticate admin with JWT
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.admin = admin;
    next();
  });
}

// Admin login route to get JWT token
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  db.get(`SELECT * FROM admins WHERE username = ?`, [username], (err, admin) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    if (bcrypt.compareSync(password, admin.password_hash)) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Get player info or create new player if not found
app.get('/player/:id', (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM players WHERE id = ?`, [id], (err, player) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!player) {
      // Create new player
      db.run(
        `INSERT INTO players (id, username) VALUES (?, ?)`,
        [id, 'New Player'],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          db.get(`SELECT * FROM players WHERE id = ?`, [id], (err3, newPlayer) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json(newPlayer);
          });
        }
      );
    } else {
      if (player.banned === 1) return res.status(403).json({ error: 'You are banned from this game.' });
      res.json(player);
    }
  });
});

// Update player username
app.post('/player/:id/set-username', (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) return res.status(400).json({ error: 'Username required' });

  db.run(`UPDATE players SET username = ? WHERE id = ?`, [username, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.json({ message: 'Username updated' });
  });
});

// Admin routes to give gems and coins
app.post('/player/:id/give-gems', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const amount = parseInt(req.body.amount);

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  db.run(`UPDATE players SET gems = gems + ? WHERE id = ?`, [amount, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });

    db.get(`SELECT * FROM players WHERE id = ?`, [id], (err2, player) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(player);
    });
  });
});

app.post('/player/:id/give-coins', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const amount = parseInt(req.body.amount);

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  db.run(`UPDATE players SET coins = coins + ? WHERE id = ?`, [amount, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });

    db.get(`SELECT * FROM players WHERE id = ?`, [id], (err2, player) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(player);
    });
  });
});

// Player routes to spend gems and coins
app.post('/player/:id/spend-gems', (req, res) => {
  const { id } = req.params;
  const amount = parseInt(req.body.amount);

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  db.get(`SELECT gems FROM players WHERE id = ?`, [id], (err, player) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (player.gems < amount) return res.status(400).json({ error: 'Not enough gems' });

    db.run(`UPDATE players SET gems = gems - ? WHERE id = ?`, [amount, id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: 'Gems spent successfully' });
    });
  });
});

app.post('/player/:id/spend-coins', (req, res) => {
  const { id } = req.params;
  const amount = parseInt(req.body.amount);

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  db.get(`SELECT coins FROM players WHERE id = ?`, [id], (err, player) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (player.coins < amount) return res.status(400).json({ error: 'Not enough coins' });

    db.run(`UPDATE players SET coins = coins - ? WHERE id = ?`, [amount, id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: 'Coins spent successfully' });
    });
  });
});

// Admin ban/unban player
app.post('/player/:id/ban', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { ban } = req.body;

  const banValue = ban ? 1 : 0;

  db.run(`UPDATE players SET banned = ? WHERE id = ?`, [banValue, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.json({ message: `Player ${ban ? 'banned' : 'unbanned'}` });
  });
});

// Serve frontend static files from 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all to serve index.html for SPA routing support
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Evoworld server running on http://localhost:${PORT}`);
});
