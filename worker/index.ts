import bcrypt from 'bcryptjs';

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  R2_PUBLIC_URL?: string;
  JWT_SECRET?: string;
}

// Helpers for JWT with Web Crypto
const DEFAULT_JWT_SECRET = 'sbop_super_secret_jwt_security_key_2026_d1_r2';

async function signJWT(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 86400 })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${encodedSignature}`;
}

async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert signature from base64url to Uint8Array
    const binarySig = atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
    if (!isValid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 1. Health check
    if (url.pathname === '/api/health') {
      return jsonResponse({
        status: 'ok',
        platform: 'Cloudflare Workers & Assets',
        d1Database: 'd1sbop (413b2fe9-b280-4a1b-81ac-cb20f9e41935)',
        r2Bucket: 'r2sbop',
        r2PublicUrl: env.R2_PUBLIC_URL || 'https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com/r2sbop',
      });
    }

    // 2. Authentication: Helper to extract user
    const jwtSecret = env.JWT_SECRET || DEFAULT_JWT_SECRET;
    const authHeader = request.headers.get('Authorization') || '';
    let currentUser: any = null;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      currentUser = await verifyJWT(token, jwtSecret);
    }

    // --- API ROUTES ---

    // Auth: Login
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const rawInput = (body.email || '').trim().toLowerCase();
        const email = rawInput.includes('@') ? rawInput : `${rawInput}@sbop.com`;
        const password = body.password || '';

        const user: any = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        if (!user) {
          return jsonResponse({ error: 'Invalid email or password' }, 401);
        }

        const isMatch = bcrypt.compareSync(password, user.password_hash);
        if (!isMatch) {
          return jsonResponse({ error: 'Invalid email or password' }, 401);
        }

        if (user.status === 'pending') {
          return jsonResponse({
            error: 'Your account is pending approval from an administrator.',
            status: 'pending',
          }, 403);
        }

        if (user.status === 'rejected') {
          return jsonResponse({
            error: 'Your account has been rejected.',
            status: 'rejected',
          }, 403);
        }

        const token = await signJWT({
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          firstName: user.first_name,
          lastName: user.last_name,
          department: user.department,
        }, jwtSecret);

        return jsonResponse({
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
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // Auth: Register
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      try {
        const body: any = await request.json();
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
        } = body;

        if (!firstName || !lastName || !email || !department || !position || !password) {
          return jsonResponse({ error: 'Please fill in all required fields' }, 400);
        }

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.trim().toLowerCase()).first();
        if (existing) {
          return jsonResponse({ error: 'This email is already registered' }, 409);
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        const result = await env.DB.prepare(`
          INSERT INTO users (
            first_name, last_name, phone, email, department, position,
            responsible_area, role, status, password_hash, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          firstName.trim(),
          lastName.trim(),
          (phone || '').trim(),
          email.trim().toLowerCase(),
          department,
          position.trim(),
          (responsibleArea || '').trim(),
          role,
          passwordHash
        ).run();

        // Record email log
        await env.DB.prepare(`
          INSERT INTO email_logs (recipient_email, recipient_name, subject, body, type, status, sent_at)
          VALUES (?, ?, ?, ?, 'registration_alert', 'sent', CURRENT_TIMESTAMP)
        `).bind(
          'admin@sbop.com',
          'Admin',
          `[SBOP Alert] New user registered: ${firstName} ${lastName}`,
          `New user registered: ${firstName} ${lastName} (${email}) for department ${department}`
        ).run();

        return jsonResponse({
          message: 'Registration successful! Your account is pending admin approval.',
          userId: result.meta?.last_row_id,
          status: 'pending',
        }, 201);
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // Auth: Current User Info
    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const user: any = await env.DB.prepare(`
        SELECT id, first_name, last_name, phone, email, department, position,
               responsible_area, role, status, created_at, updated_at
        FROM users WHERE id = ?
      `).bind(currentUser.id).first();

      if (!user) return jsonResponse({ error: 'User not found' }, 404);

      return jsonResponse({
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
    }

    // Auth: Update Profile
    if (url.pathname === '/api/auth/profile' && request.method === 'PUT') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const body: any = await request.json();
      await env.DB.prepare(`
        UPDATE users 
        SET first_name = ?, last_name = ?, phone = ?, position = ?, responsible_area = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        body.firstName?.trim(),
        body.lastName?.trim(),
        body.phone?.trim(),
        body.position?.trim(),
        body.responsibleArea?.trim(),
        currentUser.id
      ).run();

      return jsonResponse({ message: 'Profile updated successfully' });
    }

    // Auth: Change Password
    if (url.pathname === '/api/auth/change-password' && request.method === 'PUT') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const body: any = await request.json();
      const user: any = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(currentUser.id).first();
      if (!user || !bcrypt.compareSync(body.currentPassword, user.password_hash)) {
        return jsonResponse({ error: 'Current password does not match' }, 400);
      }

      const newHash = bcrypt.hashSync(body.newPassword, 10);
      await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(newHash, currentUser.id).run();
      return jsonResponse({ message: 'Password changed successfully' });
    }

    // Departments
    if (url.pathname === '/api/departments' && request.method === 'GET') {
      const { results } = await env.DB.prepare(`
        SELECT d.*, 
          (SELECT COUNT(*) FROM checklist_templates WHERE department_code = d.code) as total_questions,
          (SELECT COUNT(*) FROM inspections WHERE department_code = d.code) as total_inspections
        FROM departments d
        ORDER BY d.code ASC
      `).all();
      return jsonResponse(results);
    }

    // Checklist Templates
    if (url.pathname.startsWith('/api/checklist/templates/') && request.method === 'GET') {
      const deptCode = url.pathname.split('/')[4]?.toUpperCase() || 'MOLD';
      const layer = url.searchParams.get('layer');

      let sql = `
        SELECT id, department_code, layer, category, subcategory, method, item_order, question_th, question_en, row_in_excel
        FROM checklist_templates
        WHERE department_code = ?
      `;
      const params: any[] = [deptCode];

      if (layer) {
        sql += ' AND layer = ?';
        params.push(layer);
      }

      sql += " ORDER BY CASE layer WHEN 'Layer 1' THEN 1 WHEN 'Layer 2' THEN 2 WHEN 'Layer 3' THEN 3 ELSE 4 END, row_in_excel ASC, item_order ASC";

      const { results } = await env.DB.prepare(sql).bind(...params).all();

      const grouped: Record<string, Record<string, any[]>> = {};
      for (const item of (results || []) as any[]) {
        if (!grouped[item.layer]) grouped[item.layer] = {};
        const cat = item.category || 'General';
        if (!grouped[item.layer][cat]) grouped[item.layer][cat] = [];
        grouped[item.layer][cat].push(item);
      }

      return jsonResponse({
        departmentCode: deptCode,
        total: results?.length || 0,
        items: results,
        grouped,
      });
    }

    // Inspections: List & Create
    if (url.pathname === '/api/inspections') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);

      if (request.method === 'GET') {
        const dept = url.searchParams.get('department');
        const year = url.searchParams.get('year');
        const month = url.searchParams.get('month');
        const layer = url.searchParams.get('layer');

        let sql = `
          SELECT i.*, d.name_th as department_name_th, d.name_en as department_name_en,
                 (SELECT COUNT(*) FROM inspection_items WHERE inspection_id = i.id AND result = 'NO') as defects_count
          FROM inspections i
          LEFT JOIN departments d ON i.department_code = d.code
          WHERE 1=1
        `;
        const params: any[] = [];
        if (dept && dept !== 'all') { sql += ' AND i.department_code = ?'; params.push(dept); }
        if (year && year !== 'all') { sql += ' AND i.year = ?'; params.push(parseInt(year, 10)); }
        if (month && month !== 'all') { sql += ' AND i.month = ?'; params.push(parseInt(month, 10)); }
        if (layer && layer !== 'all') { sql += ' AND i.layer = ?'; params.push(layer); }

        sql += ' ORDER BY i.audit_date DESC, i.id DESC';

        const { results } = await env.DB.prepare(sql).bind(...params).all();

        const stats = await env.DB.prepare(`
          SELECT 
            COUNT(*) as total_inspections,
            SUM(total_ok) as grand_total_ok,
            SUM(total_no) as grand_total_no,
            SUM(total_na) as grand_total_na,
            ROUND(AVG(score_percent), 2) as average_score
          FROM inspections
        `).first();

        return jsonResponse({ inspections: results, stats });
      }

      if (request.method === 'POST') {
        const body: any = await request.json();
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
        } = body;

        let totalOk = 0, totalNo = 0, totalNa = 0;
        for (const item of items) {
          if (item.result === 'OK') totalOk++;
          else if (item.result === 'NO') totalNo++;
          else if (item.result === 'N/A') totalNa++;
        }
        const totalEvaluated = totalOk + totalNo;
        const scorePercent = totalEvaluated > 0 ? Number(((totalOk / totalEvaluated) * 100).toFixed(2)) : 100.0;
        const auditorName = `${currentUser.firstName} ${currentUser.lastName}`;

        const insResult = await env.DB.prepare(`
          INSERT INTO inspections (
            department_code, year, month, layer, shift, mc_and_products,
            auditor_id, auditor_name, audit_date, total_ok, total_no, total_na,
            score_percent, status, comments, previous_findings, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          departmentCode.toUpperCase(),
          parseInt(year, 10),
          parseInt(month, 10),
          layer,
          shift,
          mcAndProducts.trim(),
          currentUser.id,
          auditorName,
          auditDate,
          totalOk,
          totalNo,
          totalNa,
          scorePercent,
          comments.trim(),
          previousFindings.trim()
        ).run();

        const inspectionId = insResult.meta?.last_row_id;

        // Batch insert items
        const itemStmts = [];
        const defectItems: any[] = [];
        for (const row of items) {
          itemStmts.push(
            env.DB.prepare(`
              INSERT INTO inspection_items (
                inspection_id, template_item_id, layer, category, subcategory,
                question, result, finding_topic, severity, action_plan,
                responsible_person, due_date, image_url, image_key, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
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
            )
          );
          if (row.result === 'NO') defectItems.push(row);
        }

        if (itemStmts.length > 0) {
          await env.DB.batch(itemStmts);
        }

        // Email log if defects found
        if (defectItems.length > 0) {
          await env.DB.prepare(`
            INSERT INTO email_logs (recipient_email, recipient_name, subject, body, type, status, related_id, sent_at)
            VALUES (?, ?, ?, ?, 'defect_alert', 'sent', ?, CURRENT_TIMESTAMP)
          `).bind(
            'admin@sbop.com',
            'Safety Admin',
            `[SBOP Defect Alert] Defects found in ${departmentCode} on ${auditDate}`,
            `Inspection ID: ${inspectionId}, Found ${defectItems.length} issues in ${mcAndProducts}`,
            inspectionId
          ).run();
        }

        return jsonResponse({
          message: 'Inspection record saved successfully!',
          inspectionId,
          totalOk,
          totalNo,
          totalNa,
          scorePercent,
          defectsFound: defectItems.length,
        }, 201);
      }
    }

    // Inspections: Detail & Delete
    if (url.pathname.startsWith('/api/inspections/')) {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const id = parseInt(url.pathname.split('/')[3], 10);

      if (request.method === 'GET') {
        const inspection = await env.DB.prepare(`
          SELECT i.*, d.name_th as department_name_th, d.name_en as department_name_en
          FROM inspections i
          LEFT JOIN departments d ON i.department_code = d.code
          WHERE i.id = ?
        `).bind(id).first();

        if (!inspection) return jsonResponse({ error: 'Inspection not found' }, 404);

        const { results: items } = await env.DB.prepare(`
          SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY id ASC
        `).bind(id).all();

        return jsonResponse({ inspection, items });
      }

      if (request.method === 'DELETE') {
        await env.DB.prepare('DELETE FROM inspection_items WHERE inspection_id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM inspections WHERE id = ?').bind(id).run();
        return jsonResponse({ message: 'Inspection deleted successfully' });
      }
    }

    // Photo Upload directly to Cloudflare R2 bucket: r2sbop
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      try {
        if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);

        const formData = await request.formData();
        const file = formData.get('image') as File;
        if (!file) return jsonResponse({ error: 'No image uploaded' }, 400);

        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = file.name.substring(file.name.lastIndexOf('.')) || '.jpg';
        const key = `defects/${timestamp}_${random}${ext}`;

        const buffer = await file.arrayBuffer();

        // Upload to Cloudflare R2
        await env.R2_BUCKET.put(key, buffer, {
          httpMetadata: { contentType: file.type || 'image/jpeg' },
        });

        const r2PublicBase = env.R2_PUBLIC_URL || 'https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com/r2sbop';
        const imageUrl = `${r2PublicBase}/${key}`;

        return jsonResponse({
          message: 'Image uploaded successfully to Cloudflare R2',
          imageUrl,
          imageKey: key,
          storage: 'r2',
        });
      } catch (err: any) {
        return jsonResponse({ error: 'R2 Upload failed: ' + err.message }, 500);
      }
    }

    // Admin: Users List & Management
    if (url.pathname === '/api/users' && request.method === 'GET') {
      if (!currentUser || currentUser.role !== 'admin') return jsonResponse({ error: 'Forbidden' }, 403);
      const status = url.searchParams.get('status');
      const dept = url.searchParams.get('department');
      const search = url.searchParams.get('search');

      let sql = `
        SELECT id, first_name, last_name, phone, email, department, position,
               responsible_area, role, status, approved_at, created_at, updated_at
        FROM users WHERE 1=1
      `;
      const params: any[] = [];
      if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
      if (dept && dept !== 'all') { sql += ' AND department = ?'; params.push(dept); }
      if (search) {
        sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR position LIKE ?)';
        const t = `%${search}%`;
        params.push(t, t, t, t);
      }

      sql += " ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, created_at DESC";

      const { results: users } = await env.DB.prepare(sql).bind(...params).all();
      const counts = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM users
      `).first();

      return jsonResponse({ users, counts });
    }

    // Admin: Approve User
    if (url.pathname.match(/^\/api\/users\/\d+\/approve$/) && request.method === 'PUT') {
      if (!currentUser || currentUser.role !== 'admin') return jsonResponse({ error: 'Forbidden' }, 403);
      const userId = parseInt(url.pathname.split('/')[3], 10);
      const targetUser: any = await env.DB.prepare('SELECT first_name, last_name, email FROM users WHERE id = ?').bind(userId).first();
      if (!targetUser) return jsonResponse({ error: 'User not found' }, 404);

      await env.DB.prepare(`
        UPDATE users 
        SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(currentUser.id, userId).run();

      // Log email
      await env.DB.prepare(`
        INSERT INTO email_logs (recipient_email, recipient_name, subject, body, type, status, sent_at)
        VALUES (?, ?, ?, ?, 'approval_status', 'sent', CURRENT_TIMESTAMP)
      `).bind(
        targetUser.email,
        `${targetUser.first_name} ${targetUser.last_name}`,
        '[SBOP] Account Approved',
        `Your SBOP account has been approved by admin.`
      ).run();

      return jsonResponse({ message: `Account approved successfully!` });
    }

    // Admin: Reject User
    if (url.pathname.match(/^\/api\/users\/\d+\/reject$/) && request.method === 'PUT') {
      if (!currentUser || currentUser.role !== 'admin') return jsonResponse({ error: 'Forbidden' }, 403);
      const userId = parseInt(url.pathname.split('/')[3], 10);
      await env.DB.prepare(`
        UPDATE users 
        SET status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(currentUser.id, userId).run();
      return jsonResponse({ message: 'Account rejected' });
    }

    // Admin: Change Role
    if (url.pathname.match(/^\/api\/users\/\d+\/role$/) && request.method === 'PUT') {
      if (!currentUser || currentUser.role !== 'admin') return jsonResponse({ error: 'Forbidden' }, 403);
      const userId = parseInt(url.pathname.split('/')[3], 10);
      const body: any = await request.json();
      await env.DB.prepare(`
        UPDATE users 
        SET role = COALESCE(?, role),
            department = COALESCE(?, department),
            position = COALESCE(?, position),
            responsible_area = COALESCE(?, responsible_area),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(body.role || null, body.department || null, body.position || null, body.responsibleArea || null, userId).run();

      return jsonResponse({ message: 'User role updated' });
    }

    // Admin: Delete User
    if (url.pathname.match(/^\/api\/users\/\d+$/) && request.method === 'DELETE') {
      if (!currentUser || currentUser.role !== 'admin') return jsonResponse({ error: 'Forbidden' }, 403);
      const userId = parseInt(url.pathname.split('/')[3], 10);
      if (userId === currentUser.id) return jsonResponse({ error: 'Cannot delete own account' }, 400);

      await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
      return jsonResponse({ message: 'User deleted successfully' });
    }

    // Email Logs
    if (url.pathname === '/api/email/logs' && request.method === 'GET') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const { results } = await env.DB.prepare('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100').all();
      return jsonResponse(results);
    }

    // Email: Send Custom Alert
    if (url.pathname === '/api/email/send-alert' && request.method === 'POST') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const body: any = await request.json();
      const { to, toName, subject, message, inspectionId } = body;

      await env.DB.prepare(`
        INSERT INTO email_logs (recipient_email, recipient_name, subject, body, type, status, related_id, sent_at)
        VALUES (?, ?, ?, ?, 'manual_reminder', 'sent', ?, CURRENT_TIMESTAMP)
      `).bind(to, toName || to, subject, message, inspectionId || null).run();

      return jsonResponse({ message: 'Notification email dispatched successfully!' });
    }

    // 3. Fallback: Serve static Frontend Assets from ./dist (SPA)
    return env.ASSETS.fetch(request);
  },
};
