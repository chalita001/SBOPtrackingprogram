import fs from 'fs';
import bcrypt from 'bcryptjs';

const adminHash = bcrypt.hashSync('ehsadmin1234', 10);
const testerHash = bcrypt.hashSync('test1234', 10);

const masterData = JSON.parse(fs.readFileSync('master_sbop_questions.json', 'utf-8'));

const sqlLines: string[] = [];

// Drop and Create tables
sqlLines.push(`
DROP TABLE IF EXISTS inspection_items;
DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS checklist_templates;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
    code TEXT PRIMARY KEY,
    name_th TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    responsible_area TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'inspector',
    status TEXT NOT NULL DEFAULT 'approved',
    password_hash TEXT NOT NULL,
    notes TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE checklist_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_code TEXT NOT NULL,
    layer TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    method TEXT,
    item_order INTEGER NOT NULL,
    question_th TEXT NOT NULL,
    question_en TEXT,
    row_in_excel INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_code) REFERENCES departments(code)
);

CREATE TABLE inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_code TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    layer TEXT NOT NULL,
    shift TEXT NOT NULL,
    mc_and_products TEXT NOT NULL,
    auditor_id INTEGER,
    auditor_name TEXT NOT NULL,
    audit_date TEXT NOT NULL,
    total_ok INTEGER DEFAULT 0,
    total_no INTEGER DEFAULT 0,
    total_na INTEGER DEFAULT 0,
    score_percent REAL DEFAULT 0.0,
    status TEXT DEFAULT 'completed',
    comments TEXT,
    previous_findings TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_code) REFERENCES departments(code)
);

CREATE TABLE inspection_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL,
    template_item_id INTEGER,
    layer TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    question TEXT NOT NULL,
    result TEXT NOT NULL,
    finding_topic TEXT,
    severity TEXT,
    action_plan TEXT,
    responsible_person TEXT,
    due_date TEXT,
    image_url TEXT,
    image_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE TABLE email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    related_id INTEGER,
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Insert Departments
const departments = [
  ['MOLD', 'แผนกฉีดขึ้นรูป (Molding / MM)', 'Molding / MM Department', 'Injection Molding and Maintenance'],
  ['FACILITY', 'แผนกสาธารณูปโภค (Facility)', 'Facility Department', 'Utilities, Safety, and Plant Infrastructure'],
  ['ASSY', 'แผนกประกอบ (Assembly)', 'Assembly Department', 'Component and Final Assembly Lines'],
  ['WH', 'แผนกคลังสินค้า (Warehouse)', 'Warehouse Department', 'Raw materials, Parts, and Finished Goods Storage'],
  ['QC', 'แผนกควบคุมคุณภาพ (QC)', 'Quality Control Department', 'Quality Assurance and Inspection'],
  ['STAMPING', 'แผนกปั๊มขึ้นรูป (Stamping)', 'Stamping Department', 'Metal Stamping and Pressing'],
  ['TOOL', 'แผนกแม่พิมพ์และเครื่องมือ (Tooling)', 'Tooling Department', 'Tool and Die Making and Repair']
];

for (const [code, th, en, desc] of departments) {
  sqlLines.push(`INSERT INTO departments (code, name_th, name_en, description) VALUES ('${code}', '${th}', '${en}', '${desc}');`);
}

// Insert Required Users:
// 1. Admin with password: ehsadmin1234
// 2. User Tester with password: test1234
sqlLines.push(`
INSERT INTO users (first_name, last_name, phone, email, department, position, responsible_area, role, status, password_hash, approved_at)
VALUES ('ผู้ดูแลระบบ', 'ส่วนกลาง (Admin)', '081-234-5678', 'admin@sbop.com', 'FACILITY', 'EHS Safety Manager', 'All Areas', 'admin', 'approved', '${adminHash}', CURRENT_TIMESTAMP);

INSERT INTO users (first_name, last_name, phone, email, department, position, responsible_area, role, status, password_hash, approved_at)
VALUES ('EHS', 'Administrator', '081-234-5678', 'ehsadmin@sbop.com', 'FACILITY', 'Safety Administrator', 'Plant Overall', 'admin', 'approved', '${adminHash}', CURRENT_TIMESTAMP);

INSERT INTO users (first_name, last_name, phone, email, department, position, responsible_area, role, status, password_hash, approved_at)
VALUES ('User', 'Tester', '089-999-8888', 'usertester@sbop.com', 'MOLD', 'Safety Inspector (Tester)', 'Zone A - Line 1', 'inspector', 'approved', '${testerHash}', CURRENT_TIMESTAMP);

INSERT INTO users (first_name, last_name, phone, email, department, position, responsible_area, role, status, password_hash, approved_at)
VALUES ('Tester', 'Inspector', '089-999-8888', 'tester@sbop.com', 'ASSY', 'Inspector Tester', 'Assembly Line 1', 'inspector', 'approved', '${testerHash}', CURRENT_TIMESTAMP);
`);

// Insert Templates from master_sbop_questions.json
for (const [deptCode, dInfo] of Object.entries(masterData as Record<string, any>)) {
  for (const item of dInfo.items) {
    const layer = item.layer;
    const cat = (item.category || '').replace(/'/g, "''");
    const subcat = (item.subcategory || '').replace(/'/g, "''");
    const method = (item.method || '').replace(/'/g, "''");
    const orderNum = item.item_order || 1;
    const qTh = (item.question || '').replace(/'/g, "''");
    const rExcel = item.row_in_excel;

    sqlLines.push(
      `INSERT INTO checklist_templates (department_code, layer, category, subcategory, method, item_order, question_th, row_in_excel) ` +
      `VALUES ('${deptCode}', '${layer}', '${cat}', '${subcat}', '${method}', ${orderNum}, '${qTh}', ${rExcel});`
    );
  }
}

// System Settings
sqlLines.push(`
INSERT INTO system_settings (key, value, description) VALUES ('R2_PUBLIC_URL', 'https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com/r2sbop', 'Cloudflare R2 Bucket Public URL');
INSERT INTO system_settings (key, value, description) VALUES ('D1_DATABASE_ID', '413b2fe9-b280-4a1b-81ac-cb20f9e41935', 'Cloudflare D1 Database ID');
`);

fs.writeFileSync('init_d1_remote.sql', sqlLines.join('\n'), 'utf-8');
console.log('init_d1_remote.sql generated successfully with Admin (ehsadmin1234) and usertester (test1234)!');
