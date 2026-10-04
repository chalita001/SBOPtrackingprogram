import { Router, Response } from 'express';
import db from '../db.js';
import { authenticate, AuthRequest } from '../auth.js';

const router = Router();
router.use(authenticate);

// Get recent inspections for previous layers (for Layer 2 and Layer 3 verification)
export function getRecentLayerInspections(deptCode: string, year: number, month: number) {
  // Get latest Layer 1 inspection
  const layer1 = db.prepare(`
    SELECT i.*, 
      (SELECT COUNT(*) FROM inspection_items WHERE inspection_id = i.id AND result = 'NO') as defects_count
    FROM inspections i
    WHERE department_code = ? AND year = ? AND month = ? AND layer = 'Layer 1'
    ORDER BY audit_date DESC, id DESC
    LIMIT 1
  `).get(deptCode, year, month) as any;

  let layer1Items: any[] = [];
  if (layer1) {
    layer1Items = db.prepare(`
      SELECT * FROM inspection_items WHERE inspection_id = ?
    `).all(layer1.id);
  }

  // Get latest Layer 2 inspection
  const layer2 = db.prepare(`
    SELECT i.*, 
      (SELECT COUNT(*) FROM inspection_items WHERE inspection_id = i.id AND result = 'NO') as defects_count
    FROM inspections i
    WHERE department_code = ? AND year = ? AND month = ? AND layer = 'Layer 2'
    ORDER BY audit_date DESC, id DESC
    LIMIT 1
  `).get(deptCode, year, month) as any;

  let layer2Items: any[] = [];
  if (layer2) {
    layer2Items = db.prepare(`
      SELECT * FROM inspection_items WHERE inspection_id = ?
    `).all(layer2.id);
  }

  return {
    layer1: layer1 ? { ...layer1, items: layer1Items } : null,
    layer2: layer2 ? { ...layer2, items: layer2Items } : null,
  };
}
