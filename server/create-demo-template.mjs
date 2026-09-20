import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const source = path.resolve('server/school.db');
const target = path.resolve('server/demo-template.db');

if (!fs.existsSync(source)) throw new Error('Banco local server/school.db não encontrado.');
fs.copyFileSync(source, target);

const db = new Database(target);
const demoEmails = [
  'admin@escola.com',
  'diretor@escola.com',
  'coordenador@escola.com',
  'professor@escola.com',
  'aluno@escola.com',
];

db.pragma('foreign_keys = OFF');
const tables = new Set(
  db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map(({ name }) => name),
);

for (const table of ['messages', 'notifications', 'systemLogs', 'settings', 'user_requests']) {
  if (tables.has(table)) db.exec(`DELETE FROM "${table}"`);
}

const placeholders = demoEmails.map(() => '?').join(', ');
db.prepare(`DELETE FROM users WHERE lower(email) NOT IN (${placeholders})`).run(...demoEmails);

const password = await bcrypt.hash('123', 12);
db.prepare(`
  UPDATE users
  SET password = ?, phone = NULL, address = NULL, profileImageUrl = NULL,
      status = 'active', updatedAt = ?
  WHERE lower(email) IN (${placeholders})
`).run(password, new Date().toISOString(), ...demoEmails);

db.pragma('foreign_keys = ON');
db.exec('VACUUM');
db.close();

console.log('Base demonstrativa sanitizada criada em server/demo-template.db.');
