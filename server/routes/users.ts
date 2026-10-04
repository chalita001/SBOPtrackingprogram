import { Router, Response } from 'express';
import db from '../db.js';
import { authenticate, requireAdmin, AuthRequest } from '../auth.js';
import { sendAccountStatusEmail } from '../email.js';

const router = Router();

// Apply admin protection to all user management routes
router.use(authenticate);
router.use(requireAdmin);

// List all users with filtering by department, status, role
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { status, department, role, search } = req.query;

    let sql = `
      SELECT id, first_name, last_name, phone, email, department, position,
             responsible_area, role, status, approved_at, created_at, updated_at
      FROM users WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (department) {
      sql += ' AND department = ?';
      params.push(department);
    }
    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (search) {
      sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR position LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += " ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, created_at DESC";

    const users = db.prepare(sql).all(...params);

    // Get count statistics for admin dashboard
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM users
    `).get();

    return res.json({ users, counts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Approve user registration
router.put('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = db.prepare('SELECT id, first_name, last_name, email, role FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare(`
      UPDATE users 
      SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user!.id, userId);

    // Send email alert to the approved account!
    try {
      await sendAccountStatusEmail(user.email, `${user.first_name} ${user.last_name}`, 'approved', user.role);
    } catch (emailErr) {
      console.error('Failed to send approval email notification:', emailErr);
    }

    return res.json({ message: `Account for ${user.first_name} ${user.last_name} approved successfully!` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Reject user registration
router.put('/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = db.prepare('SELECT id, first_name, last_name, email, role FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare(`
      UPDATE users 
      SET status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user!.id, userId);

    // Send email alert to the rejected account
    try {
      await sendAccountStatusEmail(user.email, `${user.first_name} ${user.last_name}`, 'rejected', user.role);
    } catch (emailErr) {
      console.error('Failed to send rejection email notification:', emailErr);
    }

    return res.json({ message: `Account for ${user.first_name} ${user.last_name} rejected.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Change user role and department
router.put('/:id/role', (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role, department, position, responsibleArea } = req.body;

    if (userId === req.user!.id && role && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot revoke your own admin rights' });
    }

    db.prepare(`
      UPDATE users 
      SET role = COALESCE(?, role),
          department = COALESCE(?, department),
          position = COALESCE(?, position),
          responsible_area = COALESCE(?, responsible_area),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(role, department, position, responsibleArea, userId);

    return res.json({ message: 'User updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete user account
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }

    const user = db.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    return res.json({ message: `User ${user.first_name} ${user.last_name} deleted successfully` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
