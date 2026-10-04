import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const masterData = JSON.parse(fs.readFileSync('master_sbop_questions.json', 'utf-8'));

const adminHash = bcrypt.hashSync('admin1234', 10);
const userHash = bcrypt.hashSync('password123', 10);

const sqlLines: string[] = [];
sqlLines.push('-- Seed Data for SBOP Tracking Program');
sqlLines.push('');

// 1. Departments
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
  sqlLines.push(`INSERT OR REPLACE INTO departments (code, name_th, name_en, description) VALUES ('${code}', '${th}', '${en}', '${desc}');`);
}
sqlLines.push('');

// 2. Users (Admin, Supervisor, Auditors, Pending Users)
const users = [
  ['สมศักดิ์', 'มั่นคง', '081-234-5678', 'admin@sbop.com', 'FACILITY', 'EHS Safety Manager', 'โรงงานทั้งหมด (All Areas)', 'admin', 'approved', adminHash],
  ['วิชัย', 'เจริญพร', '089-876-5432', 'supervisor@sbop.com', 'MOLD', 'Molding Supervisor', 'Zone A - Injection Line 1-5', 'supervisor', 'approved', userHash],
  ['จุฬาลักษณ์', 'สุขสม', '086-111-2233', 'julalak.s@sbop.com', 'ASSY', 'Safety Inspector', 'Assembly Line 1-4', 'inspector', 'approved', userHash],
  ['ประสิทธิ์', 'มีชัย', '084-555-6677', 'prasit.m@sbop.com', 'WH', 'Warehouse Leader', 'คลังสินค้า A2-B4', 'staff', 'pending', userHash],
  ['กานดา', 'ยอดดี', '082-999-8877', 'kanda.y@sbop.com', 'QC', 'QC Specialist', 'ห้องปฏิบัติการตรวจสอบคุณภาพ', 'inspector', 'pending', userHash]
];

for (const [fn, ln, ph, em, dept, pos, area, role, status, pw] of users) {
  sqlLines.push(`INSERT OR REPLACE INTO users (first_name, last_name, phone, email, department, position, responsible_area, role, status, password_hash, approved_at) VALUES ('${fn}', '${ln}', '${ph}', '${em}', '${dept}', '${pos}', '${area}', '${role}', '${status}', '${pw}', CURRENT_TIMESTAMP);`);
}
sqlLines.push('');

// 3. Checklist Templates from master_sbop_questions.json
for (const [deptCode, dInfo] of Object.entries(masterData as Record<string, any>)) {
  sqlLines.push(`-- Templates for ${deptCode} (${dInfo.name})`);
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
  sqlLines.push('');
}

// 4. Sample Inspection & Defect (with R2 image URL)
sqlLines.push('-- Sample Inspection Record');
sqlLines.push(`
INSERT INTO inspections (department_code, year, month, layer, shift, mc_and_products, auditor_id, auditor_name, audit_date, total_ok, total_no, total_na, score_percent, status, comments, previous_findings)
VALUES (
    'MOLD', 
    2026, 
    10, 
    'Layer 1', 
    'กะ A (Day)', 
    'เครื่องฉีด M/C 08 (ชิ้นส่วน Connector Type-C)', 
    3, 
    'จุฬาลักษณ์ สุขสม', 
    '2026-10-04', 
    45, 
    2, 
    1, 
    95.74, 
    'completed', 
    'ภาพรวมพนักงานปฏิบัติตามมาตรฐานความปลอดภัยได้ดี มีข้อปรับปรุงเรื่องสายไฟและอุปกรณ์ LOTO', 
    'ได้ตรวจสอบจุดที่มีปัญหารอบก่อน พบว่าแก้ไขจัดเก็บทางเดินเรียบร้อยดีแล้ว'
);

INSERT INTO inspection_items (inspection_id, template_item_id, layer, category, subcategory, question, result, finding_topic, severity, action_plan, responsible_person, due_date, image_url, image_key)
VALUES (
    1, 
    1, 
    'Layer 1', 
    'I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ', 
    'A.ท่าทางการทำงาน', 
    'การเดินปฏิบัติงาน', 
    'OK', 
    NULL, NULL, NULL, NULL, NULL, NULL, NULL
);

INSERT INTO inspection_items (inspection_id, template_item_id, layer, category, subcategory, question, result, finding_topic, severity, action_plan, responsible_person, due_date, image_url, image_key)
VALUES (
    1, 
    27, 
    'Layer 1', 
    'I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ', 
    'B. เครื่องจักรและอุปกรณ์', 
    'สายไฟอยู่ในสภาพปลอดภัยไม่ชำรุดหรือเสียหาย', 
    'NO', 
    'พบปลอกสายไฟเชื่อมต่อเครื่อง TCU ฉีกขาด มีความเสี่ยงไฟฟ้ารั่ว', 
    'Major', 
    'แจ้งแผนกช่างซ่อมบำรุงทำการเปลี่ยนปลอกหุ้มและสายไฟใหม่ทันที ปิดเบรกเกอร์ติดป้าย LOTO ชั่วคราว', 
    'วิชัย เจริญพร (ช่างซ่อมบำรุง)', 
    '2026-10-06', 
    'https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com/r2sbop/sample_defect_wire.jpg', 
    'sample_defect_wire.jpg'
);
`);

// 5. System Settings
sqlLines.push(`
INSERT OR REPLACE INTO system_settings (key, value, description) VALUES ('R2_PUBLIC_URL', 'https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com/r2sbop', 'Cloudflare R2 Bucket Public URL');
INSERT OR REPLACE INTO system_settings (key, value, description) VALUES ('D1_DATABASE_ID', '413b2fe9-b280-4a1b-81ac-cb20f9e41935', 'Cloudflare D1 Database ID');
INSERT OR REPLACE INTO system_settings (key, value, description) VALUES ('EMAIL_SENDER', 'safety-noreply@sbop.com', 'System Notification Email Sender');
`);

fs.writeFileSync('seed.sql', sqlLines.join('\n'), 'utf-8');
console.log('seed.sql generated successfully via Node.js!');
