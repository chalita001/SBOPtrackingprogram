import { Router, Response } from 'express';
import db from '../db.js';

const router = Router();

// Get all departments
router.get('/', (_req, res: Response) => {
  try {
    const departments = db.prepare(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM checklist_templates WHERE department_code = d.code) as total_questions,
        (SELECT COUNT(*) FROM inspections WHERE department_code = d.code) as total_inspections
      FROM departments d
      ORDER BY d.code ASC
    `).all();

    return res.json(departments);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
