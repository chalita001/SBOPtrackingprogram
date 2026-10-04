import { Router, Response } from 'express';
import db from '../db.js';
import { authenticate, AuthRequest } from '../auth.js';
import { sendNotificationEmail } from '../email.js';

const router = Router();

// Protect email routes
router.use(authenticate);

// Get email logs
router.get('/logs', (_req: AuthRequest, res: Response) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM email_logs
      ORDER BY sent_at DESC
      LIMIT 100
    `).all();

    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Send custom notification email (e.g. Manual inspection reminder or defect follow-up)
router.post('/send-alert', async (req: AuthRequest, res: Response) => {
  try {
    const { to, toName, subject, message, inspectionId } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'Please provide recipient email, subject and message' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px;">ข้อความแจ้งเตือนจากระบบ SBOP Safety System</h2>
        <p>เรียน คุณ <strong>${toName || to}</strong>,</p>
        <p style="white-space: pre-wrap; line-height: 1.6; color: #334155;">${message}</p>
        <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px; margin: 16px 0; font-size: 13px;">
          ส่งโดย: <strong>${req.user!.firstName} ${req.user!.lastName}</strong> (${req.user!.email})<br/>
          แผนก: <strong>${req.user!.department}</strong>
        </div>
        <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          ระบบติดตามและตรวจเช็คความปลอดภัย SBOP Tracking Program &copy; 2026
        </div>
      </div>
    `;

    const result = await sendNotificationEmail({
      to: to.trim(),
      toName,
      subject: subject.trim(),
      html,
      type: 'manual_reminder',
      relatedId: inspectionId ? parseInt(inspectionId, 10) : undefined,
    });

    return res.json({
      message: 'Notification email dispatched successfully!',
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
