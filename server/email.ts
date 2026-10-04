import nodemailer from 'nodemailer';
import db from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'SBOP Safety System <safety-noreply@sbop.com>';

let transporter: nodemailer.Transporter | null = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  type: 'registration_alert' | 'approval_status' | 'defect_alert' | 'inspection_summary' | 'manual_reminder';
  relatedId?: number;
}

export async function sendNotificationEmail(options: EmailOptions): Promise<{ success: boolean; logId: number; error?: string }> {
  let status = 'sent';
  let errorMsg: string | undefined;

  try {
    if (transporter) {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[Email Sent] To: ${options.to} | Subject: ${options.subject}`);
    } else {
      console.log(`[Simulated Email Sent] To: ${options.to} | Subject: ${options.subject}`);
    }
  } catch (err: any) {
    console.error(`[Email Failed] To: ${options.to}:`, err.message);
    status = 'failed';
    errorMsg = err.message;
  }

  // Record to email_logs table
  const stmt = db.prepare(`
    INSERT INTO email_logs (recipient_email, recipient_name, subject, body, type, status, related_id, error_message, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  const result = stmt.run(
    options.to,
    options.toName || options.to,
    options.subject,
    options.html,
    options.type,
    status,
    options.relatedId || null,
    errorMsg || null
  );

  return {
    success: status === 'sent',
    logId: Number(result.lastInsertRowid),
    error: errorMsg,
  };
}

// 1. Template: New Registration (Sent to Admins)
export async function sendRegistrationAlertToAdmin(adminEmail: string, user: { firstName: string; lastName: string; email: string; department: string; position: string }) {
  const subject = `[SBOP Alert] มีการลงทะเบียนผู้ใช้งานใหม่: ${user.firstName} ${user.lastName} (${user.department})`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px;">แจ้งเตือนการลงทะเบียนสมาชิกใหม่ (SBOP System)</h2>
      <p>เรียน ผู้ดูแลระบบ,</p>
      <p>มีพนักงานทำการลงทะเบียนเข้าใช้งานระบบ <strong>SBOP Tracking Program</strong> รายละเอียดดังนี้:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; width: 35%;">ชื่อ-นามสกุล</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${user.firstName} ${user.lastName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc;">อีเมล</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${user.email}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc;">แผนก</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${user.department}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc;">ตำแหน่ง</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${user.position}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc;">สถานะ</td><td style="padding: 8px; border: 1px solid #cbd5e1; color: #d97706; font-weight: bold;">รอการอนุมัติ (Pending Approval)</td></tr>
      </table>
      <p>กรุณาเข้าสู่ระบบที่หน้า <strong>Account Manager (จัดการสมาชิก)</strong> เพื่อทำการอนุมัติสิทธิ์การใช้งาน</p>
      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        ระบบติดตามและตรวจเช็คความปลอดภัย SBOP Tracking Program &copy; 2026
      </div>
    </div>
  `;

  return sendNotificationEmail({
    to: adminEmail,
    subject,
    html,
    type: 'registration_alert',
  });
}

// 2. Template: Account Approval/Rejection (Sent to the User)
export async function sendAccountStatusEmail(userEmail: string, userName: string, status: 'approved' | 'rejected', role: string) {
  const isApproved = status === 'approved';
  const subject = isApproved 
    ? `[SBOP] บัญชีของคุณได้รับการอนุมัติแล้ว (Account Approved)`
    : `[SBOP] ผลการพิจารณาการสมัครสมาชิก (Account Registration Notice)`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'}; border-bottom: 2px solid ${isApproved ? '#16a34a' : '#dc2626'}; padding-bottom: 8px;">
        ${isApproved ? 'บัญชีของคุณได้รับการอนุมัติเรียบร้อยแล้ว' : 'แจ้งเตือนสถานะบัญชี SBOP'}
      </h2>
      <p>เรียน คุณ <strong>${userName}</strong>,</p>
      ${isApproved ? `
        <p>ยินดีต้อนรับสู่ระบบ <strong>SBOP Tracking Program</strong> บัญชีของคุณได้รับการอนุมัติจากผู้ดูแลระบบเรียบร้อยแล้ว</p>
        <p><strong>สิทธิ์การใช้งานของคุณ:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${role.toUpperCase()}</span></p>
        <p>ขณะนี้คุณสามารถเข้าสู่ระบบและเริ่มบันทึกการตรวจเช็คข้อมูลความปลอดภัยได้ทันที</p>
      ` : `
        <p>ขออภัย บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลระบบหรือหัวหน้าแผนกของคุณเพื่อตรวจสอบข้อมูลเพิ่มเติม</p>
      `}
      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        ระบบติดตามและตรวจเช็คความปลอดภัย SBOP Tracking Program &copy; 2026
      </div>
    </div>
  `;

  return sendNotificationEmail({
    to: userEmail,
    toName: userName,
    subject,
    html,
    type: 'approval_status',
  });
}

// 3. Template: Defect / Issue Found Notification (Sent when NO is recorded)
export async function sendDefectAlertEmail(
  recipientEmail: string,
  recipientName: string,
  data: {
    department: string;
    auditorName: string;
    auditDate: string;
    shift: string;
    machineProduct: string;
    findingTopic: string;
    severity: string;
    actionPlan?: string;
    responsiblePerson?: string;
    dueDate?: string;
    imageUrl?: string;
  }
) {
  const isMajor = data.severity === 'Major';
  const subject = `[SBOP Defect Alert] ตรวจพบสิ่งผิดปกติ (${data.severity}) - แผนก ${data.department} วันที่ ${data.auditDate}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background: ${isMajor ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${isMajor ? '#ef4444' : '#f59e0b'}; padding: 12px; margin-bottom: 16px;">
        <h3 style="color: ${isMajor ? '#b91c1c' : '#b45309'}; margin: 0 0 4px 0;">
          ⚠️ รายงานการตรวจพบข้อบกพร่อง / สิ่งผิดปกติในการตรวจสอบความปลอดภัย SBOP
        </h3>
        <span style="font-size: 12px; color: #64748b;">ระดับความรุนแรง: <strong>${data.severity}</strong> (${isMajor ? 'ต้องลงบันทึกในบอร์ด SBOP และกำหนดวันเสร็จ' : 'แก้ไขทันที'})</span>
      </div>

      <p>เรียน คุณ <strong>${recipientName}</strong>,</p>
      <p>มีการบันทึกการตรวจเช็คความปลอดภัยประจำรอบ และพบรายการที่ไม่ผ่านเกณฑ์ (Result: NO) โดยมีรายละเอียดดังต่อไปนี้:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; width: 35%;">แผนก (Department)</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${data.department}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">เครื่องจักร / ผลิตภัณฑ์</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${data.machineProduct}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">กะ / วันที่ตรวจ</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${data.shift} | ${data.auditDate}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">ผู้ตรวจ (Auditor)</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${data.auditorName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #fee2e2; color: #991b1b; font-weight: bold;">ปัญหาที่พบ (Finding)</td><td style="padding: 8px; border: 1px solid #e2e8f0; color: #991b1b; font-weight: bold;">${data.findingTopic}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">แนวทางแก้ไข (Action Plan)</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${data.actionPlan || '-'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">ผู้รับผิดชอบ / กำหนดเสร็จ</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${data.responsiblePerson || '-'} | กำหนดเสร็จ: ${data.dueDate || '-'}</td></tr>
      </table>

      ${data.imageUrl ? `
        <div style="margin: 16px 0; text-align: center;">
          <p style="font-weight: bold; margin-bottom: 8px; text-align: left;">📸 รูปภาพประกอบที่ตรวจพบ (Cloudflare R2 Storage):</p>
          <img src="${data.imageUrl}" alt="Defect Photo" style="max-width: 100%; height: auto; max-height: 300px; border-radius: 6px; border: 1px solid #cbd5e1;" />
          <div style="margin-top: 4px;"><a href="${data.imageUrl}" target="_blank" style="color: #0284c7; font-size: 12px;">คลิกเพื่อดูรูปภาพขนาดเต็ม</a></div>
        </div>
      ` : ''}

      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        ระบบติดตามและตรวจเช็คความปลอดภัย SBOP Tracking Program &copy; 2026
      </div>
    </div>
  `;

  return sendNotificationEmail({
    to: recipientEmail,
    toName: recipientName,
    subject,
    html,
    type: 'defect_alert',
  });
}
