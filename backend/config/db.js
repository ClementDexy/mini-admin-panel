import Database from 'better-sqlite3';
import { count } from 'console';
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

  getUserByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),

  selectStats: db.prepare(`
    SELECT created_at FROM users WHERE created_at >= ? ORDER BY created_at DESC
  `),

  countUsers: db.prepare(`
    SELECT COUNT(*) AS count FROM users
  `),

  countUsersByRole: db.prepare(`
    SELECT role, COUNT(*) AS count 
    FROM users 
    GROUP BY role
  `),

  countUsersByStatus: db.prepare(`
    SELECT status, COUNT(*) AS count 
    FROM users 
    GROUP BY status
  `),

  deleteUserById: db.prepare(`
    DELETE FROM users WHERE id = ?
  `)
};

export default db;
