import { Router, Response } from 'express';
import db from '../db.js';
import { authenticate, AuthRequest } from '../auth.js';
import { sendDefectAlertEmail } from '../email.js';

const router = Router();

// Protect all inspection endpoints
router.use(authenticate);

// 1. List inspections with filters (department, year, month, layer)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { department, year, month, layer, search } = req.query;

    let sql = `
      SELECT i.*, d.name_th as department_name_th, d.name_en as department_name_en,
             (SELECT COUNT(*) FROM inspection_items WHERE inspection_id = i.id AND result = 'NO') as defects_count
      FROM inspections i
      LEFT JOIN departments d ON i.department_code = d.code
      WHERE 1=1
    `;
    const params: any[] = [];

    if (department) {
      sql += ' AND i.department_code = ?';
      params.push(department);
    }
    if (year) {
      sql += ' AND i.year = ?';
      params.push(parseInt(year as string, 10));
    }
    if (month) {
      sql += ' AND i.month = ?';
      params.push(parseInt(month as string, 10));
    }
    if (layer) {
      sql += ' AND i.layer = ?';
      params.push(layer);
    }
    if (search) {
      sql += ' AND (i.mc_and_products LIKE ? OR i.auditor_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY i.audit_date DESC, i.id DESC';

    const inspections = db.prepare(sql).all(...params);

    // Summary statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_inspections,
        SUM(total_ok) as grand_total_ok,
        SUM(total_no) as grand_total_no,
        SUM(total_na) as grand_total_na,
        ROUND(AVG(score_percent), 2) as average_score
      FROM inspections
    `).get();

    return res.json({ inspections, stats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get inspection details with all checklist items and photos
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const inspection = db.prepare(`
      SELECT i.*, d.name_th as department_name_th, d.name_en as department_name_en
      FROM inspections i
      LEFT JOIN departments d ON i.department_code = d.code
      WHERE i.id = ?
    `).get(id) as any;

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection record not found' });
    }

    const items = db.prepare(`
      SELECT * FROM inspection_items
      WHERE inspection_id = ?
      ORDER BY id ASC
    `).all(id);

    return res.json({ inspection, items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Save new inspection (ครบถ้วนตามเอกสาร SBOP: แผนก, กะ, วันที่, เครื่องจักร, รายการ OK/NO/NA, รูปภาพ R2, สรุปผล)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      departmentCode,
      year,
      month,
      layer = 'Layer 1',
      shift,
      mcAndProducts,
      auditDate,
      comments = '',
      previousFindings = '',
      items = [],
    } = req.body;

    if (!departmentCode || !year || !month || !shift || !mcAndProducts || !auditDate) {
      return res.status(400).json({ error: 'Please provide all required inspection header fields' });
    }

    // Calculate totals
    let totalOk = 0;
    let totalNo = 0;
    let totalNa = 0;

    for (const item of items) {
      if (item.result === 'OK') totalOk++;
      else if (item.result === 'NO') totalNo++;
      else if (item.result === 'N/A') totalNa++;
    }

    const totalEvaluated = totalOk + totalNo;
    const scorePercent = totalEvaluated > 0 ? Number(((totalOk / totalEvaluated) * 100).toFixed(2)) : 100.0;

    // Use current user's name if not provided
    const auditorName = `${req.user!.firstName} ${req.user!.lastName}`;
    const auditorId = req.user!.id;

    const insertInspection = db.prepare(`
      INSERT INTO inspections (
        department_code, year, month, layer, shift, mc_and_products,
        auditor_id, auditor_name, audit_date, total_ok, total_no, total_na,
        score_percent, status, comments, previous_findings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const insResult = insertInspection.run(
      departmentCode.toUpperCase(),
      parseInt(year, 10),
      parseInt(month, 10),
      layer,
      shift,
      mcAndProducts.trim(),
      auditorId,
      auditorName,
      auditDate,
      totalOk,
      totalNo,
      totalNa,
      scorePercent,
      comments.trim(),
      previousFindings.trim()
    );

    const inspectionId = Number(insResult.lastInsertRowid);

    // Insert items
    const insertItem = db.prepare(`
      INSERT INTO inspection_items (
        inspection_id, template_item_id, layer, category, subcategory,
        question, result, finding_topic, severity, action_plan,
        responsible_person, due_date, image_url, image_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const defectItems: any[] = [];

    const insertMany = db.transaction((rows: any[]) => {
      for (const row of rows) {
        insertItem.run(
          inspectionId,
          row.templateItemId || null,
          row.layer || layer,
          row.category || 'General',
          row.subcategory || null,
          row.question,
          row.result || 'OK',
          row.findingTopic || null,
          row.severity || null,
          row.actionPlan || null,
          row.responsiblePerson || null,
          row.dueDate || null,
          row.imageUrl || null,
          row.imageKey || null
        );

        if (row.result === 'NO') {
          defectItems.push(row);
        }
      }
    });

    insertMany(items);

    // If defects are found (NO), send email notification to administrators and responsible persons!
    if (defectItems.length > 0) {
      try {
        const admins = db.prepare("SELECT email, first_name, last_name FROM users WHERE role = 'admin'").all() as any[];
        
        for (const defect of defectItems) {
          // Send to admins
          for (const admin of admins) {
            await sendDefectAlertEmail(admin.email, `${admin.first_name} ${admin.last_name}`, {
              department: departmentCode,
              auditorName,
              auditDate,
              shift,
              machineProduct: mcAndProducts,
              findingTopic: defect.findingTopic || defect.question,
              severity: defect.severity || 'Minor',
              actionPlan: defect.actionPlan,
              responsiblePerson: defect.responsiblePerson,
              dueDate: defect.dueDate,
              imageUrl: defect.imageUrl,
            });
          }
        }
      } catch (mailErr) {
        console.error('Failed to dispatch defect alert emails:', mailErr);
      }
    }

    return res.status(201).json({
      message: 'Inspection record saved successfully!',
      inspectionId,
      totalOk,
      totalNo,
      totalNa,
      scorePercent,
      defectsFound: defectItems.length,
    });
  } catch (err: any) {
    console.error('Save inspection error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Delete inspection record
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const inspection = db.prepare('SELECT id, auditor_id FROM inspections WHERE id = ?').get(id) as any;

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    // Only admin or the auditor who created it can delete
    if (req.user!.role !== 'admin' && inspection.auditor_id !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this inspection' });
    }

    db.prepare('DELETE FROM inspection_items WHERE inspection_id = ?').run(id);
    db.prepare('DELETE FROM inspections WHERE id = ?').run(id);

    return res.json({ message: 'Inspection deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
