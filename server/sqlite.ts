import path from 'path';
import Database from 'better-sqlite3';

let instance: Database.Database | null = null;

export function getSqlite(): Database.Database {
  if (instance) return instance;

  const dbPath = path.resolve(process.cwd(), 'server', 'school.db');
  const db = new Database(dbPath);

  // Otimizações agressivas para performance
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');
  db.pragma('cache_size = -64000'); // ~64MB
  db.pragma('mmap_size = 268435456'); // 256MB memory mapping
  db.pragma('optimize');

  // Índices compostos para busca ultra-rápida
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_search_firstName ON users(firstName COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_users_search_lastName ON users(lastName COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_users_search_email ON users(email COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_users_search_composite ON users(firstName COLLATE NOCASE, lastName COLLATE NOCASE, email COLLATE NOCASE);
  `);

  instance = db;
  return instance;
}
