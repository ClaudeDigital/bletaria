'use strict';
// Të dhëna demo: 3 bletarë me 1, 2 dhe 6 kopshte nëpër Kosovë.
// Idempotent: fshin vetëm llogaritë @DEMO_EMAIL_DOMAIN (dhe kopshtet e adminit) e i rikrijon.
// Përdorimi: node scripts/seed-demo.js
require('dotenv').config();
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.SEED_DB_PATH || '/opt/bletaria/data/bletaria.db';
const DOMAIN = process.env.DEMO_EMAIL_DOMAIN || 'demo.bletaria.app';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@bletaria.com').toLowerCase();
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

let seed = 20261016;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const day = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const ts = n => `${day(n)} ${String(int(7, 19)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}:00`;

const BEEKEEPERS = [
  { first: 'Arben', last: 'Krasniqi', email: 'arben.krasniqi', joined: 150, apiaries: [
    { name: 'Bletaria te Lumi', location: 'Lubizhdë, Prizren', rows: [5, 3], notes: 'Pranë lumit, afër pemëve të gështenjës.' },
  ]},
  { first: 'Mimoza', last: 'Berisha', email: 'mimoza.berisha', joined: 95, apiaries: [
    { name: 'Kopshti i Rugovës', location: 'Rugovë, Pejë', rows: [8, 8, 8], notes: 'Kullotë malore, mjaltë bjeshke.' },
    { name: 'Bletët e Oborrit', location: 'Vitomiricë, Pejë', rows: [5, 4], notes: 'Te shtëpia, për dimërim.' },
  ]},
  { first: 'Fatmir', last: 'Gashi', email: 'fatmir.gashi', joined: 40, apiaries: [
    { name: 'Bletaria Qendrore', location: 'Komoran, Drenas', rows: [10, 10, 10, 10], notes: 'Kopshti kryesor, ekstraktimi bëhet këtu.' },
    { name: 'Kopshti Malor', location: 'Brod, Dragash', rows: [10, 10, 10], notes: 'Lëvizet në qershor për lulet e malit.' },
    { name: 'Kodra e Bletëve', location: 'Gërmia, Prishtinë', rows: [6, 6, 6] },
    { name: 'Kopshti i Bjeshkës', location: 'Bajgorë, Mitrovicë', rows: [6, 5, 4] },
    { name: 'Livadhi i Lules', location: 'Pogragjë, Gjilan', rows: [6, 6], notes: 'Pranë fushave me lule dielli.' },
    { name: 'Bletaria e Vogël', location: 'Nerodime, Ferizaj', rows: [6], notes: 'Koloni të reja nga ndarjet e pranverës.' },
  ]},
];

function deleteApiary(id) {
  db.prepare('DELETE FROM hive_floor_visit_data WHERE hive_visit_data_id IN (SELECT hvd.id FROM hive_visit_data hvd JOIN visits v ON v.id = hvd.visit_id WHERE v.apiary_id = ?)').run(id);
  db.prepare('DELETE FROM hive_visit_data WHERE visit_id IN (SELECT id FROM visits WHERE apiary_id = ?)').run(id);
  db.prepare('DELETE FROM hive_visit_data WHERE hive_id IN (SELECT id FROM hives WHERE apiary_id = ?)').run(id);
  db.prepare('DELETE FROM visits WHERE apiary_id = ?').run(id);
  db.prepare('DELETE FROM feeding_plan_hives WHERE feeding_plan_id IN (SELECT id FROM feeding_plans WHERE apiary_id = ?)').run(id);
  db.prepare('DELETE FROM feeding_plan_hives WHERE hive_id IN (SELECT id FROM hives WHERE apiary_id = ?)').run(id);
  db.prepare('DELETE FROM feeding_plans WHERE apiary_id = ?').run(id);
  db.prepare('DELETE FROM hive_floors WHERE hive_id IN (SELECT id FROM hives WHERE apiary_id = ?)').run(id);
  db.prepare('DELETE FROM hives WHERE apiary_id = ?').run(id);
  db.prepare('DELETE FROM apiaries WHERE id = ?').run(id);
}

const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name));
function deleteUser(id) {
  db.prepare('SELECT id FROM apiaries WHERE user_id = ?').all(id).forEach(a => deleteApiary(a.id));
  for (const t of ['notifications', 'post_likes', 'comments', 'community_posts', 'marketplace_listings', 'ai_usage']) {
    if (tables.has(t)) db.prepare(`DELETE FROM ${t} WHERE user_id = ?`).run(id);
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

const run = db.transaction(() => {
  // Admini s'ka kopshte
  const admin = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
  if (admin) {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(admin.id);
    db.prepare('SELECT id FROM apiaries WHERE user_id = ?').all(admin.id).forEach(a => deleteApiary(a.id));
  }
  db.prepare('SELECT id FROM users WHERE email LIKE ?').all(`%@${DOMAIN}`).forEach(u => deleteUser(u.id));

  const hash = bcrypt.hashSync('demo123', 10);
  const insUser = db.prepare('INSERT INTO users (first_name, last_name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const insApiary = db.prepare('INSERT INTO apiaries (user_id, name, rows, hives_per_row, location, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insHive = db.prepare('INSERT INTO hives (apiary_id, position_row, position_col, unique_code, status, queen_present, queen_age_months, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insFloor = db.prepare('INSERT INTO hive_floors (hive_id, floor_number, frames_bees, frames_eggs, frames_honey, frames_new) VALUES (?, ?, ?, ?, ?, ?)');
  const insVisit = db.prepare('INSERT INTO visits (apiary_id, visit_date, status, notes, created_at) VALUES (?, ?, ?, ?, ?)');
  const insHvd = db.prepare('INSERT INTO hive_visit_data (visit_id, hive_id, queen_present, queen_age_months, status, notes) VALUES (?, ?, ?, ?, ?, ?)');
  const insFvd = db.prepare('INSERT INTO hive_floor_visit_data (hive_visit_data_id, floor_id, frames_bees, frames_eggs, frames_honey, frames_new) VALUES (?, ?, ?, ?, ?, ?)');
  const insPlan = db.prepare('INSERT INTO feeding_plans (apiary_id, plan_date, description, food_amount, medicine, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const insPlanHive = db.prepare('INSERT INTO feeding_plan_hives (feeding_plan_id, hive_id, food_amount, medicine, notes) VALUES (?, ?, ?, ?, ?)');

  const PROBLEM_NOTES = ['Varroa e dukshme, trajto me acid oksalik.', 'Koloni e dobët, duhet bashkuar.', 'Pak ushqim, ushqe me shurup.', 'Shenja grabitjeje te hyrja.'];
  const VISIT_NOTES = ['Kontroll i rregullt, kolonitë në gjendje të mirë.', 'Shtuar kat i ri te kosheret e forta.', 'Kontroll për varroa pas trajtimit.', 'Përgatitje për dimërim, kontroll i rezervave.'];
  const summary = [];

  for (const b of BEEKEEPERS) {
    const uid = insUser.run(b.first, b.last, `${b.email}@${DOMAIN}`, hash, 'user', ts(b.joined)).lastInsertRowid;
    let hivesTotal = 0;
    b.apiaries.forEach((a, ai) => {
      const created = b.joined - ai * 3 - 1;
      const apId = insApiary.run(uid, a.name, a.rows.length, Math.max(...a.rows), a.location, a.notes || null, ts(Math.max(created, 1))).lastInsertRowid;
      const hives = [];
      a.rows.forEach((count, ri) => {
        for (let col = 1; col <= count; col++) {
          const r = rnd();
          const status = r < 0.76 ? 'good' : r < 0.9 ? 'problem' : r < 0.95 ? 'dead' : 'empty';
          const alive = status === 'good' || status === 'problem';
          const queen = alive ? (status === 'problem' && rnd() < 0.4 ? 0 : 1) : 0;
          const hid = insHive.run(apId, ri + 1, col, `K${apId}-R${ri + 1}C${col}`, status, queen,
            queen ? int(3, 30) : null, status === 'problem' ? pick(PROBLEM_NOTES) : null, ts(Math.max(created, 1))).lastInsertRowid;
          const floors = [];
          const nFloors = alive ? (status === 'good' ? int(1, 3) : 1) : 1;
          for (let f = 1; f <= nFloors; f++) {
            const fr = alive ? [int(f === 1 ? 5 : 2, 10), f === 1 ? int(2, 6) : int(0, 2), int(1, 8), int(0, 3)] : [0, 0, 0, 0];
            floors.push({ id: insFloor.run(hid, f, ...fr).lastInsertRowid, fr });
          }
          hives.push({ id: hid, status, queen, floors });
        }
      });
      hivesTotal += hives.length;

      // Vizitat: 2–5 në 2 muajt e fundit + 1 e planifikuar
      const nVisits = int(2, 5);
      for (let v = 0; v < nVisits; v++) {
        const dAgo = int(2, 60) - v;
        const vid = insVisit.run(apId, day(Math.max(dAgo, 1)), 'completed', pick(VISIT_NOTES), ts(Math.max(dAgo, 1))).lastInsertRowid;
        for (const h of hives) {
          const hvd = insHvd.run(vid, h.id, h.queen, null, h.status, null).lastInsertRowid;
          for (const f of h.floors) insFvd.run(hvd, f.id, ...f.fr);
        }
      }
      if (rnd() < 0.6) insVisit.run(apId, day(-int(2, 10)), 'planned', 'Vizitë e planifikuar', ts(1));

      // Plan ushqimi për kopshtet me probleme
      const weak = hives.filter(h => h.status === 'problem');
      if (weak.length || rnd() < 0.4) {
        const pid = insPlan.run(apId, day(-int(1, 7)), 'Ushqim stimulues për kolonitë e dobëta', '1 kg shurup 1:1', weak.length ? 'Acid oksalik' : null, ts(1)).lastInsertRowid;
        (weak.length ? weak : hives.slice(0, 3)).forEach(h => insPlanHive.run(pid, h.id, '1 kg shurup', weak.length ? 'Acid oksalik' : null, null));
      }
    });
    summary.push(`${b.first} ${b.last} <${b.email}@${DOMAIN}>: ${b.apiaries.length} kopsht(e), ${hivesTotal} koshere`);
  }
  return summary;
});

console.log(run().join('\n'));
console.log('Fjalëkalimi: demo123');
