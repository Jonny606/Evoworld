const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Secret key for JWT
const JWT_SECRET = 'your_super_secret_key';

// Initialize SQLite DB
const db = new sqlite3.Database('./evoworld.db', (err) => {
  if (err) console.error('DB error:', err.message);
  else console.log('Connected to SQLite database.');
});

// Create tables if not exist
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
      password_hash TEXT
    )
  `);

  // Insert default admin if none exists
  db.get(`SELECT * FROM admins WHERE username = 'admin'`, (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync('admin123', 10);
      db.run(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`, ['admin', hash]);
      console.log('Default admin created: username=admin password=admin123');
    }
  });
});

// Middleware to authenticate admin via JWT
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).send('No token provided');
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send('No token provided');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.admin = user;
    next();
  });
}

// Admin login to get token
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing username or password');

  db.get(`SELECT * FROM admins WHERE username = ?`, [username], (err, admin) => {
    if (err) return res.status(500).send(err.message);
    if (!admin) return res.status(401).send('Invalid credentials');

    if (bcrypt.compareSync(password, admin.password_hash)) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ token });
    } else {
      res.status(401).send('Invalid credentials');
    }
  });
});

// Auto-create or get player data
app.get('/player/:id', (req, res) => {
  const id = req.params.id;

  db.get(`SELECT * FROM players WHERE id = ?`, [id], (err, player) => {
    if (err) return res.status(500).send(err.message);

    if (!player) {
      // Create new player
      db.run(
        `INSERT INTO players (id, username, gems, coins, stats, banned) VALUES (?, ?, 0, 0, '{}', 0)`,
        [id, 'New Player'],
        (err) => {
          if (err) return res.status(500).send(err.message);
          db.get(`SELECT * FROM players WHERE id = ?`, [id], (err, newPlayer) => {
            if (err) return res.status(500).send(err.message);
            res.json(newPlayer);
          });
        }
      );
    } else {
      if (player.banned === 1) return res.status(403).send('You are banned from this game.');
      res.json(player);
    }
  });
});

// Update username
app.post('/player/:id/set-username', (req, res) => {
  const id = req.params.id;
  const { username } = req.body;
  if (!username) return res.status(400).send('Username required');

  db.run(`UPDATE players SET username = ? WHERE id = ?`, [username, id], function (err) {
    if (err) return res.status(500).send(err.message);
    if (this.changes === 0) return res.status(404).send('Player not found');
    res.send('Username updated');
  });
});

// Give gems (admin)
app.post('/player/:id/give-gems', authenticateAdmin, (req, res) => {
  const id = req.params.id;
  const amount = parseInt(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).send('Invalid amount');

  db.run(`UPDATE players SET gems = gems + ? WHERE id = ?`, [amount, id], function (err) {
    if (err) return res.status(500).send(err.message);
    if (this.changes === 0) return res.status(404).send('Player not found');

    db.get(`SELECT * FROM players WHERE id = ?`, [id], (err, player) => {
      if (err) return res.status(500).send(err.message);
      res.json(player);
    });
  });
});

// Spend gems (player)
app.post('/player/:id/spend-gems', (req, res) => {
  const id = req.params.id;
  const amount = parseInt(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).send('Invalid amount');

  db.get(`SELECT gems FROM players WHERE id = ?`, [id], (err, player) => {
    if (err) return res.status(500).send(err.message);
    if (!player) return res.status(404).send('Player not found');
    if (player.gems < amount) return res.status(400).send('Not enough gems');

    db.run(`UPDATE players SET gems = gems - ? WHERE id = ?`, [amount, id], function (err) {
      if (err) return res.status(500).send(err.message);
      res.send('Gems spent successfully');
    });
  });
});

// Give coins (admin)
app.post('/player/:id/give-coins', authenticateAdmin, (req, res) => {
  const id = req.params.id;
  const amount = parseInt(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).send('Invalid amount');

  db.run(`UPDATE players SET coins = coins + ? WHERE id = ?`, [amount, id], function (err) {
    if (err) return res.status(500).send(err.message);
    if (this.changes === 0) return res.status(404).send('Player not found');

    db.get(`SELECT * FROM players WHERE id = ?`, [id], (err, player) => {
      if (err) return res.status(500).send(err.message);
      res.json(player);
    });
  });
});

// Spend coins (player)
app.post('/player/:id/spend-coins', (req, res) => {
  const id = req.params.id;
  const amount = parseInt(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).send('Invalid amount');

  db.get(`SELECT coins FROM players WHERE id = ?`, [id], (err, player) => {
    if (err) return res.status(500).send(err.message);
    if (!player) return res.status(404).send('Player not found');
    if (player.coins < amount) return res.status(400).send('Not enough coins');

    db.run(`UPDATE players SET coins = coins - ? WHERE id = ?`, [amount, id], function (err) {
      if (err) return res.status(500).send(err.message);
      res.send('Coins spent successfully');
    });
  });
});

// Ban/unban players (admin)
app.post('/player/:id/ban', authenticateAdmin, (req, res) => {
  const id = req.params.id;
  const { ban } = req.body;

  db.run(`UPDATE players SET banned = ? WHERE id = ?`, [ban ? 1 : 0, id], function (err) {
    if (err) return res.status(500).send(err.message);
    if (this.changes === 0) return res.status(404).send('Player not found');
    res.send(`Player ${ban ? 'banned' : 'unbanned'}`);
  });
});

const path = require('path');

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'dist')));

// For any other route, serve index.html so React Router works
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Evoworld server running on http://localhost:${PORT}`);
});
