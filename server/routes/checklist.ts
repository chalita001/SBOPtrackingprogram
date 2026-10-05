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

// Create new template item (Superadmin or Admin)
router.post('/templates', (req, res: Response) => {
  try {
    const {
      departmentCode,
      department_code,
      layer = 'Layer 1',
      category = 'General',
      subcategory = '',
      method = 'สังเกตและตรวจสอบ',
      itemOrder,
      item_order,
      questionTh,
      question_th,
      questionEn,
      question_en,
    } = req.body;

    const dept = (departmentCode || department_code || '').trim().toUpperCase();
    const qTh = (questionTh || question_th || '').trim();
    const qEn = (questionEn || question_en || '').trim() || qTh;

    if (!dept || !qTh) {
      return res.status(400).json({ error: 'Department and Question (Thai) are required' });
    }

    let order = parseInt(itemOrder || item_order, 10);
    if (isNaN(order) || order <= 0) {
      const maxRow: any = db.prepare(
        'SELECT MAX(item_order) as max_order FROM checklist_templates WHERE department_code = ? AND layer = ?'
      ).get(dept, layer);
      order = (maxRow?.max_order || 0) + 1;
    }

    const stmt = db.prepare(`
      INSERT INTO checklist_templates (
        department_code, layer, category, subcategory, method, item_order, question_th, question_en, row_in_excel, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(dept, layer, category, subcategory, method, order, qTh, qEn, order);

    return res.status(201).json({
      success: true,
      message: 'เพิ่มข้อตรวจเช็คเรียบร้อยแล้ว',
      id: Number(result.lastInsertRowid),
      item: {
        id: Number(result.lastInsertRowid),
        department_code: dept,
        layer,
        category,
        subcategory,
        method,
        item_order: order,
        question_th: qTh,
        question_en: qEn,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create checklist item: ' + err.message });
  }
});

// Update template item (Superadmin or Admin)
router.put('/templates/:id', (req, res: Response) => {
  try {
    const { id } = req.params;
    const existing: any = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'ไม่พบข้อตรวจเช็คนี้' });
    }

    const {
      departmentCode,
      department_code,
      layer = existing.layer,
      category = existing.category,
      subcategory = existing.subcategory,
      method = existing.method,
      itemOrder,
      item_order,
      questionTh,
      question_th,
      questionEn,
      question_en,
    } = req.body;

    const dept = (departmentCode || department_code || existing.department_code).trim().toUpperCase();
    const qTh = (questionTh !== undefined || question_th !== undefined)
      ? String(questionTh || question_th).trim()
      : existing.question_th;
    const qEn = (questionEn !== undefined || question_en !== undefined)
      ? String(questionEn || question_en).trim()
      : existing.question_en;
    const order = (itemOrder !== undefined || item_order !== undefined)
      ? parseInt(itemOrder || item_order, 10)
      : existing.item_order;

    db.prepare(`
      UPDATE checklist_templates
      SET department_code = ?,
          layer = ?,
          category = ?,
          subcategory = ?,
          method = ?,
          item_order = ?,
          question_th = ?,
          question_en = ?,
          row_in_excel = ?
      WHERE id = ?
    `).run(dept, layer, category, subcategory, method, order, qTh, qEn, order, id);

    return res.json({
      success: true,
      message: 'แก้ไขข้อตรวจเช็คเรียบร้อยแล้ว'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update checklist item: ' + err.message });
  }
});

// Delete template item (Superadmin or Admin)
router.delete('/templates/:id', (req, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM checklist_templates WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'ไม่พบข้อตรวจเช็คนี้' });
    }

    db.prepare('DELETE FROM checklist_templates WHERE id = ?').run(id);

    return res.json({
      success: true,
      message: 'ลบข้อตรวจเช็คเรียบร้อยแล้ว'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete checklist item: ' + err.message });
  }
});

export default router;
