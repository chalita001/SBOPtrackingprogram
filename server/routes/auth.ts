import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken, authenticate, AuthRequest } from '../auth.js';
import { sendRegistrationAlertToAdmin } from '../email.js';

const router = Router();

// Register new employee account
// ข้อมูลพนักงาน: ชื่อ นามสกุล เบอร์โทร อีเมล แผนก ตำแหน่ง พื้นที่รับผิดชอบ สิทธิ์ในระบบ
router.post('/register', async (req, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      department,
      position,
      responsibleArea,
      role = 'inspector',
      password,
    } = req.body;

    if (!firstName || !lastName || !email || !department || !position || !password) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'This email is already registered' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const initialStatus = 'pending'; // New accounts must be approved by admin

    const stmt = db.prepare(`
      INSERT INTO users (
        first_name, last_name, phone, email, department, position,
        responsible_area, role, status, password_hash, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      firstName.trim(),
      lastName.trim(),
      (phone || '').trim(),
      email.trim().toLowerCase(),
      department,
      position.trim(),
      (responsibleArea || '').trim(),
      role,
      initialStatus,
      passwordHash
    );

    const newUserId = Number(result.lastInsertRowid);

    // Send notification email to admins
    try {
      const admins = db.prepare("SELECT email FROM users WHERE role = 'admin'").all() as { email: string }[];
      for (const admin of admins) {
        await sendRegistrationAlertToAdmin(admin.email, {
          firstName,
          lastName,
          email,
          department,
          position,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send admin notification:', emailErr);
    }

    return res.status(201).json({
      message: 'Registration successful! Your account is pending admin approval.',
      userId: newUserId,
      status: initialStatus,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Login
router.post('/login', (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        error: 'Your account is pending approval from an administrator. You will receive an email once approved.',
        status: 'pending',
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        error: 'Your account has been rejected. Please contact the safety administrator.',
        status: 'rejected',
      });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        position: user.position,
        responsibleArea: user.responsible_area,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Current User Info (Me)
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare(`
      SELECT id, first_name, last_name, phone, email, department, position,
             responsible_area, role, status, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.user!.id) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      email: user.email,
      department: user.department,
      position: user.position,
      responsibleArea: user.responsible_area,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Account Profile
router.put('/profile', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, position, responsibleArea } = req.body;
    
    db.prepare(`
      UPDATE users 
      SET first_name = ?, last_name = ?, phone = ?, position = ?, responsible_area = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      firstName?.trim(),
      lastName?.trim(),
      phone?.trim(),
      position?.trim(),
      responsibleArea?.trim(),
      req.user!.id
    );

    return res.json({ message: 'Profile updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Change Password
router.put('/change-password', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user!.id);

    return res.json({ message: 'Password changed successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
