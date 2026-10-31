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

  // Ensure MOLD and MM departments are separated and updated
  try {
    db.exec(`
      UPDATE departments SET name_th = 'แผนกฉีดขึ้นรูป (Molding)', name_en = 'Molding Department', description = 'Injection Molding Operations' WHERE code = 'MOLD';
      INSERT OR REPLACE INTO departments (code, name_th, name_en, description) VALUES ('MM', 'แผนกซ่อมบำรุงแม่พิมพ์ (Mold Maintenance)', 'Mold Maintenance Department', 'Mold Maintenance and Tool Servicing');
    `);

    // Ensure checklist templates for MM & MOLD exist from master_sbop_questions.json
    const mmCheck = db.prepare("SELECT count(*) as count FROM checklist_templates WHERE department_code = 'MM'").get() as { count: number };
    if (mmCheck.count === 0) {
      const masterPath = path.resolve(process.cwd(), 'master_sbop_questions.json');
      if (fs.existsSync(masterPath)) {
        const master = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));
        const insertTmpl = db.prepare(`
          INSERT INTO checklist_templates (department_code, layer, category, subcategory, method, item_order, question_th, question_en, row_in_excel)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        if (master.MOLD?.items) {
          db.prepare("DELETE FROM checklist_templates WHERE department_code = 'MOLD'").run();
          for (const it of master.MOLD.items) {
            insertTmpl.run('MOLD', it.layer, it.category || '', it.subcategory || '', it.method || '', it.item_order || 1, it.question || '', it.question_en || '', it.row_in_excel || null);
          }
        }
        if (master.MM?.items) {
          db.prepare("DELETE FROM checklist_templates WHERE department_code = 'MM'").run();
          for (const it of master.MM.items) {
            insertTmpl.run('MM', it.layer, it.category || '', it.subcategory || '', it.method || '', it.item_order || 1, it.question || '', it.question_en || '', it.row_in_excel || null);
          }
        }
      }
    }
  } catch (e) {
    console.error('Department/template update error in db:', e);
  }
}

export default db;
