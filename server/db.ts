import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(process.cwd(), 'sbop_local.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  const tableCheck = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='users'").get() as { count: number };
  
  if (tableCheck.count === 0) {
    console.log('Database tables not found, initializing schema...');
    const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'schema.sql'), 'utf-8');
    db.exec(schemaSql);
  }

  // Ensure newer columns exist
  try { db.exec("ALTER TABLE inspection_items ADD COLUMN defect_status TEXT DEFAULT 'pending'"); } catch (e) {}
  try { db.exec("ALTER TABLE inspection_items ADD COLUMN fix_image_url TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE inspection_items ADD COLUMN fix_image_key TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE inspection_items ADD COLUMN fix_detail TEXT"); } catch (e) {}
}

export default db;
