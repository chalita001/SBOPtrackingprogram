# 🛡️ SBOP Safety Audit & Tracking System (TE-EHS-053 Rev. H)

ระบบเว็บแอปพลิเคชันสำหรับตรวจเช็คและติดตามพฤติกรรมความปลอดภัยหน้างาน (**Safety Behavior Observation Program - SBOP**) พัฒนาตามโครงสร้างเอกสาร **SBOP.xlsx** ครบถ้วนทุกแผนก เชื่อมต่อฐานข้อมูล **Cloudflare D1** และที่จัดเก็บรูปภาพ **Cloudflare R2** พร้อมระบบสมาชิกและการแจ้งเตือนผ่านอีเมล

---

## ☁️ โครงสร้างการเชื่อมต่อ Cloudflare

| บริการ | ชื่อ / ข้อมูลระบุ | รายละเอียด |
| :--- | :--- | :--- |
| **Cloudflare D1 Database** | `d1sbop` | **Database ID:** `413b2fe9-b280-4a1b-81ac-cb20f9e41935` |
| **Cloudflare R2 Storage** | `r2sbop` | **Public URL:** `https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com/r2sbop` |

---

## ✨ คุณสมบัติหลักของระบบ (Key Features)

### 1. รองรับ 2 ภาษา (Bilingual Support: Thai / English)
- สลับภาษาระหว่าง **ภาษาไทย 🇹🇭** และ **English 🇬🇧** ได้ทันทีที่แถบเมนูด้านบน ครอบคลุมทุกหน้าจอ ทุกฟอร์ม และข้อความแจ้งเตือน

### 2. ระบบสมาชิกและสิทธิ์การใช้งาน (Authentication & Roles)
- **หน้า Login & Register:** สมัครสมาชิกพร้อมระบุข้อมูลพนักงานครบถ้วน
  - ชื่อ (First Name)
  - นามสกุล (Last Name)
  - เบอร์โทรศัพท์ (Phone)
  - อีเมล (Email)
  - แผนก (Department)
  - ตำแหน่ง (Position)
  - พื้นที่รับผิดชอบ (Responsible Area)
  - สิทธิ์ในระบบ (Role: Admin, Supervisor, Inspector, Staff)
- **ระบบความปลอดภัยและการอนุมัติ:**
  - สมาชิกใหม่จะอยู่ในสถานะ **รอการอนุมัติ (Pending Approval)**
  - ระบบจะส่งอีเมลแจ้งเตือนไปยังผู้ดูแลระบบทันทีที่มีการสมัคร
  - เมื่อผู้ดูแลระบบอนุมัติ ระบบจะส่งอีเมลแจ้งเตือนผลการอนุมัติไปยังอีเมลของผู้ใช้รายนั้นทันที

### 3. หน้าจัดการสมาชิกสำหรับแอดมิน (Account Manager)
- ดูรายชื่อพนักงานทั้งหมด กรองตามแผนก สถานะ และค้นหาตามชื่อ/อีเมล
- ปุ่ม **อนุมัติการสมัครสมาชิก (Approve)** และ **ไม่อนุมัติ (Reject)**
- ปรับเปลี่ยนสิทธิ์ในระบบ (Change Role)
- **ลบข้อมูลสมาชิก (Delete User)** พร้อมระบบยืนยันความปลอดภัย

### 4. หน้าข้อมูลพนักงาน (Account Info)
- ตรวจสอบข้อมูลส่วนตัวและสถานะบัญชี
- แก้ไขข้อมูลส่วนตัว (ชื่อ นามสกุล เบอร์โทร ตำแหน่ง พื้นที่รับผิดชอบ)
- ระบบเปลี่ยนรหัสผ่าน (Change Password)

### 5. แบบฟอร์มตรวจเช็ค SBOP (Inspection Checklist Form)
- **สกัดคำถามและหัวข้อจาก `SBOP.xlsx` ครบ 100% รวม 277 ข้อ จาก 7 แผนก:**
  1. `MOLD` — แผนกฉีดขึ้นรูป (Molding / MM) [48 ข้อ]
  2. `FACILITY` — แผนกสาธารณูปโภค (Facility) [39 ข้อ]
  3. `ASSY` — แผนกประกอบ (Assembly) [35 ข้อ]
  4. `WH` — แผนกคลังสินค้า (Warehouse) [41 ข้อ]
  5. `QC` — แผนกควบคุมคุณภาพ (QC) [37 ข้อ]
  6. `STAMPING` — แผนกปั๊มขึ้นรูป (Stamping) [40 ข้อ]
  7. `TOOL` — แผนกแม่พิมพ์และเครื่องมือ (Tooling) [37 ข้อ]
- **ตัวเลือกการตรวจครบตามเอกสาร:**
  - เลือกรอบปี (Year) และรอบเดือน (Month)
  - เลือกระดับการตรวจ (Layer):
    - `Layer 1`: ตรวจประจำกะ/ประจำวัน (Daily / Shift)
    - `Layer 2`: ตรวจรายสัปดาห์ (Weekly Verification)
    - `Layer 3`: ตรวจรายเดือน (Monthly Systems Audit)
  - ข้อมูลกะ (Shift) และ เครื่องจักร/ผลิตภัณฑ์ (M/C & Products)
  - ประเมินผลแต่ละข้อ: **OK (ผ่าน)**, **NO (ไม่ผ่าน/ผิดปกติ)**, **N/A (ไม่เกี่ยวข้อง)**
  - คำนวณคะแนนความปลอดภัยทันที (**Safety Score %**) พร้อมเกณฑ์สี

### 6. การแนบรูปภาพเมื่อตรวจพบสิ่งผิดปกติ (Cloudflare R2 Integration)
- เมื่อกดเลือก **NO** ฟอร์มบันทึกสิ่งผิดปกติจะเปิดขึ้นมาอัตโนมัติ:
  - หัวข้อปัญหาที่พบ (Finding Topic)
  - ระดับความรุนแรง (**Minor** แก้ไขทันที / **Major** ต้องลงบอร์ด SBOP)
  - แนวทางแก้ไข (Action Plan)
  - ผู้รับผิดชอบ (Responsible Person)
  - กำหนดวันเสร็จ (Due Date)
  - **ปุ่มแนบรูปภาพ (Take Photo / Upload):**
    - อัปโหลดรูปภาพหลักฐานเข้าสู่ Cloudflare R2 bucket `r2sbop`
    - แสดงภาพตัวอย่าง Thumbnail และลิงก์เปิดดูรูปขนาดเต็ม

### 7. ระบบส่งอีเมลแจ้งเตือน (Email Notifications & Logs)
- ส่งอีเมลแจ้งเตือนอัตโนมัติในกรณี:
  1. มีสมาชิกใหม่ลงทะเบียน (ส่งถึง Admin)
  2. บัญชีได้รับการอนุมัติ (ส่งถึงสมาชิก)
  3. ตรวจพบสิ่งผิดปกติ / ข้อบกพร่อง NO (ส่งถึงผู้รับผิดชอบ และแอดมิน พร้อมลิงก์รูปภาพ R2)
- **Email Notification Logs:** หน้าต่างตรวจสอบประวัติการส่งอีเมลของระบบ ดูผู้รับ เวลา สถานะ และเนื้อหาอีเมล พร้อมฟอร์มส่งอีเมลแจ้งเตือนด้วยตนเอง

---

## 🔑 บัญชีสำหรับเข้าสู่ระบบทดสอบ (Demo Accounts)

| บัญชี | อีเมล (Email) | รหัสผ่าน | แผนก | สิทธิ์ (Role) | สถานะ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ผู้ดูแลระบบ (Admin)** | `admin@sbop.com` | `admin1234` | FACILITY | **Admin** | Approved |
| **หัวหน้างาน (Supervisor)** | `supervisor@sbop.com` | `password123` | MOLD | **Supervisor** | Approved |
| **ผู้ตรวจ (Inspector)** | `julalak.s@sbop.com` | `password123` | ASSY | **Inspector** | Approved |
| **พนักงาน (รออนุมัติ)** | `prasit.m@sbop.com` | `password123` | WH | Staff | **Pending** |
| **ผู้ตรวจ (รออนุมัติ)** | `kanda.y@sbop.com` | `password123` | QC | Inspector | **Pending** |

---

## 🚀 วิธีการเริ่มต้นใช้งาน (Getting Started)

### 1. รันระบบในเครื่อง (Local Development)
```bash
# รันทั้ง Backend API Server และ Frontend Client พร้อมกัน:
npm run dev
```
- **Frontend URL:** [http://localhost:3000](http://localhost:3000)
- **Backend API URL:** [http://localhost:3001](http://localhost:3001)

### 2. คำสั่งจัดการฐานข้อมูล Cloudflare D1
```bash
# รัน Migration ตารางฐานข้อมูลลง D1 บนเครื่อง Local:
npm run d1:migrate

# Seed ข้อมูลคำถาม 277 ข้อ และแผนกลง D1 Local:
npm run d1:seed

# รัน Migration ไปยัง Cloudflare D1 Remote จริง (d1sbop):
npm run d1:migrate:remote

# Seed ข้อมูลไปยัง Cloudflare D1 Remote จริง (d1sbop):
npm run d1:seed:remote
```

### 3. Deploy ขึ้น Cloudflare Pages
```bash
# คอมไพล์โปรเจกต์
npm run build

# Deploy ไปยัง Cloudflare Pages
npm run deploy
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
SBOPtrackingprogram/
├── schema.sql                   # โครงสร้างตาราง D1 (users, checklist, inspections, items, email_logs)
├── seed.sql                     # ข้อมูลตั้งต้น 7 แผนก และ 277 ข้อตรวจเช็คจาก SBOP.xlsx
├── wrangler.toml                # การตั้งค่า Cloudflare D1 (d1sbop) และ R2 (r2sbop)
├── .env                         # การตั้งค่า Environment Variables
├── server/                      # Backend API Server (Express + Cloudflare D1 / R2)
│   ├── db.ts                    # การเชื่อมต่อฐานข้อมูล
│   ├── storage.ts               # ระบบจัดเก็บไฟล์ Cloudflare R2
│   ├── email.ts                 # บริการส่งอีเมลแจ้งเตือน
│   ├── auth.ts                  # ระบบยืนยันตัวตน JWT & Roles
│   └── routes/                  # API Endpoints (auth, users, checklist, inspections, upload, email)
├── src/                         # Frontend React + TypeScript + Tailwind CSS
│   ├── components/
│   │   ├── Navbar.tsx           # แถบเมนูด้านบน สลับภาษา TH/EN และสถานะ Cloudflare
│   │   ├── InspectionChecklist.tsx # ฟอร์มตรวจเช็ค SBOP พร้อมแนบรูป R2
│   │   ├── InspectionHistory.tsx   # ประวัติการตรวจเช็คแยกแผนก/เดือน/ปี
│   │   ├── DefectTracker.tsx    # บอร์ดติดตามข้อบกพร่อง (Finding Board)
│   │   ├── AccountManager.tsx   # หน้าสำหรับแอดมินจัดการและอนุมัติสมาชิก
│   │   ├── AccountInfoModal.tsx # ข้อมูลส่วนตัวพนักงาน
│   │   ├── LoginModal.tsx       # เข้าสู่ระบบ
│   │   ├── RegisterModal.tsx    # สมัครสมาชิก
│   │   └── EmailLogsModal.tsx   # บันทึกประวัติการส่งอีเมล
│   ├── context/AuthContext.tsx  # จัดการ Authentication & 2 ภาษา
│   └── i18n/translations.ts     # คำแปล 2 ภาษา (ไทย / อังกฤษ)
└── SBOP.xlsx                    # เอกสารต้นแบบ TE-EHS-053 Rev. H
```
