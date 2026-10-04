-- Cloudflare D1 Database Schema for SBOP Tracking Program
-- Database: d1sbop (413b2fe9-b280-4a1b-81ac-cb20f9e41935)

DROP TABLE IF EXISTS inspection_items;
DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS checklist_templates;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- 1. Departments Table
CREATE TABLE departments (
    code TEXT PRIMARY KEY,
    name_th TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
-- ข้อมูลพนักงาน: ชื่อ นามสกุล เบอร์โทร อีเมล แผนก ตำแหน่ง พื้นที่รับผิดชอบ สิทธิ์ในระบบ
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    responsible_area TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'inspector', -- 'admin', 'supervisor', 'inspector', 'staff'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    password_hash TEXT NOT NULL,
    notes TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 3. Checklist Templates (สกัดจากเอกสาร SBOP.xlsx ทุกข้อ)
CREATE TABLE checklist_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_code TEXT NOT NULL,
    layer TEXT NOT NULL, -- 'Layer 1', 'Layer 2', 'Layer 3'
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

-- 4. Inspections Table (บันทึกการตรวจเช็คแยกแผนก แยกรอบเดือน รอบปี)
CREATE TABLE inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_code TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    inspection_code TEXT DEFAULT '001', -- รหัสรายการ เช่น 001, 002
    layer TEXT NOT NULL, -- 'Layer 1', 'Layer 2', 'Layer 3'
    shift TEXT NOT NULL, -- 'A', 'B', 'C', 'Day', 'Night'
    mc_and_products TEXT NOT NULL, -- เครื่องจักรและผลิตภัณฑ์
    auditor_id INTEGER,
    auditor_name TEXT NOT NULL, -- ผู้ตรวจ
    audit_date TEXT NOT NULL, -- วันที่ตรวจ (YYYY-MM-DD)
    total_ok INTEGER DEFAULT 0,
    total_no INTEGER DEFAULT 0,
    total_na INTEGER DEFAULT 0,
    score_percent REAL DEFAULT 0.0,
    status TEXT DEFAULT 'completed', -- 'draft', 'submitted', 'completed', 'reviewed'
    comments TEXT, -- ข้อคิดเห็นหรือข้อเสนอแนะสำหรับการปรับปรุง Comments / Suggestion for Process Improvement
    previous_findings TEXT, -- Finding from previous audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_code) REFERENCES departments(code),
    FOREIGN KEY (auditor_id) REFERENCES users(id)
);

-- 5. Inspection Items Table (ผลตรวจแต่ละข้อ แนบรูปภาพเมื่อผิดปกติ NO)
CREATE TABLE inspection_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL,
    template_item_id INTEGER,
    layer TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    question TEXT NOT NULL,
    result TEXT NOT NULL, -- 'OK', 'NO', 'N/A'
    finding_topic TEXT, -- รายละเอียดปัญหาที่พบ
    severity TEXT, -- 'Minor', 'Major'
    action_plan TEXT, -- แนวทางการแก้ไข
    responsible_person TEXT, -- ผู้รับผิดชอบ
    due_date TEXT, -- วันที่กำหนดเสร็จ
    image_url TEXT, -- ลิงก์รูปภาพ Cloudflare R2
    image_key TEXT, -- ชื่อไฟล์/คีย์ใน R2
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

-- 6. Email Logs Table (บันทึกการส่งเตือนไปยังอีเมลของ Account นั้นๆ)
CREATE TABLE email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL, -- 'registration_alert', 'approval_status', 'defect_notification', 'inspection_summary', 'manual_reminder'
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
    related_id INTEGER,
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. System Settings
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_dept ON users(department);
CREATE INDEX idx_inspections_dept_year_month ON inspections(department_code, year, month);
CREATE INDEX idx_inspection_items_inspection ON inspection_items(inspection_id);
CREATE INDEX idx_checklist_dept_layer ON checklist_templates(department_code, layer);
