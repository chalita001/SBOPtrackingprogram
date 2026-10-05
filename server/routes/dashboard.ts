import { Router, Response } from 'express';
import db from '../db.js';
import { authenticate, requireAdmin, AuthRequest } from '../auth.js';

const router = Router();

// Executive Dashboard Statistics (Visible to all users & guests)
router.get('/stats', (req: any, res: Response) => {
  try {
    const { year, month, department } = req.query;

    let filterSql = ' WHERE 1=1';
    const filterParams: any[] = [];
    if (year && year !== 'all') { filterSql += ' AND year = ?'; filterParams.push(parseInt(year as string, 10)); }
    if (month && month !== 'all') { filterSql += ' AND month = ?'; filterParams.push(parseInt(month as string, 10)); }
    if (department && department !== 'all') { filterSql += ' AND department_code = ?'; filterParams.push(department); }

    // 1. Overall stats
    const overall = db.prepare(`
      SELECT 
        COUNT(*) as total_inspections,
        COALESCE(ROUND(AVG(score_percent), 1), 100.0) as average_score,
        COALESCE(SUM(total_ok), 0) as total_ok,
        COALESCE(SUM(total_no), 0) as total_no,
        COALESCE(SUM(total_na), 0) as total_na,
        COUNT(DISTINCT auditor_id) as active_auditors,
        COUNT(DISTINCT department_code) as active_departments
      FROM inspections ${filterSql}
    `).get(...filterParams);

    // 2. Department Breakdown
    const deptStats = db.prepare(`
      SELECT 
        d.code,
        d.name_th,
        d.name_en,
        COUNT(i.id) as inspections_count,
        COALESCE(ROUND(AVG(i.score_percent), 1), 0) as average_score,
        COALESCE(SUM(i.total_ok), 0) as total_ok,
        COALESCE(SUM(i.total_no), 0) as total_no,
        COUNT(DISTINCT i.auditor_id) as auditor_count
      FROM departments d
      LEFT JOIN inspections i ON d.code = i.department_code ${year && year !== 'all' ? `AND i.year = ${parseInt(year as string, 10)}` : ''} ${month && month !== 'all' ? `AND i.month = ${parseInt(month as string, 10)}` : ''}
      GROUP BY d.code, d.name_th, d.name_en
      ORDER BY d.code ASC
    `).all();

    // 3. Layer Breakdown
    const layerStats = db.prepare(`
      SELECT 
        layer,
        COUNT(*) as count,
        COALESCE(ROUND(AVG(score_percent), 1), 0) as average_score,
        COALESCE(SUM(total_no), 0) as defects_count
      FROM inspections ${filterSql}
      GROUP BY layer
      ORDER BY layer ASC
    `).all(...filterParams);

    // 4. Recent Defects (with images)
    const recentDefects = db.prepare(`
      SELECT 
        ii.id, ii.inspection_id, ii.question, ii.finding_topic, ii.severity,
        ii.action_plan, ii.responsible_person, ii.due_date, ii.image_url, ii.layer,
        i.department_code, i.inspection_code, i.audit_date, i.mc_and_products, i.auditor_name
      FROM inspection_items ii
      JOIN inspections i ON ii.inspection_id = i.id
      WHERE ii.result = 'NO' ${year && year !== 'all' ? `AND i.year = ${parseInt(year as string, 10)}` : ''} ${month && month !== 'all' ? `AND i.month = ${parseInt(month, 10)}` : ''}
      ORDER BY ii.id DESC
      LIMIT 10
    `).all();

    // 5. Total system users count
    const userCounts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'layer1' OR role = 'leader' OR role = 'inspector' THEN 1 ELSE 0 END) as layer1_users,
        SUM(CASE WHEN role = 'layer2' OR role = 'supervisor' THEN 1 ELSE 0 END) as layer2_users,
        SUM(CASE WHEN role = 'layer3' OR role = 'manager' THEN 1 ELSE 0 END) as layer3_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users
      FROM users
    `).get();

    return res.json({
      overall,
      deptStats,
      layerStats,
      recentDefects,
      userCounts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
