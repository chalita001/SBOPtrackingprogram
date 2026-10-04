import json
import bcrypt

# Password hash for default test accounts: 'admin1234' and 'password123'
salt = bcrypt.gensalt()
admin_hash = bcrypt.hashpw(b'admin1234', salt).decode('utf-8')
user_hash = bcrypt.hashpw(b'password123', salt).decode('utf-8')

with open('master_sbop_questions.json', 'r', encoding='utf-8') as f:
    master_data = json.load(f)

sql_lines = []
sql_lines.append("-- Seed Data for SBOP Tracking Program")
sql_lines.append("")

# 1. Departments
departments = [
    ('MOLD', 'แผนกฉีดขึ้นรูป (Molding / MM)', 'Molding / MM Department', 'Injection Molding and Maintenance'),
    ('FACILITY', 'แผนกสาธารณูปโภค (Facility)', 'Facility Department', 'Utilities, Safety, and Plant Infrastructure'),
    ('ASSY', 'แผนกประกอบ (Assembly)', 'Assembly Department', 'Component and Final Assembly Lines'),
    ('WH', 'แผนกคลังสินค้า (Warehouse)', 'Warehouse Department', 'Raw materials, Parts, and Finished Goods Storage'),
    ('QC', 'แผนกควบคุมคุณภาพ (QC)', 'Quality Control Department', 'Quality Assurance and Inspection'),
    ('STAMPING', 'แผนกปั๊มขึ้นรูป (Stamping)', 'Stamping Department', 'Metal Stamping and Pressing'),
    ('TOOL', 'แผนกแม่พิมพ์และเครื่องมือ (Tooling)', 'Tooling Department', 'Tool and Die Making and Repair')
]

for code, th, en, desc in departments:
    sql_lines.append(f"INSERT OR REPLACE INTO departments (code, name_th, name_en, description) VALUES ('{code}', '{th}', '{en}', '{desc}');")

sql_lines.append("")

# 2. Users (Admin, Supervisor, Auditors, Pending Users)
users = [
    # Admin
    ("สมศักดิ์", "มั่นคง", "081-234-5678", "admin@sbop.com", "FACILITY", "EHS Safety Manager", "โรงงานทั้งหมด (All Areas)", "admin", "approved", admin_hash),
    # Supervisor
    ("วิชัย", "เจริญพร", "089-876-5432", "supervisor@sbop.com", "MOLD", "Molding Supervisor", "Zone A - Injection Line 1-5", "supervisor", "approved", user_hash),
    # Approved Auditor / Inspector
    ("จุฬาลักษณ์", "สุขสม", "086-111-2233", "julalak.s@sbop.com", "ASSY", "Safety Inspector", "Assembly Line 1-4", "inspector", "approved", user_hash),
    # Pending User 1
    ("ประสิทธิ์", "มีชัย", "084-555-6677", "prasit.m@sbop.com", "WH", "Warehouse Leader", "คลังสินค้า A2-B4", "staff", "pending", user_hash),
    # Pending User 2
    ("กานดา", "ยอดดี", "082-999-8877", "kanda.y@sbop.com", "QC", "QC Specialist", "ห้องปฏิบัติการตรวจสอบคุณภาพ", "inspector", "pending", user_hash)
]

for fn, ln, ph, em, dept, pos, area, role, status, pw in users:
    sql_lines.append(f"INSERT OR REPLACE INTO users (first_name, last_name, phone, email, department, position, responsible_area, role, status, password_hash, approved_at) VALUES ('{fn}', '{ln}', '{ph}', '{em}', '{dept}', '{pos}', '{area}', '{role}', '{status}', '{pw}', CURRENT_TIMESTAMP);")

sql_lines.append("")

# 3. Checklist Templates from master_sbop_questions.json
for dept_code, d_info in master_data.items():
    sql_lines.append(f"-- Templates for {dept_code} ({d_info['name']})")
    for item in d_info['items']:
        layer = item['layer']
        cat = item['category'].replace("'", "''")
        subcat = (item['subcategory'] or '').replace("'", "''")
        method = (item['method'] or '').replace("'", "''")
        order_num = item['item_order'] or 1
        q_th = item['question'].replace("'", "''")
        r_excel = item['row_in_excel']
        
        sql_lines.append(
            f"INSERT INTO checklist_templates (department_code, layer, category, subcategory, method, item_order, question_th, row_in_excel) "
            f"VALUES ('{dept_code}', '{layer}', '{cat}', '{subcat}', '{method}', {order_num}, '{q_th}', {r_excel});"
        )
    sql_lines.append("")

# 4. Sample Inspection & Defect (with R2 image URL)
sql_lines.append("-- Sample Inspection Record")
sql_lines.append("""
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
""")

# Sample Inspection Items (including 1 NO with R2 image)
sql_lines.append("""
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
""")

# 5. System Settings
sql_lines.append("""
INSERT OR REPLACE INTO system_settings (key, value, description) VALUES ('R2_PUBLIC_URL', 'https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com/r2sbop', 'Cloudflare R2 Bucket Public URL');
INSERT OR REPLACE INTO system_settings (key, value, description) VALUES ('D1_DATABASE_ID', '413b2fe9-b280-4a1b-81ac-cb20f9e41935', 'Cloudflare D1 Database ID');
INSERT OR REPLACE INTO system_settings (key, value, description) VALUES ('EMAIL_SENDER', 'safety-noreply@sbop.com', 'System Notification Email Sender');
""")

with open('seed.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print("seed.sql generated successfully!")
