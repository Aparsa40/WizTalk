import fs from 'node:fs';
import path from 'node:path';

interface MigrationDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  };
}

export function runMigrations(db: MigrationDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at INTEGER NOT NULL
    );
  `);

  const migrationsPath = path.join(process.cwd(), 'server', 'database', 'migrations');
  if (!fs.existsSync(migrationsPath)) return;

  const files = fs.readdirSync(migrationsPath)
    .filter((file) => /^\\d+_[a-z0-9_-]+\\.sql$/i.test(file))
    .sort();

  for (const file of files) {
    const exists = db.prepare(
      'SELECT 1 FROM schema_migrations WHERE name = ?',
    ).get(file);

    if (exists) continue;

    const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');

    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare(
        'INSERT INTO schema_migrations (name, executed_at) VALUES (?, ?)',
      ).run(file, Date.now());
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`Database migration failed: ${file}`, { cause: error });
    }
  }
}
