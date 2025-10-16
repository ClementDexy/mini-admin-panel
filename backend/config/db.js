import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create or open the SQLite database named 'users.db' in the parent directory
const db = new Database(path.join(__dirname, '..', 'users.db'));

db.pragma('journal_mode = WAL'); // Enable Write-Ahead Logging for better concurrency
db.pragma('foreign_keys = ON'); // Enforce foreign key constraints- Which is not necessary for a single table but good practice

// Create the 'users' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    email_hash BLOB NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'manager')),
    status TEXT NOT NULL CHECK(status IN ('active', 'inactive')),
    created_at INTEGER NOT NULL,
    signature BLOB NOT NULL
  );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_created_at ON users(created_at);
`);

// Prepared sql statements for better performance and readability
export const userStatements = {

  insertUser: db.prepare(`
    INSERT INTO users (email, email_hash, role, status, created_at, signature)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  updateUser: db.prepare(`
    UPDATE users
    SET email = ?, email_hash = ?, role = ?, status = ?, signature = ?
    WHERE id = ? 
    `),

  selectAllUsers: db.prepare(`
    SELECT * FROM users ORDER BY created_at DESC
  `),

  selectUserById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),

  selectStats: db.prepare(`
    SELECT
    date(created_at / 1000, 'unixepoch') AS date,
    COUNT(*) AS count 
    FROM users 
    WHERE created_at >= ? 
    GROUP BY date
    ORDER BY date
  `),
  
  countUsers: db.prepare(`
    SELECT COUNT(*) AS count FROM users
  `),

  deleteUserById: db.prepare(`
    DELETE FROM users WHERE id = ?
  `)
};

export default db;
