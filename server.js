'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const https = require('https');

// ─── Constants ───────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bletaria-secret-2025';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-bletaria-2025';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const DATA_DIR = '/opt/bletaria/data';
const UPLOADS_DIR = '/opt/bletaria/uploads';
const DB_PATH = path.join(DATA_DIR, 'bletaria.db');
const AI_MONTHLY_LIMIT = 10;

// ─── Directory Setup ──────────────────────────────────────────────────────────

[DATA_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ─── Database Init ────────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar TEXT,
    reset_token TEXT,
    reset_token_expires INTEGER,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS apiaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    rows INTEGER NOT NULL DEFAULT 1,
    hives_per_row INTEGER NOT NULL DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS hives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apiary_id INTEGER NOT NULL,
    position_row INTEGER NOT NULL,
    position_col INTEGER NOT NULL,
    unique_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'good',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apiary_id) REFERENCES apiaries(id)
  );

  CREATE TABLE IF NOT EXISTS hive_floors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hive_id INTEGER NOT NULL,
    floor_number INTEGER NOT NULL,
    frames_bees INTEGER DEFAULT 0,
    frames_eggs INTEGER DEFAULT 0,
    frames_honey INTEGER DEFAULT 0,
    frames_new INTEGER DEFAULT 0,
    FOREIGN KEY (hive_id) REFERENCES hives(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apiary_id INTEGER NOT NULL,
    visit_date TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apiary_id) REFERENCES apiaries(id)
  );

  CREATE TABLE IF NOT EXISTS hive_visit_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL,
    hive_id INTEGER NOT NULL,
    queen_present INTEGER DEFAULT 1,
    queen_age_months INTEGER,
    status TEXT DEFAULT 'good',
    notes TEXT,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    FOREIGN KEY (hive_id) REFERENCES hives(id)
  );

  CREATE TABLE IF NOT EXISTS hive_floor_visit_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hive_visit_data_id INTEGER NOT NULL,
    floor_id INTEGER NOT NULL,
    frames_bees INTEGER,
    frames_eggs INTEGER,
    frames_honey INTEGER,
    frames_new INTEGER,
    FOREIGN KEY (hive_visit_data_id) REFERENCES hive_visit_data(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feeding_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apiary_id INTEGER NOT NULL,
    plan_date TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apiary_id) REFERENCES apiaries(id)
  );

  CREATE TABLE IF NOT EXISTS feeding_plan_hives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feeding_plan_id INTEGER NOT NULL,
    hive_id INTEGER NOT NULL,
    food_amount TEXT,
    medicine TEXT,
    notes TEXT,
    FOREIGN KEY (feeding_plan_id) REFERENCES feeding_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (hive_id) REFERENCES hives(id)
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS marketplace_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price REAL,
    category TEXT,
    image_url TEXT,
    contact TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    admin_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month_year TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    UNIQUE(user_id, month_year),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// ─── Seed Data ────────────────────────────────────────────────────────────────

// Default admin
const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('Default admin created: admin / admin123');
}

// Default settings
const listingExpiry = db.prepare("SELECT value FROM app_settings WHERE key = 'listing_expiry_days'").get();
if (!listingExpiry) {
  db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('listing_expiry_days', '30')").run();
}

// Sample news
const newsCount = db.prepare('SELECT COUNT(*) as c FROM news').get();
if (newsCount.c === 0) {
  const sampleNews = [
    {
      title: 'Sezoni i Bletarisë 2025: Çfarë duhet të dini',
      content: `Sezoni i ri i bletarisë ka filluar dhe bletarët në të gjithë vendin po përgatiten për muajt e ngjeshur të punës. Ekspertët rekomandojnë që çdo bletari të kryejë inspektimin e plotë të kosherëve gjatë muajit prill, para lulëzimit të florës kryesore.

Vëmendje e veçantë duhet t'i kushtohet kontrollit të mbretëreshës, nivelit të ushqimit dhe gjendjes sanitare të kosherëve. Bletarët me përvojë sugjerojnë të kryhen së paku dy vizita në javë gjatë majit dhe qershorit.

Vitin e kaluar, prodhimi mesatar i mjaltit në Kosovë arriti në 18-22 kg për koshëre, ndërsa projeksionet për 2025 janë optimiste falë kushteve të favorshme atmosferike. Ministria e Bujqësisë ka njoftuar programe mbështetëse për bletarët e rinj, duke përfshirë subvencione për pajisje dhe trajnime profesionale.`,
      image_url: null
    },
    {
      title: 'Sëmundja Varroa: Si ta luftojmë efektivisht',
      content: `Varroa destructor mbetet kërcënimi kryesor për bletaritë në të gjithë botën. Ky parazit i jashtëm sulmoi kolonitë e bleive dhe mund të shkaktojë humbje të mëdha nëse nuk trajtohet me kohë.

Metodat e luftimit ndahen në: kimike (acide organike si acidi oksalik, tirmolik dhe format), biologjike (heqja e mjaltit të dronëve) dhe mekanike (pauzat e rritjes së pjellës).

Trajtimi me acid oksalik gjatë dimrit, kur kolonitë janë pa pjellë, është metoda më efektive dhe e sigurt. Është e rëndësishme të monitorohet numri i acarëve çdo muaj duke përdorur metodën e rrëshqitjes alkoolike - mbi 3 acarë për 100 blete tregon nevojën urgjente për trajtim.

Rotacioni i barnave kimike ndihmon në parandalimin e rezistencës. Konsultohuni gjithmonë me veterinerin e komunës tuaj para çdo trajtimi.`,
      image_url: null
    },
    {
      title: 'Teknikat moderne të nxjerrjes dhe ruajtjes së mjaltit',
      content: `Mjalti i cilësisë së lartë kërkon kujdes të veçantë si gjatë nxjerrjes ashtu edhe gjatë ruajtjes. Gabime të vogla mund të ndikojnë ndjeshëm në cilësinë dhe shijen e produktit final.

Nxjerrja duhet të bëhet vetëm kur mjalti është i pjekur - kornizat duhet të jenë të paktën 80% të mbyllura me kapak dylli. Mjalti i papjekur ka lagështi të lartë dhe fermenton lehtë. Temperatura ideale e dhomës gjatë nxjerrjes është 25-30°C.

Centrifugat moderne me dy shpejtësi lejojnë nxjerrje pa dëmtuar kornizat. Pas nxjerrjes, mjalti duhet filtruar dy herë dhe lënë të qetësohet 24-48 orë për të hequr flluskat e ajrit.

Enët prej qelqi janë ideale për ruajtje - shmangni plastikën. Temperatura e ruajtjes duhet të jetë 10-18°C, larg dritës direkte. Mjalti i ruajtur siç duhet ruan cilësinë e tij për 2-3 vjet.`,
      image_url: null
    }
  ];

  const insertNews = db.prepare('INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)');
  sampleNews.forEach(n => insertNews.run(n.title, n.content, n.image_url));
  console.log('Sample news inserted.');
}

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Multer Config ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Vetëm imazhet lejohen'), false);
    }
  }
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token i mungueshëm' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, first_name, last_name, email, role, avatar, active FROM users WHERE id = ?').get(payload.id);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Llogaria është joaktive ose nuk ekziston' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token i pavlefshëm' });
  }
}

function adminMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token i mungueshëm' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    const admin = db.prepare('SELECT id, username FROM admin_users WHERE id = ?').get(payload.id);
    if (!admin) {
      return res.status(401).json({ error: 'Admin nuk gjendet' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token admin i pavlefshëm' });
  }
}

// ─── Helper: apiary ownership check ──────────────────────────────────────────

function getOwnedApiary(apiaryId, userId) {
  return db.prepare('SELECT * FROM apiaries WHERE id = ? AND user_id = ?').get(apiaryId, userId);
}

function getOwnedHive(hiveId, userId) {
  return db.prepare(`
    SELECT h.* FROM hives h
    JOIN apiaries a ON h.apiary_id = a.id
    WHERE h.id = ? AND a.user_id = ?
  `).get(hiveId, userId);
}

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────

app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nuk u ngarkua asnjë skedar' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  let { first_name, last_name, name, email, password } = req.body;
  // Accept 'name' field and split into first/last
  if (name && !first_name) {
    const parts = name.trim().split(' ');
    first_name = parts[0];
    last_name = parts.slice(1).join(' ') || parts[0];
  }
  if (!first_name || !email || !password) {
    return res.status(400).json({ error: 'Të gjitha fushat janë të detyrueshme' });
  }
  last_name = last_name || first_name;
  if (password.length < 6) {
    return res.status(400).json({ error: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email-i është regjistruar tashmë' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)'
  ).run(first_name.trim(), last_name.trim(), email.toLowerCase().trim(), hash);

  const user = db.prepare('SELECT id, first_name, last_name, email, role, avatar FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dhe fjalëkalimi janë të detyrueshëm' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar' });
  }
  if (!user.active) {
    return res.status(403).json({ error: 'Llogaria është e çaktivizuar' });
  }
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar' });
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
  const { password_hash, reset_token, reset_token_expires, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email-i është i detyrueshëm' });
  }
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    // Don't reveal whether email exists
    return res.json({ message: 'Nëse email-i ekziston, do të marrësh udhëzime për rivendosjen' });
  }
  const token = require('crypto').randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(token, expires, user.id);
  // In dev, return the token directly. In production, send via email.
  res.json({
    message: 'Token i rivendosjes është gjeneruar',
    reset_token: token, // dev only
    expires_in: '1 orë'
  });
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token dhe fjalëkalimi janë të detyrueshëm' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere' });
  }
  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);
  if (!user) {
    return res.status(400).json({ error: 'Token i pavlefshëm' });
  }
  if (user.reset_token_expires < Date.now()) {
    return res.status(400).json({ error: 'Token ka skaduar' });
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(hash, user.id);
  res.json({ message: 'Fjalëkalimi u rivendos me sukses' });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ─── APIARIES ─────────────────────────────────────────────────────────────────

// GET /api/apiaries
app.get('/api/apiaries', authMiddleware, (req, res) => {
  const apiaries = db.prepare(`
    SELECT a.*,
      COUNT(DISTINCT h.id) as hive_count,
      COUNT(DISTINCT h.id) as total_hives
    FROM apiaries a
    LEFT JOIN hives h ON h.apiary_id = a.id
    WHERE a.user_id = ?
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all(req.user.id);
  
  const apiariesWithStatus = apiaries.map(apiary => {
    const statuses = db.prepare('SELECT status, COUNT(*) as cnt FROM hives WHERE apiary_id = ? GROUP BY status').all(apiary.id);
    const status_summary = { good: 0, problem: 0, dead: 0, empty: 0 };
    statuses.forEach(s => { status_summary[s.status] = s.cnt; });
    return { ...apiary, status_summary };
  });
  res.json(apiariesWithStatus);
});

// POST /api/apiaries
app.post('/api/apiaries', authMiddleware, (req, res) => {
  const { name, rows, hives_per_row } = req.body;
  if (!name || !rows || !hives_per_row) {
    return res.status(400).json({ error: 'Emri, rreshtat dhe kosherët për rresht janë të detyrueshëm' });
  }
  const r = parseInt(rows);
  const c = parseInt(hives_per_row);
  if (r < 1 || r > 50 || c < 1 || c > 50) {
    return res.status(400).json({ error: 'Rreshtat dhe kosherët duhet të jenë ndërmjet 1 dhe 50' });
  }

  const createApiary = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO apiaries (user_id, name, rows, hives_per_row) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, name.trim(), r, c);
    const apiaryId = result.lastInsertRowid;

    const insertHive = db.prepare(
      'INSERT INTO hives (apiary_id, position_row, position_col, unique_code, status) VALUES (?, ?, ?, ?, ?)'
    );
    const insertFloor = db.prepare(
      'INSERT INTO hive_floors (hive_id, floor_number) VALUES (?, 1)'
    );

    for (let row = 1; row <= r; row++) {
      for (let col = 1; col <= c; col++) {
        const code = `K${apiaryId}-R${row}C${col}`;
        const hiveResult = insertHive.run(apiaryId, row, col, code, 'good');
        insertFloor.run(hiveResult.lastInsertRowid);
      }
    }

    return db.prepare('SELECT * FROM apiaries WHERE id = ?').get(apiaryId);
  });

  const apiary = createApiary();
  res.status(201).json(apiary);
});

// GET /api/apiaries/:id
app.get('/api/apiaries/:id', authMiddleware, (req, res) => {
  const apiary = getOwnedApiary(req.params.id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });

  const hives = db.prepare(`
    SELECT h.*,
      (SELECT COUNT(*) FROM hive_floors WHERE hive_id = h.id) as floor_count
    FROM hives h
    WHERE h.apiary_id = ?
    ORDER BY h.position_row, h.position_col
  `).all(apiary.id);

  const hivesWithFloors = hives.map(hive => {
    const floors = db.prepare('SELECT * FROM hive_floors WHERE hive_id = ? ORDER BY floor_number').all(hive.id);
    return { ...hive, floors };
  });

  res.json({ ...apiary, hives: hivesWithFloors });
});

// PUT /api/apiaries/:id
app.put('/api/apiaries/:id', authMiddleware, (req, res) => {
  const apiary = getOwnedApiary(req.params.id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Emri është i detyrueshëm' });

  db.prepare('UPDATE apiaries SET name = ? WHERE id = ?').run(name.trim(), apiary.id);
  res.json(db.prepare('SELECT * FROM apiaries WHERE id = ?').get(apiary.id));
});

// DELETE /api/apiaries/:id
app.delete('/api/apiaries/:id', authMiddleware, (req, res) => {
  const apiary = getOwnedApiary(req.params.id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });

  const deleteAll = db.transaction(() => {
    // Cascade manually (some foreign keys may cascade, but be explicit)
    const hives = db.prepare('SELECT id FROM hives WHERE apiary_id = ?').all(apiary.id);
    hives.forEach(h => db.prepare('DELETE FROM hive_floors WHERE hive_id = ?').run(h.id));

    const visits = db.prepare('SELECT id FROM visits WHERE apiary_id = ?').all(apiary.id);
    visits.forEach(v => {
      const hvds = db.prepare('SELECT id FROM hive_visit_data WHERE visit_id = ?').all(v.id);
      hvds.forEach(hvd => db.prepare('DELETE FROM hive_floor_visit_data WHERE hive_visit_data_id = ?').run(hvd.id));
      db.prepare('DELETE FROM hive_visit_data WHERE visit_id = ?').run(v.id);
    });
    db.prepare('DELETE FROM visits WHERE apiary_id = ?').run(apiary.id);

    const fps = db.prepare('SELECT id FROM feeding_plans WHERE apiary_id = ?').all(apiary.id);
    fps.forEach(fp => db.prepare('DELETE FROM feeding_plan_hives WHERE feeding_plan_id = ?').run(fp.id));
    db.prepare('DELETE FROM feeding_plans WHERE apiary_id = ?').run(apiary.id);

    db.prepare('DELETE FROM hives WHERE apiary_id = ?').run(apiary.id);
    db.prepare('DELETE FROM apiaries WHERE id = ?').run(apiary.id);
  });

  deleteAll();
  res.json({ message: 'Bletaria u fshi me sukses' });
});

// ─── HIVES ────────────────────────────────────────────────────────────────────

// GET /api/apiaries/:id/hives
app.get('/api/apiaries/:id/hives', authMiddleware, (req, res) => {
  const apiary = getOwnedApiary(req.params.id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });

  const hives = db.prepare('SELECT * FROM hives WHERE apiary_id = ? ORDER BY position_row, position_col').all(apiary.id);
  const hivesWithFloors = hives.map(h => ({
    ...h,
    floors: db.prepare('SELECT * FROM hive_floors WHERE hive_id = ? ORDER BY floor_number').all(h.id)
  }));
  res.json(hivesWithFloors);
});

// PUT /api/hives/:id
app.put('/api/hives/:id', authMiddleware, (req, res) => {
  const hive = getOwnedHive(req.params.id, req.user.id);
  if (!hive) return res.status(404).json({ error: 'Kosherjа nuk gjendet' });

  const { status, queen_present, queen_age_months, notes } = req.body;
  const allowed = ['good', 'problem', 'dead', 'weak', 'queenless', 'sick', 'empty', 'strong'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: 'Status i pavlefshëm' });
  }
  const qp = queen_present !== undefined ? (queen_present ? 1 : 0) : hive.queen_present;
  const qa = queen_age_months !== undefined ? (queen_age_months ? parseInt(queen_age_months) : null) : hive.queen_age_months;
  const nt = notes !== undefined ? notes : hive.notes;
  db.prepare('UPDATE hives SET status = ?, queen_present = ?, queen_age_months = ?, notes = ? WHERE id = ?')
    .run(status || hive.status, qp ?? 1, qa, nt, hive.id);
  const updated = db.prepare('SELECT * FROM hives WHERE id = ?').get(hive.id);
  res.json({ ...updated, code: updated.unique_code });
});

// DELETE /api/hives/:id
app.delete('/api/hives/:id', authMiddleware, (req, res) => {
  const hive = getOwnedHive(req.params.id, req.user.id);
  if (!hive) return res.status(404).json({ error: 'Kosherjа nuk gjendet' });
  db.prepare('DELETE FROM hive_floors WHERE hive_id = ?').run(hive.id);
  db.prepare('DELETE FROM hives WHERE id = ?').run(hive.id);
  res.json({ message: 'Kosherjа u fshi me sukses' });
});

// ─── HIVE FLOORS ──────────────────────────────────────────────────────────────

// POST /api/hives/:id/floors
app.post('/api/hives/:id/floors', authMiddleware, (req, res) => {
  const hive = getOwnedHive(req.params.id, req.user.id);
  if (!hive) return res.status(404).json({ error: 'Kosherjа nuk gjendet' });

  const maxFloor = db.prepare('SELECT MAX(floor_number) as max FROM hive_floors WHERE hive_id = ?').get(hive.id);
  const nextFloor = (maxFloor.max || 0) + 1;

  const { frames_bees = 0, frames_eggs = 0, frames_honey = 0, frames_new = 0 } = req.body;
  const result = db.prepare(
    'INSERT INTO hive_floors (hive_id, floor_number, frames_bees, frames_eggs, frames_honey, frames_new) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(hive.id, nextFloor, frames_bees, frames_eggs, frames_honey, frames_new);

  res.status(201).json(db.prepare('SELECT * FROM hive_floors WHERE id = ?').get(result.lastInsertRowid));
});

// DELETE /api/floors/:id
app.delete('/api/floors/:id', authMiddleware, (req, res) => {
  const floor = db.prepare(`
    SELECT hf.* FROM hive_floors hf
    JOIN hives h ON hf.hive_id = h.id
    JOIN apiaries a ON h.apiary_id = a.id
    WHERE hf.id = ? AND a.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!floor) return res.status(404).json({ error: 'Kati nuk gjendet' });

  const floorCount = db.prepare('SELECT COUNT(*) as c FROM hive_floors WHERE hive_id = ?').get(floor.hive_id);
  if (floorCount.c <= 1) {
    return res.status(400).json({ error: 'Kosherjа duhet të ketë të paktën një kat' });
  }

  db.prepare('DELETE FROM hive_floors WHERE id = ?').run(floor.id);
  res.json({ message: 'Kati u fshi me sukses' });
});

// ─── VISITS ───────────────────────────────────────────────────────────────────

// GET /api/apiaries/:id/visits
app.get('/api/apiaries/:id/visits', authMiddleware, (req, res) => {
  const apiary = getOwnedApiary(req.params.id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });

  const visits = db.prepare(`
    SELECT v.*,
      COUNT(hvd.id) as hives_visited
    FROM visits v
    LEFT JOIN hive_visit_data hvd ON hvd.visit_id = v.id
    WHERE v.apiary_id = ?
    GROUP BY v.id
    ORDER BY v.visit_date DESC, v.created_at DESC
  `).all(apiary.id);

  res.json(visits);
});

// POST /api/apiaries/:id/visits
app.post('/api/apiaries/:id/visits', authMiddleware, (req, res) => {
  const apiary = getOwnedApiary(req.params.id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });

  const { visit_date, notes, hive_data } = req.body;
  if (!visit_date) return res.status(400).json({ error: 'Data e vizitës është e detyrueshme' });

  const createVisit = db.transaction(() => {
    const visitResult = db.prepare(
      'INSERT INTO visits (apiary_id, visit_date, notes) VALUES (?, ?, ?)'
    ).run(apiary.id, visit_date, notes || null);
    const visitId = visitResult.lastInsertRowid;

    if (Array.isArray(hive_data)) {
      const insertHvd = db.prepare(`
        INSERT INTO hive_visit_data (visit_id, hive_id, queen_present, queen_age_months, status, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insertFloorVd = db.prepare(`
        INSERT INTO hive_floor_visit_data (hive_visit_data_id, floor_id, frames_bees, frames_eggs, frames_honey, frames_new)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const updateHiveStatus = db.prepare('UPDATE hives SET status = ? WHERE id = ?');

      hive_data.forEach(hd => {
        // Verify hive belongs to this apiary
        const hive = db.prepare('SELECT id FROM hives WHERE id = ? AND apiary_id = ?').get(hd.hive_id, apiary.id);
        if (!hive) return;

        const hvdResult = insertHvd.run(
          visitId,
          hd.hive_id,
          hd.queen_present !== undefined ? (hd.queen_present ? 1 : 0) : 1,
          hd.queen_age_months || null,
          hd.status || 'good',
          hd.notes || null
        );
        const hvdId = hvdResult.lastInsertRowid;

        // Update hive current status
        if (hd.status) {
          updateHiveStatus.run(hd.status, hd.hive_id);
        }

        if (Array.isArray(hd.floor_data)) {
          hd.floor_data.forEach(fd => {
            // Verify floor belongs to this hive
            const floor = db.prepare('SELECT id FROM hive_floors WHERE id = ? AND hive_id = ?').get(fd.floor_id, hd.hive_id);
            if (!floor) return;
            insertFloorVd.run(
              hvdId,
              fd.floor_id,
              fd.frames_bees !== undefined ? fd.frames_bees : null,
              fd.frames_eggs !== undefined ? fd.frames_eggs : null,
              fd.frames_honey !== undefined ? fd.frames_honey : null,
              fd.frames_new !== undefined ? fd.frames_new : null
            );
          });
        }
      });
    }

    return db.prepare('SELECT * FROM visits WHERE id = ?').get(visitId);
  });

  const visit = createVisit();
  res.status(201).json(visit);
});

// GET /api/visits/:id
app.get('/api/visits/:id', authMiddleware, (req, res) => {
  const visit = db.prepare(`
    SELECT v.* FROM visits v
    JOIN apiaries a ON v.apiary_id = a.id
    WHERE v.id = ? AND a.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!visit) return res.status(404).json({ error: 'Vizita nuk gjendet' });

  const hiveData = db.prepare('SELECT * FROM hive_visit_data WHERE visit_id = ?').all(visit.id);
  const enriched = hiveData.map(hvd => {
    const floorData = db.prepare('SELECT * FROM hive_floor_visit_data WHERE hive_visit_data_id = ?').all(hvd.id);
    const hive = db.prepare('SELECT id, unique_code, position_row, position_col, status FROM hives WHERE id = ?').get(hvd.hive_id);
    return { ...hvd, hive, floor_data: floorData };
  });

  res.json({ ...visit, hive_data: enriched });
});

// ─── FEEDING PLANS ────────────────────────────────────────────────────────────

// GET /api/apiaries/:id/feeding-plans
app.get('/api/apiaries/:id/feeding-plans', authMiddleware, (req, res) => {
  const apiary = getOwnedApiary(req.params.id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });

  const plans = db.prepare(`
    SELECT fp.*,
      COUNT(fph.id) as hive_count
    FROM feeding_plans fp
    LEFT JOIN feeding_plan_hives fph ON fph.feeding_plan_id = fp.id
    WHERE fp.apiary_id = ?
    GROUP BY fp.id
    ORDER BY fp.plan_date DESC
  `).all(apiary.id);

  res.json(plans);
});

// POST /api/apiaries/:id/feeding-plans
app.post('/api/apiaries/:id/feeding-plans', authMiddleware, (req, res) => {
  const apiary = getOwnedApiary(req.params.id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });

  const { plan_date, description, hive_plans } = req.body;
  if (!plan_date) return res.status(400).json({ error: 'Data e planit është e detyrueshme' });

  const createPlan = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO feeding_plans (apiary_id, plan_date, description) VALUES (?, ?, ?)'
    ).run(apiary.id, plan_date, description || null);
    const planId = result.lastInsertRowid;

    if (Array.isArray(hive_plans)) {
      const insertHp = db.prepare(
        'INSERT INTO feeding_plan_hives (feeding_plan_id, hive_id, food_amount, medicine, notes) VALUES (?, ?, ?, ?, ?)'
      );
      hive_plans.forEach(hp => {
        const hive = db.prepare('SELECT id FROM hives WHERE id = ? AND apiary_id = ?').get(hp.hive_id, apiary.id);
        if (!hive) return;
        insertHp.run(planId, hp.hive_id, hp.food_amount || null, hp.medicine || null, hp.notes || null);
      });
    }

    return db.prepare('SELECT * FROM feeding_plans WHERE id = ?').get(planId);
  });

  const plan = createPlan();
  res.status(201).json(plan);
});

// ─── COMMUNITY ────────────────────────────────────────────────────────────────

// GET /api/posts
app.get('/api/posts', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  // Try to get current user from token (optional auth)
  let currentUserId = null;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      currentUserId = payload.id;
    } catch (e) { /* ignore */ }
  }

  const total = db.prepare('SELECT COUNT(*) as c FROM community_posts').get().c;
  const posts = db.prepare(`
    SELECT p.id, p.content, p.image_url, p.likes, p.created_at,
      u.id as user_id, u.first_name, u.last_name, u.avatar,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM community_posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const enriched = posts.map(p => ({
    ...p,
    liked_by_me: currentUserId
      ? !!db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').get(p.id, currentUserId)
      : false
  }));

  res.json({
    posts: enriched,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// POST /api/posts
app.post('/api/posts', authMiddleware, (req, res) => {
  const { content, image_url } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Përmbajtja është e detyrueshme' });
  }
  const result = db.prepare(
    'INSERT INTO community_posts (user_id, content, image_url) VALUES (?, ?, ?)'
  ).run(req.user.id, content.trim(), image_url || null);

  const post = db.prepare(`
    SELECT p.*, u.first_name, u.last_name, u.avatar
    FROM community_posts p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(post);
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Postimi nuk gjendet' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Nuk mund ta fshish këtë postim' });

  db.prepare('DELETE FROM comments WHERE post_id = ?').run(post.id);
  db.prepare('DELETE FROM post_likes WHERE post_id = ?').run(post.id);
  db.prepare('DELETE FROM community_posts WHERE id = ?').run(post.id);
  res.json({ message: 'Postimi u fshi me sukses' });
});

// POST /api/posts/:id/comments
app.post('/api/posts/:id/comments', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT id FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Postimi nuk gjendet' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Komenti nuk mund të jetë bosh' });

  const result = db.prepare(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)'
  ).run(post.id, req.user.id, content.trim());

  const comment = db.prepare(`
    SELECT c.*, u.first_name, u.last_name, u.avatar
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(comment);
});

// GET /api/posts/:id/comments
app.get('/api/posts/:id/comments', (req, res) => {
  const post = db.prepare('SELECT id FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Postimi nuk gjendet' });

  const comments = db.prepare(`
    SELECT c.*, u.first_name, u.last_name, u.avatar
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(post.id);

  res.json(comments);
});

// POST /api/posts/:id/like
app.post('/api/posts/:id/like', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Postimi nuk gjendet' });

  const existing = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id);

  const toggleLike = db.transaction(() => {
    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(post.id, req.user.id);
      db.prepare('UPDATE community_posts SET likes = MAX(0, likes - 1) WHERE id = ?').run(post.id);
      return { liked: false };
    } else {
      db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(post.id, req.user.id);
      db.prepare('UPDATE community_posts SET likes = likes + 1 WHERE id = ?').run(post.id);
      return { liked: true };
    }
  });

  const result = toggleLike();
  const updated = db.prepare('SELECT likes FROM community_posts WHERE id = ?').get(post.id);
  res.json({ ...result, likes: updated.likes });
});

// ─── MARKETPLACE ──────────────────────────────────────────────────────────────

// GET /api/listings
app.get('/api/listings', (req, res) => {
  const { category, min_price, max_price, search } = req.query;

  let query = `
    SELECT ml.*, u.first_name, u.last_name
    FROM marketplace_listings ml
    JOIN users u ON ml.user_id = u.id
    WHERE (ml.expires_at IS NULL OR datetime(ml.expires_at) > datetime('now'))
  `;
  const params = [];

  if (category) {
    query += ' AND ml.category = ?';
    params.push(category);
  }
  if (min_price !== undefined && min_price !== '') {
    query += ' AND ml.price >= ?';
    params.push(parseFloat(min_price));
  }
  if (max_price !== undefined && max_price !== '') {
    query += ' AND ml.price <= ?';
    params.push(parseFloat(max_price));
  }
  if (search) {
    query += ' AND (ml.title LIKE ? OR ml.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY ml.created_at DESC';

  res.json(db.prepare(query).all(...params));
});

// POST /api/listings
app.post('/api/listings', authMiddleware, (req, res) => {
  const { title, description, price, category, image_url, contact } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Titulli është i detyrueshëm' });

  const setting = db.prepare("SELECT value FROM app_settings WHERE key = 'listing_expiry_days'").get();
  const expiryDays = parseInt(setting ? setting.value : '30');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  const result = db.prepare(
    'INSERT INTO marketplace_listings (user_id, title, description, price, category, image_url, contact, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    req.user.id,
    title.trim(),
    description || null,
    price !== undefined ? parseFloat(price) : null,
    category || null,
    image_url || null,
    contact || null,
    expiresAt.toISOString()
  );

  res.status(201).json(db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(result.lastInsertRowid));
});

// DELETE /api/listings/:id
app.delete('/api/listings/:id', authMiddleware, (req, res) => {
  const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listimi nuk gjendet' });
  if (listing.user_id !== req.user.id) return res.status(403).json({ error: 'Nuk mund ta fshish këtë listim' });

  db.prepare('DELETE FROM marketplace_listings WHERE id = ?').run(listing.id);
  res.json({ message: 'Listimi u fshi me sukses' });
});

// ─── NEWS ─────────────────────────────────────────────────────────────────────

// GET /api/news
app.get('/api/news', (req, res) => {
  const news = db.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT 10').all();
  res.json(news);
});

// GET /api/news/:id
app.get('/api/news/:id', (req, res) => {
  const article = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Lajmi nuk gjendet' });
  res.json(article);
});

// ─── AI RECOMMENDATIONS ───────────────────────────────────────────────────────

function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'Ti je asistent i specializuar në bletari. Jep këshilla të detajuara dhe praktike për bletarët. Përgjigjju në gjuhën shqipe.',
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.content && parsed.content[0]) {
            resolve(parsed.content[0].text);
          } else if (parsed.error) {
            reject(new Error(parsed.error.message));
          } else {
            reject(new Error('Përgjigje e papritur nga API'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getMockRecommendation(prompt) {
  const p = (prompt || '').toLowerCase();

  if (p.includes('varroa') || p.includes('parazit') || p.includes('acar')) {
    return `**Luftimi i Varroa destructor**

1. **Monitorimi i rregullt**: Metoda e rrëshqitjes alkoolike çdo muaj — mbi 3 acarë/100 bletë kërkon trajtim urgjent.

2. **Acid oksalik**: Metoda më efektive gjatë dimrit kur kolonia është pa pjellë. Avullim ose pikë 3-5% tretësirë.

3. **Acid formik (MAQS)**: Efektiv edhe nën pjellën e mbyllur — vendoset mbi kornizat për 7 ditë.

4. **Heqja e pjellës së dronëve**: Çdo 9-10 ditë hiqni kornizën "kurth" me pjellën e mbyllur të dronëve.

5. **Timol (ApiLife Var)**: Trajtim organik veror — efektiv mbi 15°C, 3-4 javë.

6. **Rrotullimi**: Alternoni barnat çdo sezon për të shmangur rezistencën.

⚠️ Trajtoni gjithmonë pas blerjes së mjaltit, kurrë gjatë sezonit aktiv të prodhimit.`;
  }

  if (p.includes('mbretëreshë') || p.includes('mbretereshe') || p.includes('mbreteresha') || p.includes('queen')) {
    return `**Menaxhimi i Mbretëreshës**

1. **Identifikimi**: Mbretëresha ka bark të zgjatur, lëvizje të ngadalta dhe bletët formojnë rreth saj. Shënohet me bojë sipas vitit (2025=e bardhë, 2026=e verdhë).

2. **Mosha optimale**: Zëvendëso çdo 1-2 vjet — feromon dhe pjelloría ulen pas vitit të dytë.

3. **Shenjat e problemeve**:
   - Pjellë e shpërndarë (mungesë vezësh)
   - Qeliza bosh midis pjellës
   - Bletë punëtore me vezë (orfaniteti)

4. **Ndërrimi natyral (supersedure)**: Bletët ndërtojnë qelizë mbretëreshe mbi kornizën aktive — mos ndërhyj.

5. **Ndërrimi artificial**: Bëje prill-gusht kur dronët janë prezent. Largo mbretëreshën e vjetër 24 orë para futjes së re.

6. **Futja e mbretëreshës**: Metoda e konfeksionit (kandisë) — vendos kafazin 2-3 ditë derisa bletët ta çlirojnë vetë.`;
  }

  if (p.includes('mjaltë') || p.includes('mjalt') || p.includes('prodhim') || p.includes('harvest') || p.includes('vendos')) {
    return `**Prodhimi dhe Vjelja e Mjaltit**

1. **Koha e duhur**: Blerto mjaltën kur kornizat janë të mbushura 80-90% dhe të mbyllura me kapak dylli.

2. **Testi i pjekurisë**: Ktheje kornizën horizontalisht — nëse mjalti nuk rrjedh, është pjekur (lagështia <20%).

3. **Ekstraktimi**: Pastroni ekstraktorin me ujë të nxehtë. Rrotulloni kornizat ngadalë fillimisht.

4. **Filtrimi**: Filtro me filtër 400-600 mikron për të hequr dylli dhe mbetjet.

5. **Kristalizimi**: Normal dhe i shëndetshëm — ngrohja e butë (max 40°C) e shpërndan sërish.

6. **Sasia mesatare**: Koshëre e fortë prodhon 20-40 kg/vit në klimë të favorshme. Lini gjithmonë 10-15 kg për dimër.

7. **Etiketimi**: Shënoni datën, lulen mbizotëruese dhe peshën. Ruajeni në vend të errët dhe të freskët.`;
  }

  if (p.includes('ushqim') || p.includes('ushqye') || p.includes('sheqer') || p.includes('sirop') || p.includes('kek')) {
    return `**Ushqimi i Bletëve**

1. **Sirop sheqeri (1:1)**: Ujë:sheqer barazi — për stimulim pranveror dhe plotësim rezervash. Jepni 0.5-1L çdo 3 ditë.

2. **Sirop i trashë (2:1)**: Dy pjesë sheqer : një ujë — për dimërim. Konsumohet ngadalë.

3. **Kek kandis (fondantë)**: Ideal për dimër — vendoset mbi kornizat. Bletët e konsumojnë ngadalë sipas nevojës.

4. **Polen zëvendësues**: Tortë proteinike (polleni artificial) stimulon rritjen kolonisë në pranverë.

5. **Koha e ushqimit**: Gjithmonë mbrëmjet — shmang grabitjen nga kolonitë fqinje.

6. **Sasi**: Koloni e mesme nevojitet 15-18 kg ushqim për dimërim të sigurt.

⚠️ Mos ushqeni me mjaltë nga burime të panjohura — rrezik nga sëmundja AFB.`;
  }

  if (p.includes('sëmundj') || p.includes('semundj') || p.includes('nosema') || p.includes('afb') || p.includes('efb') || p.includes('kalbëzim') || p.includes('kalbezim')) {
    return `**Sëmundjet Kryesore të Bletëve**

🦠 **Nosema** (Nosema apis/ceranae):
- Simptoma: diarre, bletë me bark të fryrë, ngordhje e hershme dimërore
- Trajtimi: Fumidil-B (nuk lejohet në BE) ose menaxhim i higjienës. Zëvendësimi i mjaltit me sirop të pastër.

🔴 **AFB (Kalbëzimi Amerikan)**:
- Simptoma: pjellë kafe, erë e keqe, nit testi (filli i tejzgjatur)
- **Lajmëro menjëherë autoritetin veterinar — sëmundje e detyrueshme për njoftim!**
- Djegja e koshereve të infektuar është e detyrueshme.

🟡 **EFB (Kalbëzimi Europian)**:
- Simptoma: larvë e verdhë-kafe jashtë pozicionit normal
- Trajtimi: oksitetraciklin + ndërrim mbretëreshe + forcim kolonie

🔵 **Sacbrood**:
- Larvë e vdekur si qeskë me lëng
- Nuk ka trajtim kimik — zëvendësoni mbretëreshën dhe forconi koloninë`;
  }

  if (p.includes('dimër') || p.includes('dimer') || p.includes('dimërim') || p.includes('dimëro') || p.includes('tetor') || p.includes('nëntor') || p.includes('dhjetor') || p.includes('janar') || p.includes('shkurt')) {
    return `**Dimërimi i Bletëve**

1. **Koha e përgatitjes**: Shtator-tetor — kontrollo rezervat dhe krijo grupe dimëruese.

2. **Rezervat minimale**: 15-18 kg ushqim (mjaltë+sirop 2:1) për çdo koloni.

3. **Forca e kolonisë**: Minimumi 5-6 korniza bletë të mbuluara. Kolo. e dobëta bashkoi!

4. **Trajtimi i Varroas**: Kryesore pas blerjes së mjaltit (gusht-shtator). Acid oksalik në dhjetor kur s'ka pjellë.

5. **Ventilimi**: Mos mbyllo plotësisht hyrjen — lagështia vret bletët, jo të ftohti!

6. **Mbrojtja**: Mbulesë nga reshjet dhe era. Mbaj hyrjen të hapur 5-8mm kundër migjeve.

7. **Kontrolli**: Mos hap koshëren nën 14°C. Koplejo vetëm duke ndëgjuar tingujt (zhurmë e rregullt = OK).

8. **Pranvera**: Kontroll i parë kur temperaturat arrijnë 12-14°C ditën.`;
  }

  if (p.includes('pranver') || p.includes('fillim') || p.includes('mars') || p.includes('prill') || p.includes('vizit') || p.includes('kontroll')) {
    return `**Menaxhimi i Pranverës dhe Vizitat**

🌸 **Vizita e parë (Mars-Prill)**:
- Bëje mbi 12°C — kontrollo prezencën e mbretëreshës dhe vezëve
- Hiq kornizat e vjetra, të kalbëzuara ose bosh
- Shto kek kandis nëse rezervat janë të ulëta

📋 **Çfarë të kontrollosh çdo vizitë**:
1. Mbretëresha — prezencë dhe pjellë e rregullt
2. Rezervat e ushqimit
3. Shenjat e Varroas (bletë me krahë të deformuar)
4. Hapësira e disponueshme (shto etazhe nëse nevojitet)
5. Qeliza mbretëreshe — sinjal i rojeve ose zëvendësimit

⏱️ **Frekuenca**: Çdo 7-10 ditë gjatë sezonit; çdo 14 ditë jashtë sezonit.

📝 **Shënimet**: Dëfto çdo vizitë me datë, forcën e kolonisë, mbretëreshën, ushqimin.`;
  }

  if (p.includes('koshër') || p.includes('kosher') || p.includes('langstroth') || p.includes('dadan') || p.includes('etazh') || p.includes('korniz')) {
    return `**Koshëret dhe Pajisjet**

🏠 **Llojet kryesore**:
- **Langstroth**: Standardi ndërkombëtar — 10 korniza, lehtë për menaxhim
- **Dadant-Blatt**: Kornizë më e madhe — për kolonitë e forta
- **Warre (vertikale)**: Natyrale, minimal ndërhyrje
- **Zaun/Log (tradicionale)**: Vështirë për menaxhim, por e natyrshme

📐 **Kur të shtoni etazhe**:
- Kur 7-8 korniza janë të mbushura
- Gjatë sezonit aktiv të nektarit
- Shtojeni etazhin nën etazhin ekzistues (Nadir) ose mbi (Super)

🔧 **Mirëmbajtja**:
- Ngjyrosni me bojë të bardhë ose të hapur jashtë (UV + lagështi)
- Pastroni me zjarr ose flakë çdo vit
- Zëvendësoni kornizat e vjetra mbi 3-4 vjet`;
  }

  if (p.includes('qumësht') || p.includes('qumesht') || p.includes('royal jelly') || p.includes('gelatin') || p.includes('laktë')) {
    return `**Qumështi i Bletës (Royal Jelly)**

🍶 **Çfarë është**:
Royal jelly (qumështi i mbretëreshës) prodhon nga bletët punëtore mosha 5-15 ditë. Përmban proteina, vitamina B, acid 10-HDA dhe substanca unike.

🏭 **Prodhimi**:
1. Nevojiten koloni të forta (12+ korniza) dhe mbretëreshë aktive
2. Metoda "grafting" — transferimi i larvave 12-18 orë nga qelizat punëtore
3. Vjelja bëhet çdo 72 orë (maksimum prodhim)
4. Ruhet menjëherë në -18°C ose me mjaltë (1:1)

📊 **Sasi**: 300-500g/vit për koloni të trajnuar mirë.

⚕️ **Vlerat shëndetësore**: Antioksidant, antibakterial, stimulim imunitar. Konsulto mjekun para përdorimit terapeutik.

💰 **Tregu**: 50-150 €/100g — produkt me vlerë të lartë tregtar.`;
  }

  if (p.includes('polino') || p.includes('polenim') || p.includes('pemë') || p.includes('lule') || p.includes('bimë')) {
    return `**Polenizimi dhe Roli i Bletëve**

🌸 **Rëndësia**:
80% e bimëve me lule varen nga polenizimi i bletëve — mollë, qershi, luledielli, tërfili, kastravec, etj.

📍 **Vendosja e bletarisë**:
- 1-2 km nga burimet kryesore të nektarit/polenit
- Evitoni zonat me pesticide
- Pranë ujit të pastër (max 300m)
- Jo nën rrezet direkte të diellit të mesditës (orientim JL-Jug)

🚜 **Polenizim i kontraktuar**:
- Fermerët paguajnë për koshere gjatë lulëzimit
- 1-2 koshere/hektar për pemë frutore
- Çmimi: 30-80 €/koshëre/sezon (varion nga rajoni)

🌻 **Kultura më tërheqëse**:
Lule dielli, lulendar, gëzof trëndafili, bari i mjaltit (Phacelia), tërfili i kuq, gëlqerja (lipa).`;
  }

  if (p.includes('hell') || p.includes('thumbim') || p.includes('pickim') || p.includes('alergi') || p.includes('mbrojtj') || p.includes('kostum') || p.includes('tymis')) {
    return `**Mbrojtja dhe Siguria**

🛡️ **Pajisjet e mbrojtjes**:
- Kombinezon i plotë ose xhaketë me kapelë — material i dendur, ngjyrë e hapur
- Doreza lëkuri ose gome — kompromis midis mbrojtjes dhe ndjenjës
- Çizme të larta ose tape rreth kyçeve

🔥 **Tymisi (tymuesi)**:
- Materialit: kore lisi, kumbull e thatë, karton i vjetër, shkopinj pambuku
- Tymos buzët e koshëres dhe sipër kornizave para hapjes
- Tymi imituon zjarrin — bletët konsumojnë mjaltë dhe bëhen më të qeta

⏰ **Koha optimale e vizitës**:
- Midisditë (10:00-14:00) kur bletët mbledhëse janë jashtë
- Ditë me diell dhe pa erë
- Evito mëngjeset, mbrëmjet, para stuhisë dhe pas vjedhjes

🏥 **Nëse pickon**:
- Hiq heshtazën me skraper (mos shtrydh me gishta)
- Ftoh me akull 10-15 min
- Antihistaminik oral nëse nevojitet
- ⚠️ Anafilaksia — kërkon epinefrinë dhe urgjencë mjekësore`;
  }

  // Generic but structured response with many topics
  return `**Asistenti i Bletarisë — Këshilla Gjenerale**

Pyetja juaj mund të lidhet me një nga temat e mëposhtme. Pyeteni më specifikisht:

🦠 **Sëmundje & Parazitë**: "Si trajtoj Varroan?", "Çfarë është Nosema?"
👑 **Mbretëresha**: "Kur ndërroj mbretëreshën?", "Si e identifikoj?"
🍯 **Prodhimi i mjaltit**: "Kur bleroj mjaltin?", "Si ekstraktoj?"
🌸 **Pranvera**: "Çfarë bëj në pranverë?", "Vizita e parë"
❄️ **Dimërimi**: "Si i dimëroj bletët?", "Sa ushqim duhet?"
🍶 **Qumësht blete**: "Si prodhoj royal jelly?"
🌿 **Ushqimi**: "Kur ushqej bletët?", "Çfarë sirop të bëj?"
🏠 **Koshëret**: "Cila koshëre është më e mirë?", "Kur shtoj etazh?"
🛡️ **Mbrojtja**: "Si të mos pickohesh?", "Si përdor tymisin?"

Shkruani pyetjen tuaj specifike dhe do të merrni këshilla të detajuara! 🐝`;
}

// POST /api/ai/recommend
app.post('/api/ai/recommend', authMiddleware, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Pyetja është e detyrueshme' });
  }

  const monthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // Check and increment usage atomically
  const checkAndIncrement = db.transaction(() => {
    const usage = db.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND month_year = ?').get(req.user.id, monthYear);
    const current = usage ? usage.count : 0;
    if (current >= AI_MONTHLY_LIMIT) {
      return null; // Over limit
    }
    db.prepare(`
      INSERT INTO ai_usage (user_id, month_year, count) VALUES (?, ?, 1)
      ON CONFLICT(user_id, month_year) DO UPDATE SET count = count + 1
    `).run(req.user.id, monthYear);
    return current + 1;
  });

  const newCount = checkAndIncrement();
  if (newCount === null) {
    return res.status(429).json({
      error: `Keni arritur limitin mujor prej ${AI_MONTHLY_LIMIT} kërkesave AI. Provo sërish muajin e ardhshëm.`,
      limit: AI_MONTHLY_LIMIT,
      used: AI_MONTHLY_LIMIT
    });
  }

  try {
    let recommendation;
    if (CLAUDE_API_KEY) {
      recommendation = await callClaudeAPI(prompt.trim());
    } else {
      recommendation = getMockRecommendation(prompt.trim());
    }
    res.json({
      recommendation,
      usage: { used: newCount, limit: AI_MONTHLY_LIMIT, remaining: AI_MONTHLY_LIMIT - newCount }
    });
  } catch (err) {
    console.error('AI API error:', err.message);
    // On API error, return mock and don't deduct the usage
    db.prepare(`
      INSERT INTO ai_usage (user_id, month_year, count) VALUES (?, ?, 0)
      ON CONFLICT(user_id, month_year) DO UPDATE SET count = MAX(0, count - 1)
    `).run(req.user.id, monthYear);

    const recommendation = getMockRecommendation(prompt.trim());
    res.json({
      recommendation,
      usage: { used: newCount - 1, limit: AI_MONTHLY_LIMIT, remaining: AI_MONTHLY_LIMIT - (newCount - 1) },
      note: 'Përgjigje lokale (API e jashtme nuk ishte e disponueshme)'
    });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username dhe fjalëkalimi janë të detyrueshëm' });

  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!admin) return res.status(401).json({ error: 'Kredencialet janë të gabuara' });

  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: 'Kredencialet janë të gabuara' });

  const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, admin: { id: admin.id, username: admin.username } });
});

// GET /api/admin/stats
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    active_users: db.prepare('SELECT COUNT(*) as c FROM users WHERE active = 1').get().c,
    total_posts: db.prepare('SELECT COUNT(*) as c FROM community_posts').get().c,
    total_apiaries: db.prepare('SELECT COUNT(*) as c FROM apiaries').get().c,
    total_hives: db.prepare('SELECT COUNT(*) as c FROM hives').get().c,
    total_listings: db.prepare('SELECT COUNT(*) as c FROM marketplace_listings').get().c,
    total_news: db.prepare('SELECT COUNT(*) as c FROM news').get().c,
    total_visits: db.prepare('SELECT COUNT(*) as c FROM visits').get().c
  };
  res.json(stats);
});

// GET /api/admin/users
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.active, u.created_at,
      COUNT(DISTINCT a.id) as apiary_count,
      COUNT(DISTINCT p.id) as post_count
    FROM users u
    LEFT JOIN apiaries a ON a.user_id = u.id
    LEFT JOIN community_posts p ON p.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  res.json(users);
});

// PATCH /api/admin/users/:id/toggle
app.patch('/api/admin/users/:id/toggle', adminMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, active FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk gjendet' });

  const newActive = user.active ? 0 : 1;
  db.prepare('UPDATE users SET active = ? WHERE id = ?').run(newActive, user.id);
  res.json({ id: user.id, active: newActive });
});

// GET /api/admin/listings
app.get('/api/admin/listings', adminMiddleware, (req, res) => {
  const listings = db.prepare(`
    SELECT ml.*, u.first_name, u.last_name, u.email
    FROM marketplace_listings ml
    JOIN users u ON ml.user_id = u.id
    ORDER BY ml.created_at DESC
  `).all();
  res.json(listings);
});

// DELETE /api/admin/listings/:id
app.delete('/api/admin/listings/:id', adminMiddleware, (req, res) => {
  const listing = db.prepare('SELECT id FROM marketplace_listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listimi nuk gjendet' });
  db.prepare('DELETE FROM marketplace_listings WHERE id = ?').run(listing.id);
  res.json({ message: 'Listimi u fshi me sukses' });
});

// GET /api/admin/news
app.get('/api/admin/news', adminMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM news ORDER BY created_at DESC').all());
});

// POST /api/admin/news
app.post('/api/admin/news', adminMiddleware, (req, res) => {
  const { title, content, image_url } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Titulli dhe përmbajtja janë të detyrueshme' });

  const result = db.prepare(
    'INSERT INTO news (title, content, image_url, admin_id) VALUES (?, ?, ?, ?)'
  ).run(title.trim(), content.trim(), image_url || null, req.admin.id);

  res.status(201).json(db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/admin/news/:id
app.put('/api/admin/news/:id', adminMiddleware, (req, res) => {
  const article = db.prepare('SELECT id FROM news WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Lajmi nuk gjendet' });

  const { title, content, image_url } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Titulli dhe përmbajtja janë të detyrueshme' });

  db.prepare('UPDATE news SET title = ?, content = ?, image_url = ? WHERE id = ?')
    .run(title.trim(), content.trim(), image_url || null, article.id);

  res.json(db.prepare('SELECT * FROM news WHERE id = ?').get(article.id));
});

// DELETE /api/admin/news/:id
app.delete('/api/admin/news/:id', adminMiddleware, (req, res) => {
  const article = db.prepare('SELECT id FROM news WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Lajmi nuk gjendet' });
  db.prepare('DELETE FROM news WHERE id = ?').run(article.id);
  res.json({ message: 'Lajmi u fshi me sukses' });
});

// GET /api/admin/settings
app.get('/api/admin/settings', adminMiddleware, (req, res) => {
  const settings = db.prepare('SELECT * FROM app_settings').all();
  const result = {};
  settings.forEach(s => { result[s.key] = s.value; });
  res.json(result);
});

// PUT /api/admin/settings
app.put('/api/admin/settings', adminMiddleware, (req, res) => {
  const { listing_expiry_days } = req.body;

  if (listing_expiry_days !== undefined) {
    const days = parseInt(listing_expiry_days);
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({ error: 'listing_expiry_days duhet të jetë ndërmjet 1 dhe 365' });
    }
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('listing_expiry_days', ?)").run(String(days));
  }

  const settings = db.prepare('SELECT * FROM app_settings').all();
  const result = {};
  settings.forEach(s => { result[s.key] = s.value; });
  res.json(result);
});


// ─── ALIAS & MISSING ROUTES ───────────────────────────────────────────────────

// Admin auth alias
app.post('/api/admin/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Kërkohen kredencialet' });
  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Kredencialet janë të gabuara' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, admin: { id: admin.id, username: admin.username } });
});

app.get('/api/admin/auth/me', adminMiddleware, (req, res) => {
  res.json({ admin: req.admin });
});

// Admin marketplace aliases
app.get('/api/admin/marketplace', adminMiddleware, (req, res) => {
  const listings = db.prepare(`
    SELECT ml.*, u.first_name, u.last_name, u.email
    FROM marketplace_listings ml JOIN users u ON ml.user_id = u.id
    ORDER BY ml.created_at DESC
  `).all();
  res.json(listings);
});
app.patch('/api/admin/marketplace/:id/toggle', adminMiddleware, (req, res) => {
  const l = db.prepare('SELECT id FROM marketplace_listings WHERE id = ?').get(req.params.id);
  if (!l) return res.status(404).json({ error: 'Nuk gjendet' });
  res.json({ message: 'OK' });
});
app.delete('/api/admin/marketplace/:id', adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM marketplace_listings WHERE id = ?').run(req.params.id);
  res.json({ message: 'U fshi' });
});

// Profile routes
app.get('/api/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, first_name, last_name, email, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Nuk gjendet' });
  res.json({ user });
});
app.put('/api/profile', authMiddleware, (req, res) => {
  const { first_name, last_name, email, location, experience } = req.body;
  const fn = first_name || req.body.name?.split(' ')[0];
  const ln = last_name || req.body.name?.split(' ').slice(1).join(' ') || fn;
  if (!fn || !email) return res.status(400).json({ error: 'Emri dhe email janë të detyrueshëm' });
  db.prepare('UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?')
    .run(fn.trim(), ln.trim(), email.toLowerCase().trim(), req.user.id);
  const updated = db.prepare('SELECT id, first_name, last_name, email, role, avatar FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: updated });
});
app.post('/api/profile/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nuk u ngarkua asnjë skedar' });
  const url = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(url, req.user.id);
  res.json({ url, user: db.prepare('SELECT id, first_name, last_name, email, role, avatar FROM users WHERE id = ?').get(req.user.id) });
});
app.get('/api/profile/stats', authMiddleware, (req, res) => {
  const uid = req.user.id;
  res.json({
    apiaries: db.prepare('SELECT COUNT(*) as c FROM apiaries WHERE user_id = ?').get(uid).c,
    hives: db.prepare('SELECT COUNT(*) as c FROM hives h JOIN apiaries a ON h.apiary_id = a.id WHERE a.user_id = ?').get(uid).c,
    visits: db.prepare('SELECT COUNT(*) as c FROM visits v JOIN apiaries a ON v.apiary_id = a.id WHERE a.user_id = ?').get(uid).c,
    posts: db.prepare('SELECT COUNT(*) as c FROM community_posts WHERE user_id = ?').get(uid).c,
  });
});

// Hives alias routes
app.get('/api/hives', authMiddleware, (req, res) => {
  const { apiary_id } = req.query;
  if (!apiary_id) return res.status(400).json({ error: 'apiary_id kërkohet' });
  const apiary = getOwnedApiary(apiary_id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });
  const hives = db.prepare('SELECT h.*, COALESCE(h.queen_present, 1) as queen_present, h.queen_age_months, h.notes FROM hives h WHERE h.apiary_id = ? ORDER BY h.position_row, h.position_col').all(apiary_id);
  const hivesWithFloors = hives.map(h => ({ ...h, floors: db.prepare('SELECT * FROM hive_floors WHERE hive_id = ? ORDER BY floor_number').all(h.id), code: h.unique_code }));
  res.json(hivesWithFloors);
});
app.get('/api/hives/:id', authMiddleware, (req, res) => {
  const hive = db.prepare('SELECT h.* FROM hives h JOIN apiaries a ON h.apiary_id = a.id WHERE h.id = ? AND a.user_id = ?').get(req.params.id, req.user.id);
  if (!hive) return res.status(404).json({ error: 'Kosheria nuk gjendet' });
  const floors = db.prepare('SELECT * FROM hive_floors WHERE hive_id = ? ORDER BY floor_number').all(hive.id);
  const lastVisit = db.prepare('SELECT hvd.* FROM hive_visit_data hvd JOIN visits v ON hvd.visit_id = v.id WHERE hvd.hive_id = ? ORDER BY v.visit_date DESC LIMIT 1').get(hive.id);
  res.json({ ...hive, code: hive.unique_code, floors, queen_present: lastVisit?.queen_present ?? 1, queen_age_months: lastVisit?.queen_age_months });
});
app.get('/api/hives/:id/floors', authMiddleware, (req, res) => {
  const floors = db.prepare('SELECT * FROM hive_floors WHERE hive_id = ? ORDER BY floor_number').all(req.params.id);
  res.json(floors);
});
app.put('/api/hives/:hiveId/floors/:floorId', authMiddleware, (req, res) => {
  const { frames_bees, frames_eggs, frames_honey, frames_new } = req.body;
  db.prepare('UPDATE hive_floors SET frames_bees = ?, frames_eggs = ?, frames_honey = ?, frames_new = ? WHERE id = ? AND hive_id = ?')
    .run(frames_bees ?? 0, frames_eggs ?? 0, frames_honey ?? 0, frames_new ?? 0, req.params.floorId, req.params.hiveId);
  res.json(db.prepare('SELECT * FROM hive_floors WHERE id = ?').get(req.params.floorId));
});

// DELETE floor with new path alias
app.delete('/api/hives/:hiveId/floors/:floorId', authMiddleware, (req, res) => {
  const floor = db.prepare('SELECT hf.* FROM hive_floors hf JOIN hives h ON hf.hive_id = h.id JOIN apiaries a ON h.apiary_id = a.id WHERE hf.id = ? AND a.user_id = ?').get(req.params.floorId, req.user.id);
  if (!floor) return res.status(404).json({ error: 'Kati nuk gjendet' });
  const cnt = db.prepare('SELECT COUNT(*) as c FROM hive_floors WHERE hive_id = ?').get(floor.hive_id);
  if (cnt.c <= 1) return res.status(400).json({ error: 'Kosherjа duhet të ketë të paktën një kat' });
  db.prepare('DELETE FROM hive_floors WHERE id = ?').run(floor.id);
  res.json({ message: 'Kati u fshi' });
});
app.get('/api/hives/:id/visits', authMiddleware, (req, res) => {
  const visits = db.prepare('SELECT v.*, hvd.queen_present, hvd.queen_age_months, hvd.status, hvd.notes as hive_notes FROM visits v LEFT JOIN hive_visit_data hvd ON hvd.visit_id = v.id AND hvd.hive_id = ? WHERE v.apiary_id IN (SELECT apiary_id FROM hives WHERE id = ?) ORDER BY v.visit_date DESC LIMIT 20').all(req.params.id, req.params.id);
  res.json(visits);
});

// Visits alias routes
app.get('/api/visits', authMiddleware, (req, res) => {
  const { apiary_id } = req.query;
  if (!apiary_id) return res.status(400).json({ error: 'apiary_id kërkohet' });
  const apiary = getOwnedApiary(apiary_id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });
  const visits = db.prepare('SELECT * FROM visits WHERE apiary_id = ? ORDER BY visit_date DESC').all(apiary_id);
  res.json(visits);
});
app.post('/api/visits', authMiddleware, (req, res) => {
  const { apiary_id, visit_date, notes, hive_data } = req.body;
  if (!apiary_id || !visit_date) return res.status(400).json({ error: 'apiary_id dhe visit_date kërkohen' });
  const apiary = getOwnedApiary(apiary_id, req.user.id);
  if (!apiary) return res.status(404).json({ error: 'Bletaria nuk gjendet' });
  
  const createVisit = db.transaction(() => {
    const result = db.prepare('INSERT INTO visits (apiary_id, visit_date, notes) VALUES (?, ?, ?)').run(apiary_id, visit_date, notes || null);
    const visitId = result.lastInsertRowid;
    if (hive_data && Array.isArray(hive_data)) {
      hive_data.forEach(hd => {
        const hvd = db.prepare('INSERT INTO hive_visit_data (visit_id, hive_id, queen_present, queen_age_months, status, notes) VALUES (?, ?, ?, ?, ?, ?)').run(visitId, hd.hive_id, hd.queen_present ?? 1, hd.queen_age_months || null, hd.status || 'good', hd.notes || null);
        if (hd.status) db.prepare('UPDATE hives SET status = ? WHERE id = ?').run(hd.status, hd.hive_id);
        if (hd.floors && Array.isArray(hd.floors)) {
          hd.floors.forEach(f => {
            db.prepare('INSERT INTO hive_floor_visit_data (hive_visit_data_id, floor_id, frames_bees, frames_eggs, frames_honey, frames_new) VALUES (?, ?, ?, ?, ?, ?)').run(hvd.lastInsertRowid, f.floor_id, f.frames_bees ?? 0, f.frames_eggs ?? 0, f.frames_honey ?? 0, f.frames_new ?? 0);
          });
        }
      });
    }
    return db.prepare('SELECT * FROM visits WHERE id = ?').get(visitId);
  });
  res.status(201).json(createVisit());
});
app.put('/api/visits/:id', authMiddleware, (req, res) => {
  const { notes, visit_date } = req.body;
  db.prepare('UPDATE visits SET notes = ?, visit_date = ? WHERE id = ?').run(notes || null, visit_date, req.params.id);
  res.json(db.prepare('SELECT * FROM visits WHERE id = ?').get(req.params.id));
});
app.delete('/api/visits/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM visits WHERE id = ?').run(req.params.id);
  res.json({ message: 'U fshi' });
});

// Feeding alias routes
app.get('/api/feeding', authMiddleware, (req, res) => {
  const { apiary_id } = req.query;
  if (!apiary_id) return res.status(400).json({ error: 'apiary_id kërkohet' });
  const plans = db.prepare('SELECT fp.*, COUNT(fph.id) as hive_count FROM feeding_plans fp LEFT JOIN feeding_plan_hives fph ON fph.feeding_plan_id = fp.id WHERE fp.apiary_id = ? GROUP BY fp.id ORDER BY fp.plan_date DESC').all(apiary_id);
  res.json(plans);
});
app.get('/api/feeding/:id', authMiddleware, (req, res) => {
  const plan = db.prepare('SELECT * FROM feeding_plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Plani nuk gjendet' });
  const hives = db.prepare('SELECT fph.*, h.unique_code as hive_code FROM feeding_plan_hives fph JOIN hives h ON fph.hive_id = h.id WHERE fph.feeding_plan_id = ?').all(plan.id);
  res.json({ ...plan, hives });
});
app.post('/api/feeding', authMiddleware, (req, res) => {
  const { apiary_id, plan_date, description, hives } = req.body;
  if (!apiary_id || !plan_date) return res.status(400).json({ error: 'apiary_id dhe plan_date kërkohen' });
  const result = db.prepare('INSERT INTO feeding_plans (apiary_id, plan_date, description) VALUES (?, ?, ?)').run(apiary_id, plan_date, description || null);
  const planId = result.lastInsertRowid;
  if (hives && Array.isArray(hives)) {
    hives.forEach(h => db.prepare('INSERT INTO feeding_plan_hives (feeding_plan_id, hive_id, food_amount, medicine, notes) VALUES (?, ?, ?, ?, ?)').run(planId, h.hive_id, h.food_amount || null, h.medicine || null, h.notes || null));
  }
  res.status(201).json(db.prepare('SELECT * FROM feeding_plans WHERE id = ?').get(planId));
});
app.put('/api/feeding/:id', authMiddleware, (req, res) => {
  const { plan_date, description } = req.body;
  db.prepare('UPDATE feeding_plans SET plan_date = ?, description = ? WHERE id = ?').run(plan_date, description || null, req.params.id);
  res.json(db.prepare('SELECT * FROM feeding_plans WHERE id = ?').get(req.params.id));
});
app.delete('/api/feeding/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM feeding_plans WHERE id = ?').run(req.params.id);
  res.json({ message: 'U fshi' });
});

// Community alias routes
app.get('/api/community/posts', (req, res) => {
  const { page = 1 } = req.query;
  const limit = 10, offset = (page - 1) * limit;
  const raw = db.prepare(`
    SELECT p.*, u.first_name, u.last_name, u.avatar,
      COUNT(DISTINCT c.id) as comment_count
    FROM community_posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN comments c ON c.post_id = p.id
    GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as c FROM community_posts').get().c;
  const posts = raw.map(p => ({
    id: p.id,
    content: p.content,
    image: p.image_url,
    date: p.created_at,
    likes: p.likes || 0,
    liked: false,
    comment_count: p.comment_count || 0,
    author: {
      name: `${p.first_name} ${p.last_name}`.trim(),
      avatar: p.avatar || (p.first_name ? p.first_name.charAt(0).toUpperCase() : '?'),
    }
  }));
  res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});
app.get('/api/community/posts/:id', (req, res) => {
  const p = db.prepare('SELECT p.*, u.first_name, u.last_name, u.avatar FROM community_posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Postimi nuk gjendet' });
  res.json({ id: p.id, content: p.content, image: p.image_url, date: p.created_at, likes: p.likes || 0, liked: false, comment_count: 0, author: { name: `${p.first_name} ${p.last_name}`.trim(), avatar: p.avatar || (p.first_name ? p.first_name.charAt(0).toUpperCase() : '?') } });
});
app.post('/api/community/posts', authMiddleware, upload.single('image'), (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Përmbajtja kërkohet' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare('INSERT INTO community_posts (user_id, content, image_url) VALUES (?, ?, ?)').run(req.user.id, content.trim(), image_url);
  const post = db.prepare('SELECT p.*, u.first_name, u.last_name, u.avatar FROM community_posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?').get(result.lastInsertRowid);
  res.status(201).json(post);
});
app.delete('/api/community/posts/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Postimi nuk gjendet' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Pa leje' });
  db.prepare('DELETE FROM community_posts WHERE id = ?').run(post.id);
  res.json({ message: 'U fshi' });
});
app.post('/api/community/posts/:id/like', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Postimi nuk gjendet' });
  const existing = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id);
  if (existing) {
    db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(post.id, req.user.id);
    db.prepare('UPDATE community_posts SET likes = MAX(0, likes - 1) WHERE id = ?').run(post.id);
    res.json({ liked: false, likes: db.prepare('SELECT likes FROM community_posts WHERE id = ?').get(post.id).likes });
  } else {
    db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(post.id, req.user.id);
    db.prepare('UPDATE community_posts SET likes = likes + 1 WHERE id = ?').run(post.id);
    res.json({ liked: true, likes: db.prepare('SELECT likes FROM community_posts WHERE id = ?').get(post.id).likes });
  }
});
app.get('/api/community/posts/:id/comments', (req, res) => {
  const raw = db.prepare('SELECT c.*, u.first_name, u.last_name, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC').all(req.params.id);
  const comments = raw.map(c => ({ id: c.id, content: c.content, date: c.created_at, author: { name: `${c.first_name} ${c.last_name}`.trim(), avatar: c.avatar || (c.first_name ? c.first_name.charAt(0).toUpperCase() : '?') } }));
  res.json({ comments });
});
app.post('/api/community/posts/:id/comments', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Përmbajtja kërkohet' });
  const result = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').run(req.params.id, req.user.id, content.trim());
  const c = db.prepare('SELECT c.*, u.first_name, u.last_name, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(result.lastInsertRowid);
  res.status(201).json({ comment: { id: c.id, content: c.content, date: c.created_at, author: { name: `${c.first_name} ${c.last_name}`.trim(), avatar: c.avatar || (c.first_name ? c.first_name.charAt(0).toUpperCase() : '?') } } });
});
app.delete('/api/community/posts/:postId/comments/:commentId', authMiddleware, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND post_id = ?').get(req.params.commentId, req.params.postId);
  if (!comment) return res.status(404).json({ error: 'Komenti nuk gjendet' });
  if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Pa leje' });
  db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
  res.json({ message: 'U fshi' });
});

// Marketplace alias routes
app.get('/api/marketplace', (req, res) => {
  const { category, min_price, max_price, search, page = 1 } = req.query;
  let where = "WHERE ml.expires_at > datetime('now')";
  const params = [];
  if (category) { where += ' AND ml.category = ?'; params.push(category); }
  if (min_price) { where += ' AND ml.price >= ?'; params.push(min_price); }
  if (max_price) { where += ' AND ml.price <= ?'; params.push(max_price); }
  if (search) { where += ' AND (ml.title LIKE ? OR ml.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  const limit = 20, offset = (page - 1) * limit;
  const raw = db.prepare(`SELECT ml.*, u.first_name, u.last_name FROM marketplace_listings ml JOIN users u ON ml.user_id = u.id ${where} ORDER BY ml.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM marketplace_listings ml ${where}`).get(...params).c;
  const listings = raw.map(l => ({ id: l.id, title: l.title, price: l.price, category: l.category, description: l.description, contact_phone: l.contact, image: l.image_url, date: l.created_at, seller: { name: `${l.first_name} ${l.last_name}`.trim() } }));
  res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});
app.get('/api/marketplace/:id', (req, res) => {
  const l = db.prepare('SELECT ml.*, u.first_name, u.last_name FROM marketplace_listings ml JOIN users u ON ml.user_id = u.id WHERE ml.id = ?').get(req.params.id);
  if (!l) return res.status(404).json({ error: 'Listimi nuk gjendet' });
  res.json({ id: l.id, title: l.title, price: l.price, category: l.category, description: l.description, contact_phone: l.contact, image: l.image_url, date: l.created_at, seller: { name: `${l.first_name} ${l.last_name}`.trim() } });
});
app.post('/api/marketplace', authMiddleware, upload.single('image'), (req, res) => {
  const { title, description, price, category, contact, contact_phone } = req.body;
  if (!title) return res.status(400).json({ error: 'Titulli kërkohet' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const expiry_days = (() => { try { return db.prepare("SELECT value FROM app_settings WHERE key = 'listing_expiry_days'").get()?.value || 30; } catch { return 30; } })();
  const expires_at = new Date(Date.now() + expiry_days * 24 * 3600 * 1000).toISOString();
  const contactVal = contact_phone || contact || null;
  const result = db.prepare('INSERT INTO marketplace_listings (user_id, title, description, price, category, image_url, contact, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(req.user.id, title.trim(), description || null, price ? parseFloat(price) : null, category || null, image_url, contactVal, expires_at);
  res.status(201).json(db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(result.lastInsertRowid));
});
app.put('/api/marketplace/:id', authMiddleware, (req, res) => {
  const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!listing) return res.status(404).json({ error: 'Listimi nuk gjendet' });
  const { title, description, price, category, contact } = req.body;
  db.prepare('UPDATE marketplace_listings SET title = ?, description = ?, price = ?, category = ?, contact = ? WHERE id = ?').run(title || listing.title, description || null, price ? parseFloat(price) : null, category || null, contact || null, listing.id);
  res.json(db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(listing.id));
});
app.delete('/api/marketplace/:id', authMiddleware, (req, res) => {
  const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!listing) return res.status(404).json({ error: 'Listimi nuk gjendet' });
  db.prepare('DELETE FROM marketplace_listings WHERE id = ?').run(listing.id);
  res.json({ message: 'U fshi' });
});
app.post('/api/marketplace/:id/contact', authMiddleware, (req, res) => {
  const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listimi nuk gjendet' });
  res.json({ contact: listing.contact, message: 'Kontakto shitësin direkt.' });
});

// AI chat alias
app.post('/api/ai/chat', authMiddleware, async (req, res) => {
  const prompt = (req.body.message || req.body.description || req.body.prompt || '').trim();
  if (!prompt) return res.status(400).json({ error: 'Mesazhi kërkohet' });

  const monthYear = new Date().toISOString().slice(0, 7);
  const checkAndIncrement = db.transaction(() => {
    const usage = db.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND month_year = ?').get(req.user.id, monthYear);
    const current = usage ? usage.count : 0;
    if (current >= AI_MONTHLY_LIMIT) return null;
    db.prepare(`INSERT INTO ai_usage (user_id, month_year, count) VALUES (?, ?, 1) ON CONFLICT(user_id, month_year) DO UPDATE SET count = count + 1`).run(req.user.id, monthYear);
    return current + 1;
  });

  const newCount = checkAndIncrement();
  if (newCount === null) {
    return res.status(429).json({ error: `Keni arritur limitin mujor prej ${AI_MONTHLY_LIMIT} kërkesave AI.`, limit: AI_MONTHLY_LIMIT, used: AI_MONTHLY_LIMIT });
  }

  try {
    const response = CLAUDE_API_KEY ? await callClaudeAPI(prompt) : getMockRecommendation(prompt);
    res.json({ response, usage: { used: newCount, limit: AI_MONTHLY_LIMIT, remaining: AI_MONTHLY_LIMIT - newCount } });
  } catch (err) {
    db.prepare(`INSERT INTO ai_usage (user_id, month_year, count) VALUES (?, ?, 0) ON CONFLICT(user_id, month_year) DO UPDATE SET count = MAX(0, count - 1)`).run(req.user.id, monthYear);
    const response = getMockRecommendation(prompt);
    res.json({ response, usage: { used: newCount - 1, limit: AI_MONTHLY_LIMIT, remaining: AI_MONTHLY_LIMIT - (newCount - 1) } });
  }
});
app.get('/api/ai/usage', authMiddleware, (req, res) => {
  const monthYear = new Date().toISOString().substring(0, 7);
  const usage = db.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND month_year = ?').get(req.user.id, monthYear);
  res.json({ count: usage?.count || 0, limit: AI_MONTHLY_LIMIT, remaining: Math.max(0, AI_MONTHLY_LIMIT - (usage?.count || 0)) });
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Bletaria Ime', time: new Date().toISOString() });
});

// ─── 404 + Error Handler ──────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Rruga nuk ekziston' });
});

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Skedari është shumë i madh (max 2MB)' });
  }
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Gabim i brendshëm i serverit' });
});

// ─── Seed sample data ─────────────────────────────────────────────────────────

function seedSampleData() {
  // Only seed if there's a user and not enough posts/listings
  const users = db.prepare('SELECT id, first_name, last_name FROM users LIMIT 1').all();
  if (!users.length) return;
  const uid = users[0].id;

  const postCount = db.prepare('SELECT COUNT(*) as c FROM community_posts').get().c;
  if (postCount < 3) {
    const samplePosts = [
      'Sot bëra vizitën e parë të pranverës! 15 nga 18 koshere me mbretëreshë aktive. Sezoni po fillon shumë mirë! 🐝🍯',
      'Pyetje për komunitetin: kur filloni trajtimin e Varroas këtë vit? Unë planifikoj pas blerjes së mjaltës së parë, rreth gusht-shtator.',
      'Korrën e parë të mjaltit: 40 kg nga 8 koshere! Luleshtrydhe dhe limon — aroma e jashtëzakonshme. Viti 2026 po fillon mirë! 🍯',
      'Mbretëresha e njërës koshëre nuk gjendet — shenjat tregojnë orfaniteti. A ka ndonjë sugjerim se si ta zgjidhë situatën shpejt?',
      'Ndava bletarinë nga 8 koshere në 12 duke bërë ndarje artificiale. Procedura shkoi mirë — koshevet e reja po reagojnë mirë! 💪',
    ];
    for (const content of samplePosts.slice(postCount)) {
      db.prepare('INSERT INTO community_posts (user_id, content) VALUES (?, ?)').run(uid, content);
    }
  }

  const listCount = db.prepare("SELECT COUNT(*) as c FROM marketplace_listings WHERE expires_at > datetime('now')").get().c;
  if (listCount < 3) {
    const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const sampleListings = [
      { title: 'Mjaltë Luleshtrydhe Organik 500g', price: 8.5, category: 'mjaltë', desc: 'Mjaltë i pastër organik nga lisat e kodrave. Kavanoz qelqi 500g. I çertifikuar BIO.', contact: '+383 44 123 456' },
      { title: 'Koshëre Langstroth 10 Korniza', price: 45, category: 'koshere', desc: 'Koshëre e re, e papërdorur. Dru pishe e trajtuar. Kompletë me korniza dhe nënshkronjë.', contact: '+355 69 234 567' },
      { title: 'Api-Life Var — Trajtim Varroa', price: 12, category: 'ilaçe', desc: 'Api-Life Var 100g, 2 copë. Produkt organik me timol dhe kamfor kundër Varroa destructor.', contact: '+383 45 345 678' },
      { title: 'Mbretëresha Carniolan e Re', price: 18, category: 'mbretëresha', desc: 'Mbretëresha e re rraca Carniolan, e mbushur dhe e testuar. Shumë e qetë dhe produktive.', contact: '+355 67 456 789' },
      { title: 'Qumësht Bletësh (Royal Jelly) 50g', price: 35, category: 'qumësht bletësh', desc: 'Royal jelly i freskët, i ngrirë menjëherë pas vjeljes. I pastër, pa konservantë.', contact: '+383 44 567 890' },
      { title: 'Ekstraktor Mjalti 3 Kat — Çelik Inox', price: 280, category: 'pajisje', desc: 'Ekstraktor manual prej çeliku inox, 3 katesh. Kapacitet 30kg mjaltë. Gjendje shumë e mirë.', contact: '+355 68 678 901' },
    ];
    for (const l of sampleListings.slice(listCount)) {
      db.prepare('INSERT INTO marketplace_listings (user_id, title, description, price, category, contact, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(uid, l.title, l.desc, l.price, l.category, l.contact, expires);
    }
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Bletaria Ime backend running on port ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Uploads: ${UPLOADS_DIR}`);
  console.log(`Claude AI: ${CLAUDE_API_KEY ? 'Enabled' : 'Mock mode'}`);
  try { seedSampleData(); } catch (e) { console.log('Seed skipped:', e.message); }
});
