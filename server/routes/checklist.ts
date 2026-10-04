import { Router, Response } from 'express';
import db from '../db.js';

const router = Router();

// Get checklist questions for a specific department and optional layer
router.get('/templates/:deptCode', (req, res: Response) => {
  try {
    const { deptCode } = req.params;
    const { layer } = req.query;

    let sql = `
      SELECT id, department_code, layer, category, subcategory, method, item_order, question_th, question_en, row_in_excel
      FROM checklist_templates
      WHERE department_code = ?
    `;
    const params: any[] = [deptCode.toUpperCase()];

    if (layer) {
      sql += ' AND layer = ?';
      params.push(layer);
    }

    sql += " ORDER BY CASE layer WHEN 'Layer 1' THEN 1 WHEN 'Layer 2' THEN 2 WHEN 'Layer 3' THEN 3 ELSE 4 END, row_in_excel ASC, item_order ASC";

    const items = db.prepare(sql).all(...params);

    // Group items by Layer and then Category for structured display
    const grouped: Record<string, Record<string, any[]>> = {};

    for (const item of items as any[]) {
      if (!grouped[item.layer]) {
        grouped[item.layer] = {};
      }
      const cat = item.category || 'General';
      if (!grouped[item.layer][cat]) {
        grouped[item.layer][cat] = [];
      }
      grouped[item.layer][cat].push(item);
    }

    return res.json({
      departmentCode: deptCode.toUpperCase(),
      total: items.length,
      items,
      grouped,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
