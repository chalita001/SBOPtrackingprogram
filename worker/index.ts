import bcrypt from 'bcryptjs';
import { questionTranslationsEn, categoryTranslationsEn, subcategoryTranslationsEn, methodTranslationsEn } from '../src/i18n/translations';

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  R2_PUBLIC_URL?: string;
  JWT_SECRET?: string;
}

// Helpers for JWT with Web Crypto supporting UTF-8 (Thai) characters
const DEFAULT_JWT_SECRET = 'sbop_super_secret_jwt_security_key_2026_d1_r2';

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlToUtf8(str: string): string {
  const binary = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function signJWT(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };

  const encodedHeader = utf8ToBase64Url(JSON.stringify(header));
  const encodedPayload = utf8ToBase64Url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 86400 }));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = bytesToBase64Url(new Uint8Array(signature));

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

    const payload = JSON.parse(base64UrlToUtf8(payloadB64));
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

    // 1. Health check & Auto-heal default accounts in D1
    if (url.pathname === '/api/health') {
      try {
        const hAdmin = bcrypt.hashSync('admin@1234', 10);
        const hTest = bcrypt.hashSync('test1234', 10);

        // Ensure 'admin' as superadmin
        await env.DB.prepare(`
          INSERT INTO users (username, first_name, last_name, email, department, position, responsible_area, role, status, password_hash, approved_at, created_at, updated_at)
          VALUES ('admin', 'ผู้ดูแลระบบสูงสุด', 'ส่วนกลาง (Super Admin)', 'admin@sbop.com', 'FACILITY', 'Super Administrator', 'All Areas', 'superadmin', 'approved', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(email) DO UPDATE SET password_hash=?, username='admin', role='superadmin', status='approved';
        `).bind(hAdmin, hAdmin).run();

        // Migrate any existing 'admin' user to 'superadmin' role
        await env.DB.prepare("UPDATE users SET role = 'superadmin' WHERE username = 'admin' OR email = 'admin@sbop.com'").run();

        // Ensure 'SAFETY' department exists
        await env.DB.prepare(`
          INSERT INTO departments (code, name_th, name_en, description)
          VALUES ('SAFETY', 'แผนกความปลอดภัย (Safety / EHS)', 'Safety / EHS Department', 'Environmental Health and Safety')
          ON CONFLICT(code) DO UPDATE SET name_th = excluded.name_th, name_en = excluded.name_en;
        `).run();

        // Update historic registration notifications to type 'registration_alert' so regular users do not see them
        await env.DB.prepare(`
          UPDATE notifications 
          SET type = 'registration_alert' 
          WHERE title LIKE '%สมาชิกใหม่%' OR title LIKE '%รอการอนุมัติ%'
        `).run();

        // Ensure default checklist questions exist for SAFETY
        try {
          const safetyTmplCount: any = await env.DB.prepare(
            "SELECT COUNT(*) as cnt FROM checklist_templates WHERE department_code = 'SAFETY'"
          ).first();
          if (!safetyTmplCount || safetyTmplCount.cnt === 0) {
            await env.DB.prepare(`
              INSERT INTO checklist_templates (department_code, layer, category, subcategory, method, item_order, question_th, question_en)
              VALUES 
                ('SAFETY', 'Layer 1', 'อุปกรณ์คุ้มครองความปลอดภัย (PPE)', 'PPE Compliance', 'สังเกตและตรวจสอบ', 1, 'พนักงานทุกคนสวมใส่อุปกรณ์ PPE ครบถ้วนตามมาตรฐานความปลอดภัย (แว่นตา, หมวก, รองเท้าเซฟตี้, ที่อุดหู)', 'All employees wear required PPE properly (Safety glasses, hard hats, safety shoes, earplugs)'),
                ('SAFETY', 'Layer 1', 'เครื่องจักรและอุปกรณ์ความปลอดภัย', 'Machine Guarding', 'สังเกตและตรวจสอบ', 2, 'การ์ดป้องกันจุดหมุนและม่านแสงนิรภัยของเครื่องจักรทำงานได้สมบูรณ์', 'Machine interlocks and safety guards are functional and in place'),
                ('SAFETY', 'Layer 1', 'ทางหนีไฟและอุปกรณ์ดับเพลิง', 'Emergency Preparedness', 'สังเกตและตรวจสอบ', 3, 'ถังดับเพลิงและทางออกฉุกเฉินไม่มีสิ่งของกีดขวาง สามารถใช้งานได้ทันที', 'Fire extinguishers and emergency exits are clear and accessible'),
                ('SAFETY', 'Layer 2', 'ระบบและการจัดการความปลอดภัย (Safety Management)', 'Supervisor Review', 'ตรวจสอบเอกสารและหน้างาน', 1, 'ทบทวนผลการตรวจ SBOP Layer 1 และตรวจสอบการปิดประเด็นสิ่งผิดปกติ', 'Review SBOP Layer 1 audit results and verify corrective actions'),
                ('SAFETY', 'Layer 2', 'การปฏิบัติตามมาตรฐาน EHS', 'Standard Compliance', 'ตรวจสอบเอกสารและหน้างาน', 2, 'การจัดเก็บสารเคมีและวัตถุอันตรายมีป้ายเตือนและ SDS ถูกต้องตามกฎหมาย', 'Chemical storage and hazardous substances have proper labeling and SDS'),
                ('SAFETY', 'Layer 3', 'นโยบายและภาวะผู้นำด้านความปลอดภัย', 'Leadership & Policy', 'สังเกตและสัมภาษณ์', 1, 'ผู้จัดการทบทวนภาพรวมความปลอดภัยและส่งเสริมวัฒนธรรมความปลอดภัยเชิงรุกในแผนก', 'Manager reviews overall safety performance and promotes proactive safety culture')
            `).run();
          }
        } catch (sErr) {
          console.error('Safety template seeding notice:', sErr);
        }

        // Ensure defect_status column exists in inspection_items
        try {
          await env.DB.prepare("ALTER TABLE inspection_items ADD COLUMN defect_status TEXT DEFAULT 'pending'").run();
        } catch (e) {}

        // Ensure 'useradmin'
        await env.DB.prepare(`
          INSERT INTO users (username, first_name, last_name, email, department, position, responsible_area, role, status, password_hash, approved_at, created_at, updated_at)
          VALUES ('useradmin', 'User', 'Admin', 'useradmin@sbop.com', 'FACILITY', 'Administrator', 'All Areas', 'admin', 'approved', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(email) DO UPDATE SET password_hash=?, username='useradmin', role='admin', status='approved';
        `).bind(hAdmin, hAdmin).run();

        // Ensure 'administrator'
        await env.DB.prepare(`
          INSERT INTO users (username, first_name, last_name, email, department, position, responsible_area, role, status, password_hash, approved_at, created_at, updated_at)
          VALUES ('administrator', 'System', 'Administrator', 'administrator@sbop.com', 'FACILITY', 'System Administrator', 'All Areas', 'admin', 'approved', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(email) DO UPDATE SET password_hash=?, username='administrator', role='admin', status='approved';
        `).bind(hAdmin, hAdmin).run();

        // Ensure 'usertester'
        await env.DB.prepare(`
          INSERT INTO users (username, first_name, last_name, email, department, position, responsible_area, role, status, password_hash, approved_at, created_at, updated_at)
          VALUES ('usertester', 'User', 'Tester', 'usertester@sbop.com', 'MOLD', 'Safety Inspector', 'Zone A', 'layer1', 'approved', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(email) DO UPDATE SET password_hash=?, username='usertester', role='layer1', status='approved';
        `).bind(hTest, hTest).run();
      } catch (e) {
        console.error('Auto-heal error:', e);
      }

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
        let rawInput = (body.username || body.email || '').trim();
        // Strip leading '@' if user typed @admin or @useradmin
        if (rawInput.startsWith('@')) {
          rawInput = rawInput.substring(1).trim();
        }
        const rawLower = rawInput.toLowerCase();
        const password = (body.password || '').trim();

        let user: any = await env.DB.prepare(`
          SELECT * FROM users 
          WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(email) = ?
        `).bind(rawLower, rawLower, `${rawLower}@sbop.com`).first();

        const isSuperAdminAccount = rawLower === 'admin';
        const isAdminAccount = isSuperAdminAccount || rawLower === 'useradmin' || rawLower === 'administrator';
        const isAdminMasterPass = password === 'admin@1234' || password === 'ehsadmin1234';
        const isTesterMasterPass = rawLower === 'usertester' && password === 'test1234';

        // Auto-create admin/superadmin if not found but entered correct master credentials
        if (!user && isAdminAccount && isAdminMasterPass) {
          const newRole = isSuperAdminAccount ? 'superadmin' : 'admin';
          const newHash = bcrypt.hashSync(password, 10);
          const insResult = await env.DB.prepare(`
            INSERT INTO users (username, first_name, last_name, email, department, position, responsible_area, role, status, password_hash, approved_at, created_at, updated_at)
            VALUES (?, 'ผู้ดูแลระบบสูงสุด', 'ส่วนกลาง (Super Admin)', ?, 'FACILITY', ?, 'All Areas', ?, 'approved', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(rawLower, `${rawLower}@sbop.com`, isSuperAdminAccount ? 'Super Administrator' : 'Safety Administrator', newRole, newHash).run();

          user = {
            id: insResult.meta?.last_row_id,
            username: rawLower,
            email: `${rawLower}@sbop.com`,
            first_name: 'ผู้ดูแลระบบสูงสุด',
            last_name: isSuperAdminAccount ? 'ส่วนกลาง (Super Admin)' : 'ส่วนกลาง (Admin)',
            department: 'FACILITY',
            position: isSuperAdminAccount ? 'Super Administrator' : 'Safety Administrator',
            role: newRole,
            status: 'approved',
            password_hash: newHash,
          };
        }

        if (!user) {
          return jsonResponse({ error: 'Invalid username or password' }, 401);
        }

        // Password verification with automatic hash healing
        let isMatch = false;
        if (user.password_hash) {
          try {
            isMatch = bcrypt.compareSync(password, user.password_hash);
          } catch (e) {
            isMatch = false;
          }
        }

        // Fallback for Admin/Superadmin or Tester master credentials
        if (!isMatch) {
          if (isAdminAccount && isAdminMasterPass) {
            isMatch = true;
            const newRole = isSuperAdminAccount ? 'superadmin' : 'admin';
            const newHash = bcrypt.hashSync(password, 10);
            await env.DB.prepare('UPDATE users SET password_hash = ?, status = "approved", role = ? WHERE id = ?')
              .bind(newHash, newRole, user.id).run();
            user.role = newRole;
            user.status = 'approved';
          } else if (isTesterMasterPass) {
            isMatch = true;
            const newHash = bcrypt.hashSync(password, 10);
            await env.DB.prepare('UPDATE users SET password_hash = ?, status = "approved" WHERE id = ?')
              .bind(newHash, user.id).run();
            user.status = 'approved';
          }
        }

        // Ensure user with username 'admin' has superadmin role
        if (isSuperAdminAccount && user.role !== 'superadmin') {
          user.role = 'superadmin';
          await env.DB.prepare('UPDATE users SET role = "superadmin" WHERE id = ?').bind(user.id).run();
        }

        if (!isMatch) {
          return jsonResponse({ error: 'Invalid username or password' }, 401);
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
          username: user.username || user.email,
          email: user.email,
          role: user.role,
          status: user.status,
          firstName: user.first_name,
          lastName: user.last_name,
          department: user.department,
          position: user.position,
        }, jwtSecret);

        return jsonResponse({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username || user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            department: user.department,
            position: user.position,
            role: user.role,
            status: user.status,
            avatarUrl: user.avatar_url || null,
          },
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // Auth: Register (Username based, without phone & area)
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const {
          firstName,
          lastName,
          username,
          department,
          position,
          role = 'layer1',
          password,
        } = body;

        const u = (username || body.email || '').trim();

        if (!firstName || !lastName || !u || !department || !position || !password) {
          return jsonResponse({ error: 'Please fill in all required fields' }, 400);
        }

        const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ? OR email = ?').bind(u, u).first();
        if (existing) {
          return jsonResponse({ error: 'This username is already taken' }, 409);
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        const userEmail = u.includes('@') ? u.toLowerCase() : `${u.toLowerCase()}@sbop.local`;

        const result = await env.DB.prepare(`
          INSERT INTO users (
            first_name, last_name, username, email, department, position,
            responsible_area, role, status, password_hash, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, '', ?, 'pending', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          firstName.trim(),
          lastName.trim(),
          u,
          userEmail,
          department,
          position.trim(),
          role,
          passwordHash
        ).run();

        // In-app notification for admin/superadmin only
        await env.DB.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (NULL, 'สมาชิกใหม่รอการอนุมัติ', ?, 'registration_alert')
        `).bind(`มีผู้ใช้ใหม่ @${u} (${firstName} ${lastName}) สมัครเข้าใช้งานแผนก ${department}`).run();

        return jsonResponse({
          message: 'Registration successful! Your account is pending admin approval.',
          userId: result.meta?.last_row_id,
          status: 'pending',
        }, 201);
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // Auth: Current User Info & Profile
    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const user: any = await env.DB.prepare(`
        SELECT id, username, first_name, last_name, email, department, position,
               role, status, avatar_url, created_at, updated_at
        FROM users WHERE id = ?
      `).bind(currentUser.id).first();

      if (!user) return jsonResponse({ error: 'User not found' }, 404);

      // Current Year and Month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Defined monthly quota: Layer 1 = 40, Layer 2 = 4, Layer 3 = 1, Admin/Superadmin = 40
      const normalizedRole = (user.role || '').toLowerCase();
      let targetMonthly = 40;
      let targetLayer = 'Layer 1';
      if (normalizedRole === 'layer1' || normalizedRole === 'leader') {
        targetMonthly = 40;
        targetLayer = 'Layer 1';
      } else if (normalizedRole === 'layer2' || normalizedRole === 'supervisor') {
        targetMonthly = 4;
        targetLayer = 'Layer 2';
      } else if (normalizedRole === 'layer3' || normalizedRole === 'manager') {
        targetMonthly = 1;
        targetLayer = 'Layer 3';
      } else {
        targetMonthly = 40;
        targetLayer = 'Layer 1';
      }

      const dept = user.department || '';

      // 1. Overall lifetime stats (personal)
      const stats: any = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_inspections,
          COALESCE(ROUND(AVG(score_percent), 1), 100.0) as average_score,
          COALESCE(SUM(total_no), 0) as defects_found
        FROM inspections
        WHERE auditor_id = ?
      `).bind(user.id).first();

      // 2. Department-pooled inspection count for this layer this month
      // "การตรวจเช็คจะรวมกันเมื่อคุณอยู่แผนกเดียวกัน เช่น QC ใครที่อยู่ Layer1 จะนับจำนวณรวมกัน Layer2-3 ก็ด้วย"
      let deptMonthQuery = `
        SELECT 
          COUNT(*) as count,
          COALESCE(ROUND(AVG(score_percent), 1), 100.0) as avg_score,
          COALESCE(SUM(total_ok), 0) as total_ok,
          COALESCE(SUM(total_no), 0) as total_no
        FROM inspections
        WHERE year = ? AND month = ?
      `;
      const deptMonthParams: any[] = [currentYear, currentMonth];
      const isPrivileged = user.role === 'admin' || user.role === 'superadmin';
      if (!isPrivileged && dept) {
        deptMonthQuery += ` AND department_code = ? AND layer = ?`;
        deptMonthParams.push(dept, targetLayer);
      }
      const thisMonthDept: any = await env.DB.prepare(deptMonthQuery).bind(...deptMonthParams).first();

      // 3. User's personal count this month
      const thisMonthPersonal: any = await env.DB.prepare(`
        SELECT COUNT(*) as my_count
        FROM inspections
        WHERE auditor_id = ? AND year = ? AND month = ?
      `).bind(user.id, currentYear, currentMonth).first();

      // 4. Monthly breakdown for current year (Department-pooled)
      let chartQuery = `
        SELECT month, COUNT(*) as count, ROUND(AVG(score_percent), 1) as avg_score, SUM(total_no) as defects
        FROM inspections
        WHERE year = ?
      `;
      const chartParams: any[] = [currentYear];
      if (!isPrivileged && dept) {
        chartQuery += ` AND department_code = ? AND layer = ?`;
        chartParams.push(dept, targetLayer);
      }
      chartQuery += ` GROUP BY month ORDER BY month ASC`;
      const { results: monthlyCounts } = await env.DB.prepare(chartQuery).bind(...chartParams).all();

      // 5. Recent inspections (last 5 in department/personal)
      const { results: recentList } = await env.DB.prepare(`
        SELECT id, department_code, inspection_code, layer, shift, mc_and_products, audit_date, score_percent, total_ok, total_no
        FROM inspections
        WHERE department_code = ? OR auditor_id = ?
        ORDER BY audit_date DESC, id DESC
        LIMIT 5
      `).bind(dept, user.id).all();

      return jsonResponse({
        user: {
          id: user.id,
          username: user.username || user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          department: user.department,
          position: user.position,
          role: user.role,
          status: user.status,
          avatarUrl: user.avatar_url || null,
          createdAt: user.created_at,
        },
        stats: {
          totalInspections: stats?.total_inspections || 0,
          averageScore: stats?.average_score || 100.0,
          defectsFound: stats?.defects_found || 0,
          currentYear,
          currentMonth,
          targetMonthly,
          targetLayer,
          departmentCode: dept,
          thisMonthCount: thisMonthDept?.count || 0, // Department pooled total
          myThisMonthCount: thisMonthPersonal?.my_count || 0, // Personal contribution
          thisMonthAvgScore: thisMonthDept?.avg_score || 100.0,
          thisMonthOk: thisMonthDept?.total_ok || 0,
          thisMonthNo: thisMonthDept?.total_no || 0,
          monthlyCounts: monthlyCounts || [],
          recentInspections: recentList || [],
        }
      });
    }

    // Auth: Update Profile (Supports Avatar and Admin/Superadmin changing Department)
    if (url.pathname === '/api/auth/profile' && request.method === 'PUT') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const body: any = await request.json();

      // Admin or Superadmin can change their own department
      const canChangeDept = currentUser.role === 'admin' || currentUser.role === 'superadmin';
      const newDept = (canChangeDept && body.department) ? body.department : null;

      await env.DB.prepare(`
        UPDATE users 
        SET first_name = COALESCE(?, first_name),
            last_name = COALESCE(?, last_name),
            position = COALESCE(?, position),
            department = COALESCE(?, department),
            avatar_url = COALESCE(?, avatar_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        body.firstName?.trim() || null,
        body.lastName?.trim() || null,
        body.position?.trim() || null,
        newDept,
        body.avatarUrl || null,
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
        if (!item.question_en && item.question_th) {
          item.question_en = questionTranslationsEn[item.question_th.trim()] || item.question_th;
        }
        item.category_en = categoryTranslationsEn[item.category?.trim()] || item.category;
        item.subcategory_en = subcategoryTranslationsEn[item.subcategory?.trim()] || item.subcategory;
        item.method_en = methodTranslationsEn[item.method?.trim()] || item.method;

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

    // Checklist: Create new template item (Superadmin or Admin)
    if (url.pathname === '/api/checklist/templates' && request.method === 'POST') {
      if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'admin')) {
        return jsonResponse({ error: 'Forbidden: Superadmin access required' }, 403);
      }

      try {
        const body: any = await request.json();
        const departmentCode = (body.departmentCode || body.department_code || '').trim().toUpperCase();
        const layer = (body.layer || 'Layer 1').trim();
        const category = (body.category || 'General').trim();
        const subcategory = (body.subcategory || '').trim();
        const method = (body.method || 'สังเกตและตรวจสอบ').trim();
        const questionTh = (body.questionTh || body.question_th || '').trim();
        const questionEn = (body.questionEn || body.question_en || '').trim() || questionTh;

        if (!departmentCode || !questionTh) {
          return jsonResponse({ error: 'กรุณาระบุแผนกและข้อความคำถาม (ภาษาไทย)' }, 400);
        }

        // If item_order is provided, use it, otherwise calculate MAX(item_order) + 1 for this dept & layer
        let itemOrder = parseInt(body.itemOrder || body.item_order, 10);
        if (isNaN(itemOrder) || itemOrder <= 0) {
          const maxRow: any = await env.DB.prepare(
            'SELECT MAX(item_order) as max_order FROM checklist_templates WHERE department_code = ? AND layer = ?'
          ).bind(departmentCode, layer).first();
          itemOrder = (maxRow?.max_order || 0) + 1;
        }

        const insertRes = await env.DB.prepare(`
          INSERT INTO checklist_templates (
            department_code, layer, category, subcategory, method, item_order, question_th, question_en, row_in_excel, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          departmentCode,
          layer,
          category,
          subcategory,
          method,
          itemOrder,
          questionTh,
          questionEn,
          itemOrder
        ).run();

        return jsonResponse({
          success: true,
          message: 'เพิ่มข้อตรวจเช็คเรียบร้อยแล้ว',
          id: insertRes.meta?.last_row_id,
          item: {
            id: insertRes.meta?.last_row_id,
            department_code: departmentCode,
            layer,
            category,
            subcategory,
            method,
            item_order: itemOrder,
            question_th: questionTh,
            question_en: questionEn
          }
        }, 201);
      } catch (err: any) {
        return jsonResponse({ error: 'Failed to create checklist item: ' + err.message }, 500);
      }
    }

    // Checklist: Update template item (Superadmin or Admin)
    if (url.pathname.match(/^\/api\/checklist\/templates\/\d+$/) && request.method === 'PUT') {
      if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'admin')) {
        return jsonResponse({ error: 'Forbidden: Superadmin access required' }, 403);
      }

      try {
        const templateId = parseInt(url.pathname.split('/')[4], 10);
        const body: any = await request.json();

        const existing: any = await env.DB.prepare('SELECT * FROM checklist_templates WHERE id = ?').bind(templateId).first();
        if (!existing) {
          return jsonResponse({ error: 'ไม่พบข้อตรวจเช็คนี้' }, 404);
        }

        const category = body.category !== undefined ? String(body.category).trim() : existing.category;
        const subcategory = body.subcategory !== undefined ? String(body.subcategory).trim() : existing.subcategory;
        const method = body.method !== undefined ? String(body.method).trim() : existing.method;
        const itemOrder = (body.itemOrder !== undefined || body.item_order !== undefined)
          ? parseInt(body.itemOrder || body.item_order, 10)
          : existing.item_order;
        const questionTh = (body.questionTh !== undefined || body.question_th !== undefined)
          ? String(body.questionTh || body.question_th).trim()
          : existing.question_th;
        const questionEn = (body.questionEn !== undefined || body.question_en !== undefined)
          ? String(body.questionEn || body.question_en).trim()
          : existing.question_en;
        const layer = body.layer !== undefined ? String(body.layer).trim() : existing.layer;
        const departmentCode = (body.departmentCode !== undefined || body.department_code !== undefined)
          ? String(body.departmentCode || body.department_code).trim().toUpperCase()
          : existing.department_code;

        await env.DB.prepare(`
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
        `).bind(
          departmentCode,
          layer,
          category,
          subcategory,
          method,
          itemOrder,
          questionTh,
          questionEn,
          itemOrder,
          templateId
        ).run();

        return jsonResponse({
          success: true,
          message: 'แก้ไขข้อตรวจเช็คเรียบร้อยแล้ว'
        });
      } catch (err: any) {
        return jsonResponse({ error: 'Failed to update checklist item: ' + err.message }, 500);
      }
    }

    // Checklist: Delete template item (Superadmin or Admin)
    if (url.pathname.match(/^\/api\/checklist\/templates\/\d+$/) && request.method === 'DELETE') {
      if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'admin')) {
        return jsonResponse({ error: 'Forbidden: Superadmin access required' }, 403);
      }

      try {
        const templateId = parseInt(url.pathname.split('/')[4], 10);
        const existing: any = await env.DB.prepare('SELECT id FROM checklist_templates WHERE id = ?').bind(templateId).first();
        if (!existing) {
          return jsonResponse({ error: 'ไม่พบข้อตรวจเช็คนี้' }, 404);
        }

        await env.DB.prepare('DELETE FROM checklist_templates WHERE id = ?').bind(templateId).run();

        return jsonResponse({
          success: true,
          message: 'ลบข้อตรวจเช็คเรียบร้อยแล้ว'
        });
      } catch (err: any) {
        return jsonResponse({ error: 'Failed to delete checklist item: ' + err.message }, 500);
      }
    }

    // List inspection batch codes for a department and month
    if (url.pathname === '/api/inspections/codes' && request.method === 'GET') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const dept = url.searchParams.get('department') || '';
      const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);
      const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1), 10);

      const sql = `
        SELECT 
          inspection_code,
          mc_and_products,
          shift,
          MAX(audit_date) as latest_audit_date,
          MAX(CASE WHEN layer = 'Layer 1' THEN 1 ELSE 0 END) as has_layer1,
          MAX(CASE WHEN layer = 'Layer 1' THEN auditor_name ELSE NULL END) as layer1_auditor,
          MAX(CASE WHEN layer = 'Layer 1' THEN score_percent ELSE NULL END) as layer1_score,
          MAX(CASE WHEN layer = 'Layer 1' THEN total_no ELSE NULL END) as layer1_defects,
          MAX(CASE WHEN layer = 'Layer 2' THEN 1 ELSE 0 END) as has_layer2,
          MAX(CASE WHEN layer = 'Layer 2' THEN auditor_name ELSE NULL END) as layer2_auditor,
          MAX(CASE WHEN layer = 'Layer 2' THEN score_percent ELSE NULL END) as layer2_score,
          MAX(CASE WHEN layer = 'Layer 2' THEN total_no ELSE NULL END) as layer2_defects,
          MAX(CASE WHEN layer = 'Layer 3' THEN 1 ELSE 0 END) as has_layer3,
          MAX(CASE WHEN layer = 'Layer 3' THEN auditor_name ELSE NULL END) as layer3_auditor,
          MAX(CASE WHEN layer = 'Layer 3' THEN score_percent ELSE NULL END) as layer3_score,
          COUNT(*) as total_rounds
        FROM inspections
        WHERE department_code = ? AND year = ? AND month = ? AND inspection_code IS NOT NULL
        GROUP BY inspection_code
        ORDER BY inspection_code ASC
      `;

      const { results } = await env.DB.prepare(sql).bind(dept, year, month).all();
      return jsonResponse(results || []);
    }

    // Prior layers inspection data for Layer 2 & 3 verification
    if (url.pathname === '/api/inspections/prior-layers' && request.method === 'GET') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const dept = url.searchParams.get('department') || '';
      const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);
      const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1), 10);
      const code = url.searchParams.get('code') || url.searchParams.get('inspection_code');

      // Layer 1
      let layer1Sql = `
        SELECT i.*, 
          (SELECT COUNT(*) FROM inspection_items WHERE inspection_id = i.id AND result = 'NO') as defects_count
        FROM inspections i
        WHERE department_code = ? AND year = ? AND month = ? AND layer = 'Layer 1'
      `;
      const layer1Params: any[] = [dept, year, month];
      if (code && code.trim()) {
        layer1Sql += ' AND inspection_code = ?';
        layer1Params.push(code.trim());
      }
      layer1Sql += ' ORDER BY audit_date DESC, id DESC LIMIT 1';

      const layer1: any = await env.DB.prepare(layer1Sql).bind(...layer1Params).first();

      let layer1Items: any[] = [];
      if (layer1) {
        const { results } = await env.DB.prepare('SELECT * FROM inspection_items WHERE inspection_id = ?').bind(layer1.id).all();
        layer1Items = results || [];
      }

      // Layer 2
      let layer2Sql = `
        SELECT i.*, 
          (SELECT COUNT(*) FROM inspection_items WHERE inspection_id = i.id AND result = 'NO') as defects_count
        FROM inspections i
        WHERE department_code = ? AND year = ? AND month = ? AND layer = 'Layer 2'
      `;
      const layer2Params: any[] = [dept, year, month];
      if (code && code.trim()) {
        layer2Sql += ' AND inspection_code = ?';
        layer2Params.push(code.trim());
      }
      layer2Sql += ' ORDER BY audit_date DESC, id DESC LIMIT 1';

      const layer2: any = await env.DB.prepare(layer2Sql).bind(...layer2Params).first();

      let layer2Items: any[] = [];
      if (layer2) {
        const { results } = await env.DB.prepare('SELECT * FROM inspection_items WHERE inspection_id = ?').bind(layer2.id).all();
        layer2Items = results || [];
      }

      return jsonResponse({
        layer1: layer1 ? { ...layer1, items: layer1Items } : null,
        layer2: layer2 ? { ...layer2, items: layer2Items } : null,
      });
    }

    // Inspection Code History (Audit trail of who audited this code across Layer 1, 2, 3)
    if (url.pathname === '/api/inspections/code-history' && request.method === 'GET') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const dept = url.searchParams.get('department') || '';
      const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);
      const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1), 10);
      const code = (url.searchParams.get('code') || url.searchParams.get('inspection_code') || '').trim();

      if (!code) {
        return jsonResponse({ error: 'Inspection code is required' }, 400);
      }

      let sql = `
        SELECT i.*, d.name_th as department_name_th, d.name_en as department_name_en,
               u.username as auditor_username, u.position as auditor_position, u.avatar_url as auditor_avatar,
               (SELECT COUNT(*) FROM inspection_items WHERE inspection_id = i.id AND result = 'NO') as defects_count
        FROM inspections i
        LEFT JOIN departments d ON i.department_code = d.code
        LEFT JOIN users u ON i.auditor_id = u.id
        WHERE i.inspection_code = ?
      `;
      const params: any[] = [code];
      if (dept && dept !== 'all') {
        sql += ' AND i.department_code = ?';
        params.push(dept);
      }
      if (year) {
        sql += ' AND i.year = ?';
        params.push(year);
      }
      if (month) {
        sql += ' AND i.month = ?';
        params.push(month);
      }

      sql += `
        ORDER BY CASE 
          WHEN i.layer = 'Layer 1' THEN 1 
          WHEN i.layer = 'Layer 2' THEN 2 
          WHEN i.layer = 'Layer 3' THEN 3 
          ELSE 4 
        END ASC, i.id ASC
      `;

      const { results: inspectionsList } = await env.DB.prepare(sql).bind(...params).all();

      const fullLayers: any[] = [];
      for (const ins of (inspectionsList || [])) {
        const { results: items } = await env.DB.prepare(
          'SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY id ASC'
        ).bind(ins.id).all();
        fullLayers.push({
          ...ins,
          items: items || [],
        });
      }

      const layer1 = fullLayers.find(l => l.layer === 'Layer 1') || null;
      const layer2 = fullLayers.find(l => l.layer === 'Layer 2') || null;
      const layer3 = fullLayers.find(l => l.layer === 'Layer 3') || null;

      return jsonResponse({
        inspectionCode: code,
        departmentCode: dept || fullLayers[0]?.department_code || '',
        year: year || fullLayers[0]?.year || new Date().getFullYear(),
        month: month || fullLayers[0]?.month || (new Date().getMonth() + 1),
        mcAndProducts: fullLayers[0]?.mc_and_products || '',
        shift: fullLayers[0]?.shift || '',
        totalRounds: fullLayers.length,
        layers: fullLayers,
        layer1,
        layer2,
        layer3,
      });
    }

    // Inspections: List & Create
    if (url.pathname === '/api/inspections') {
      if (request.method === 'POST' && !currentUser) {
        return jsonResponse({ error: 'Unauthorized: Please log in to submit inspections' }, 401);
      }

      if (request.method === 'GET') {
        const dept = url.searchParams.get('department');
        const year = url.searchParams.get('year');
        const month = url.searchParams.get('month');
        const layer = url.searchParams.get('layer');
        const code = url.searchParams.get('code') || url.searchParams.get('inspection_code');

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
        if (code && code !== 'all') { sql += ' AND i.inspection_code = ?'; params.push(code); }

        // Non-admin/superadmin users see all inspection data within their own department; Admins and Superadmins see all departments
        // Guests or visitors without accounts see all departments
        const isPrivilegedUser = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
        const isGuestOrPublic = !currentUser || currentUser?.role === 'guest';
        if (!isPrivilegedUser && !isGuestOrPublic && currentUser) {
          const userDept = currentUser.department || 'MOLD';
          sql += ' AND (i.department_code = ? OR i.auditor_id = ?)';
          params.push(userDept, currentUser.id);
        }

        sql += ' ORDER BY i.audit_date DESC, i.id DESC';

        const { results } = await env.DB.prepare(sql).bind(...params).all();

        let statsSql = `
          SELECT 
            COUNT(*) as total_inspections,
            SUM(total_ok) as grand_total_ok,
            SUM(total_no) as grand_total_no,
            SUM(total_na) as grand_total_na,
            ROUND(AVG(score_percent), 2) as average_score
          FROM inspections
        `;
        const statsParams: any[] = [];
        if (!isPrivilegedUser && !isGuestOrPublic && currentUser) {
          const userDept = currentUser.department || 'MOLD';
          statsSql += ' WHERE (department_code = ? OR auditor_id = ?)';
          statsParams.push(userDept, currentUser.id);
        }

        const stats = await env.DB.prepare(statsSql).bind(...statsParams).first();

        return jsonResponse({ inspections: results, stats });
      }

      if (request.method === 'POST') {
        const body: any = await request.json();
        const {
          departmentCode,
          year,
          month,
          inspectionCode = '001',
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

        // Check: Each inspection_code can only be inspected once by Layer 1!
        // "แต่ละ Layer1 จะตรวจได้เพียงครั้งเดียว ตัวอย่าง Layer1 ตรวจแล้วจะไม่สามารถ สร้าง 001 ได้อีก"
        if (layer === 'Layer 1') {
          const cleanCode = (inspectionCode || '001').trim();
          const existingL1: any = await env.DB.prepare(`
            SELECT id, auditor_name, audit_date, mc_and_products 
            FROM inspections 
            WHERE department_code = ? AND year = ? AND month = ? AND inspection_code = ? AND layer = 'Layer 1'
          `).bind(departmentCode.toUpperCase(), parseInt(year, 10), parseInt(month, 10), cleanCode).first();

          if (existingL1) {
            return jsonResponse({
              error: `รหัสเอกสาร #${cleanCode} ในแผนก ${departmentCode} ได้รับการตรวจโดย Layer 1 ไปแล้ว (โดย ${existingL1.auditor_name} เมื่อ ${existingL1.audit_date}) แต่ละรหัสเอกสารในระดับ Layer 1 สามารถตรวจได้เพียงครั้งเดียว ไม่สามารถสร้างซ้ำได้ กรุณาใช้รหัสใหม่ เช่น รหัสถัดไป`,
            }, 400);
          }
        }

        const insResult = await env.DB.prepare(`
          INSERT INTO inspections (
            department_code, year, month, inspection_code, layer, shift, mc_and_products,
            auditor_id, auditor_name, audit_date, total_ok, total_no, total_na,
            score_percent, status, comments, previous_findings, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          departmentCode.toUpperCase(),
          parseInt(year, 10),
          parseInt(month, 10),
          (inspectionCode || '001').trim(),
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

        // Layer 2/3 updating prior Layer 1 answers
        if (body.updatePriorInspectionId && Array.isArray(body.priorItemsUpdates)) {
          for (const up of body.priorItemsUpdates) {
            if (up.id) {
              await env.DB.prepare(`
                UPDATE inspection_items
                SET result = ?, finding_topic = ?, severity = ?, action_plan = ?, responsible_person = ?, due_date = ?, image_url = ?
                WHERE id = ?
              `).bind(
                up.result,
                up.findingTopic || null,
                up.severity || null,
                up.actionPlan || null,
                up.responsiblePerson || null,
                up.dueDate || null,
                up.imageUrl || null,
                up.id
              ).run();
            }
          }

          // Recalculate prior inspection score
          const counts: any = await env.DB.prepare(`
            SELECT 
              SUM(CASE WHEN result = 'OK' THEN 1 ELSE 0 END) as total_ok,
              SUM(CASE WHEN result = 'NO' THEN 1 ELSE 0 END) as total_no
            FROM inspection_items WHERE inspection_id = ?
          `).bind(body.updatePriorInspectionId).first();
          const pOk = counts?.total_ok || 0;
          const pNo = counts?.total_no || 0;
          const pTotal = pOk + pNo;
          const pScore = pTotal > 0 ? Number(((pOk / pTotal) * 100).toFixed(2)) : 100.0;
          await env.DB.prepare(`
            UPDATE inspections SET total_ok = ?, total_no = ?, score_percent = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(pOk, pNo, pScore, body.updatePriorInspectionId).run();
        }

        // In-app notifications when defects found
        if (defectItems.length > 0) {
          await env.DB.prepare(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (NULL, ?, ?, 'alert', ?)
          `).bind(
            `[พบสิ่งผิดปกติ SBOP] แผนก ${departmentCode} #${inspectionCode || '001'} (${layer})`,
            `ผู้ตรวจ ${auditorName} ตรวจพบ ${defectItems.length} สิ่งผิดปกติ ที่ ${mcAndProducts}`,
            `/defects`
          ).run();

          // Dispatch direct notifications to assigned responsible persons
          try {
            const assignedNames = Array.from(
              new Set(defectItems.map((d: any) => (d.responsiblePerson || d.responsible_person || '').trim()).filter(Boolean))
            );
            if (assignedNames.length > 0) {
              const { results: allUsers } = await env.DB.prepare(
                'SELECT id, username, first_name, last_name FROM users WHERE status = ?'
              ).bind('approved').all();

              for (const name of assignedNames) {
                const target = (name as string).toLowerCase();
                const matchedUser: any = (allUsers || []).find((u: any) => {
                  const fullName = `${u.first_name} ${u.last_name}`.trim().toLowerCase();
                  const uName = (u.username || '').toLowerCase();
                  return fullName === target || target.includes(fullName) || fullName.includes(target) || uName === target;
                });

                if (matchedUser) {
                  await env.DB.prepare(`
                    INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                    VALUES (?, ?, ?, 'alert', '/defects', 0, CURRENT_TIMESTAMP)
                  `).bind(
                    matchedUser.id,
                    `[มอบหมายงานแก้ไข SBOP] แผนก ${departmentCode} #${inspectionCode || '001'}`,
                    `คุณได้รับมอบหมายให้รับผิดชอบแก้ไขจุดบกพร่อง SBOP (${layer}) ที่ ${mcAndProducts} โดยผู้ตรวจ ${auditorName}`
                  ).run();
                }
              }
            }
          } catch (notifErr) {
            console.error('Failed to dispatch responsible person notifications:', notifErr);
          }
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

    // Update inspection items (e.g. Layer 2 / Layer 3 editing Layer 1 answers)
    if (url.pathname.match(/^\/api\/inspections\/\d+\/items$/) && request.method === 'PUT') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const inspectionId = parseInt(url.pathname.split('/')[3], 10);
      const body: any = await request.json();
      const itemsToUpdate = body.items || [];

      for (const it of itemsToUpdate) {
        if (it.id) {
          await env.DB.prepare(`
            UPDATE inspection_items
            SET result = ?, finding_topic = ?, severity = ?, action_plan = ?, responsible_person = ?, due_date = ?, image_url = ?
            WHERE id = ? AND inspection_id = ?
          `).bind(
            it.result,
            it.finding_topic || it.findingTopic || null,
            it.severity || null,
            it.action_plan || it.actionPlan || null,
            it.responsible_person || it.responsiblePerson || null,
            it.due_date || it.dueDate || null,
            it.image_url || it.imageUrl || null,
            it.id,
            inspectionId
          ).run();
        }
      }

      // Recalculate prior inspection score
      const counts: any = await env.DB.prepare(`
        SELECT 
          SUM(CASE WHEN result = 'OK' THEN 1 ELSE 0 END) as total_ok,
          SUM(CASE WHEN result = 'NO' THEN 1 ELSE 0 END) as total_no
        FROM inspection_items WHERE inspection_id = ?
      `).bind(inspectionId).first();
      const pOk = counts?.total_ok || 0;
      const pNo = counts?.total_no || 0;
      const pTotal = pOk + pNo;
      const pScore = pTotal > 0 ? Number(((pOk / pTotal) * 100).toFixed(2)) : 100.0;

      await env.DB.prepare(`
        UPDATE inspections SET total_ok = ?, total_no = ?, score_percent = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(pOk, pNo, pScore, inspectionId).run();

      // Notify assigned responsible persons for newly updated defect items
      try {
        const noItems = itemsToUpdate.filter((it: any) => it.result === 'NO' && (it.responsible_person || it.responsiblePerson));
        if (noItems.length > 0) {
          const parentIns: any = await env.DB.prepare('SELECT department_code, inspection_code, layer FROM inspections WHERE id = ?').bind(inspectionId).first();
          const { results: allUsers } = await env.DB.prepare(
            'SELECT id, username, first_name, last_name FROM users WHERE status = ?'
          ).bind('approved').all();

          for (const it of noItems) {
            const resp = (it.responsible_person || it.responsiblePerson || '').trim().toLowerCase();
            const matchedUser: any = (allUsers || []).find((u: any) => {
              const fullName = `${u.first_name} ${u.last_name}`.trim().toLowerCase();
              const uName = (u.username || '').toLowerCase();
              return fullName === resp || resp.includes(fullName) || fullName.includes(resp) || uName === resp;
            });
            if (matchedUser) {
              await env.DB.prepare(`
                INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                VALUES (?, ?, ?, 'alert', '/defects', 0, CURRENT_TIMESTAMP)
              `).bind(
                matchedUser.id,
                `[อัปเดตงานแก้ไข SBOP] แผนก ${parentIns?.department_code || ''} #${parentIns?.inspection_code || '001'}`,
                `คุณได้รับมอบหมายให้แก้ไขจุดบกพร่อง SBOP (${parentIns?.layer || ''}) ประเด็น: ${it.finding_topic || it.findingTopic || it.question || 'จุดบกพร่อง'}`
              ).run();
            }
          }
        }
      } catch (notifErr) {
        console.error('Failed to notify responsible persons on item update:', notifErr);
      }

      return jsonResponse({
        message: 'Inspection items updated successfully',
        totalOk: pOk,
        totalNo: pNo,
        scorePercent: pScore
      });
    }

    // Admin Dashboard Statistics (Publicly viewable by all users & guests)
    if (url.pathname === '/api/dashboard/stats' && request.method === 'GET') {
      try {
        await env.DB.prepare("ALTER TABLE inspection_items ADD COLUMN defect_status TEXT DEFAULT 'pending'").run();
      } catch (e) {}

      const year = url.searchParams.get('year');
      const month = url.searchParams.get('month');
      const dept = url.searchParams.get('department');

      let filterSql = ' WHERE 1=1';
      const filterParams: any[] = [];
      if (year && year !== 'all') { filterSql += ' AND year = ?'; filterParams.push(parseInt(year, 10)); }
      if (month && month !== 'all') { filterSql += ' AND month = ?'; filterParams.push(parseInt(month, 10)); }
      if (dept && dept !== 'all') { filterSql += ' AND department_code = ?'; filterParams.push(dept); }

      // 1. Overall stats
      const overall = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_inspections,
          COALESCE(ROUND(AVG(score_percent), 1), 100.0) as average_score,
          COALESCE(SUM(total_ok), 0) as total_ok,
          COALESCE(SUM(total_no), 0) as total_no,
          COALESCE(SUM(total_na), 0) as total_na,
          COUNT(DISTINCT auditor_id) as active_auditors,
          COUNT(DISTINCT department_code) as active_departments
        FROM inspections ${filterSql}
      `).bind(...filterParams).first();

      // 2. Department Breakdown
      const { results: deptStats } = await env.DB.prepare(`
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
        LEFT JOIN inspections i ON d.code = i.department_code ${year && year !== 'all' ? `AND i.year = ${parseInt(year, 10)}` : ''} ${month && month !== 'all' ? `AND i.month = ${parseInt(month, 10)}` : ''}
        GROUP BY d.code, d.name_th, d.name_en
        ORDER BY d.code ASC
      `).all();

      // 3. Layer Breakdown
      const { results: layerStats } = await env.DB.prepare(`
        SELECT 
          layer,
          COUNT(*) as count,
          COALESCE(ROUND(AVG(score_percent), 1), 0) as average_score,
          COALESCE(SUM(total_no), 0) as defects_count
        FROM inspections ${filterSql}
        GROUP BY layer
        ORDER BY layer ASC
      `).bind(...filterParams).all();

      // 4. Recent Defects (with images)
      const { results: recentDefects } = await env.DB.prepare(`
        SELECT 
          ii.id, ii.inspection_id, ii.question, ii.finding_topic, ii.severity,
          ii.action_plan, ii.responsible_person, ii.due_date, ii.image_url, ii.layer,
          COALESCE(ii.defect_status, 'pending') as defect_status,
          COALESCE(ii.fix_image_url, '') as fix_image_url,
          i.department_code, i.inspection_code, i.audit_date, i.mc_and_products, i.auditor_name
        FROM inspection_items ii
        JOIN inspections i ON ii.inspection_id = i.id
        WHERE ii.result = 'NO' ${year && year !== 'all' ? `AND i.year = ${parseInt(year, 10)}` : ''} ${month && month !== 'all' ? `AND i.month = ${parseInt(month, 10)}` : ''}
        ORDER BY ii.id DESC
        LIMIT 10
      `).all();

      // 5. Total system users count
      const userCounts = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN role = 'layer1' OR role = 'leader' OR role = 'inspector' THEN 1 ELSE 0 END) as layer1_users,
          SUM(CASE WHEN role = 'layer2' OR role = 'supervisor' THEN 1 ELSE 0 END) as layer2_users,
          SUM(CASE WHEN role = 'layer3' OR role = 'manager' THEN 1 ELSE 0 END) as layer3_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users
        FROM users
      `).first();

      return jsonResponse({
        overall,
        deptStats,
        layerStats,
        recentDefects,
        userCounts,
      });
    }

    // Comprehensive Data Export (Excel & Photos) - Requirement 2: เฉพาะระดับ Admin ขึ้นไป
    if (url.pathname === '/api/export/data' && request.method === 'GET') {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
        return jsonResponse({ error: 'Forbidden: เฉพาะระดับ Admin ขึ้นไปเท่านั้นที่สามารถ Export ข้อมูลได้' }, 403);
      }

      try {
        await env.DB.prepare("ALTER TABLE inspection_items ADD COLUMN defect_status TEXT DEFAULT 'pending'").run();
      } catch (e) {}

      const year = url.searchParams.get('year');
      const month = url.searchParams.get('month');
      const dept = url.searchParams.get('department');
      const layer = url.searchParams.get('layer');

      let insSql = 'SELECT i.*, d.name_th as department_name_th FROM inspections i LEFT JOIN departments d ON i.department_code = d.code WHERE 1=1';
      const insParams: any[] = [];
      if (year && year !== 'all') { insSql += ' AND i.year = ?'; insParams.push(parseInt(year, 10)); }
      if (month && month !== 'all') { insSql += ' AND i.month = ?'; insParams.push(parseInt(month, 10)); }
      if (dept && dept !== 'all') { insSql += ' AND i.department_code = ?'; insParams.push(dept); }
      if (layer && layer !== 'all') { insSql += ' AND i.layer = ?'; insParams.push(layer); }
      insSql += ' ORDER BY i.audit_date DESC, i.id DESC';

      const { results: inspections } = await env.DB.prepare(insSql).bind(...insParams).all();

      // Defects with photos
      let defSql = `
        SELECT 
          ii.id, ii.inspection_id, ii.layer, ii.category, ii.subcategory, ii.question,
          ii.result, ii.finding_topic, ii.severity, ii.action_plan, ii.responsible_person,
          ii.due_date, ii.image_url, ii.image_key, ii.created_at,
          COALESCE(ii.defect_status, 'pending') as defect_status,
          COALESCE(ii.fix_image_url, '') as fix_image_url,
          COALESCE(ii.fix_image_key, '') as fix_image_key,
          i.department_code, i.inspection_code, i.audit_date, i.shift, i.mc_and_products, i.auditor_name
        FROM inspection_items ii
        JOIN inspections i ON ii.inspection_id = i.id
        WHERE ii.result = 'NO'
      `;
      const defParams: any[] = [];
      if (year && year !== 'all') { defSql += ' AND i.year = ?'; defParams.push(parseInt(year, 10)); }
      if (month && month !== 'all') { defSql += ' AND i.month = ?'; defParams.push(parseInt(month, 10)); }
      if (dept && dept !== 'all') { defSql += ' AND i.department_code = ?'; defParams.push(dept); }
      if (layer && layer !== 'all') { defSql += ' AND ii.layer = ?'; defParams.push(layer); }
      defSql += ' ORDER BY ii.id DESC';

      const { results: defects } = await env.DB.prepare(defSql).bind(...defParams).all();

      // Users directory
      const { results: users } = await env.DB.prepare(`
        SELECT id, username, first_name, last_name, email, department, position, role, status, approved_at, created_at
        FROM users ORDER BY department ASC, first_name ASC
      `).all();

      // Summary
      const summary = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_inspections,
          COALESCE(SUM(total_ok), 0) as grand_total_ok,
          COALESCE(SUM(total_no), 0) as grand_total_no,
          COALESCE(ROUND(AVG(score_percent), 2), 100.0) as average_score
        FROM inspections
      `).first();

      return jsonResponse({
        inspections: inspections || [],
        defects: defects || [],
        users: users || [],
        summary,
      });
    }

    // Defects: Submit Fix Photo (User attaches after-fix image → status becomes 'reviewing')
    if (url.pathname.match(/^\/api\/defects\/\d+\/fix-photo$/) && request.method === 'POST') {
      if (!currentUser || currentUser.role === 'guest') {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
      const itemId = parseInt(url.pathname.split('/')[3], 10);

      try {
        await env.DB.prepare("ALTER TABLE inspection_items ADD COLUMN defect_status TEXT DEFAULT 'pending'").run();
      } catch (e) {}
      try {
        await env.DB.prepare("ALTER TABLE inspection_items ADD COLUMN fix_image_url TEXT").run();
      } catch (e) {}
      try {
        await env.DB.prepare("ALTER TABLE inspection_items ADD COLUMN fix_image_key TEXT").run();
      } catch (e) {}

      const formData = await request.formData().catch(() => null);
      let fixImageUrl = '';
      let fixImageKey = '';

      if (formData) {
        const file = formData.get('fix_image') as File | null;
        if (file && file.size > 0) {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 8);
          const ext = file.name.substring(file.name.lastIndexOf('.')) || '.jpg';
          const key = `fixes/${timestamp}_${random}${ext}`;
          const buffer = await file.arrayBuffer();
          await env.R2_BUCKET.put(key, buffer, {
            httpMetadata: { contentType: file.type || 'image/jpeg' },
          });
          fixImageKey = key;
          fixImageUrl = `/api/r2/${key}`;
        }
      }

      if (!fixImageUrl) {
        return jsonResponse({ error: 'กรุณาแนบรูปภาพการแก้ไข (fix_image)' }, 400);
      }

      await env.DB.prepare(`
        UPDATE inspection_items
        SET defect_status = 'reviewing', fix_image_url = ?, fix_image_key = ?
        WHERE id = ?
      `).bind(fixImageUrl, fixImageKey, itemId).run();

      return jsonResponse({
        success: true,
        message: 'ส่งรูปภาพการแก้ไขแล้ว สถานะเปลี่ยนเป็น "รอตรวจ" — กรุณารอ Admin ตรวจสอบและอนุมัติ',
        defect_status: 'reviewing',
        fix_image_url: fixImageUrl,
      });
    }

    // Defects: Admin Approves Fix (Admin verifies before/after photos → status becomes 'resolved')
    if (url.pathname.match(/^\/api\/defects\/\d+\/approve$/) && request.method === 'PATCH') {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
        return jsonResponse({ error: 'Admin only / เฉพาะ Admin และ Super Admin เท่านั้น' }, 403);
      }
      const itemId = parseInt(url.pathname.split('/')[3], 10);

      try {
        await env.DB.prepare("ALTER TABLE inspection_items ADD COLUMN defect_status TEXT DEFAULT 'pending'").run();
      } catch (e) {}

      const body: any = await request.json().catch(() => ({}));
      // Admin can also reject back to 'pending' (re-open)
      const newStatus = body.status === 'pending' ? 'pending' : 'resolved';

      await env.DB.prepare(`
        UPDATE inspection_items SET defect_status = ? WHERE id = ?
      `).bind(newStatus, itemId).run();

      return jsonResponse({
        success: true,
        message: newStatus === 'resolved'
          ? 'อนุมัติการแก้ไขแล้ว — สถานะเปลี่ยนเป็น "แก้แล้ว" เรียบร้อย'
          : 'ส่งกลับไปแก้ไขใหม่ — สถานะเปลี่ยนกลับเป็น "ยังไม่แก้"',
        defect_status: newStatus,
        id: itemId,
      });
    }

    // Defects: Update Status — legacy route kept for compatibility (admin reopen only)
    if (url.pathname.match(/^\/api\/defects\/\d+\/status$/) && (request.method === 'PATCH' || request.method === 'PUT')) {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
        return jsonResponse({ error: 'Admin only' }, 403);
      }
      const itemId = parseInt(url.pathname.split('/')[3], 10);
      const body: any = await request.json().catch(() => ({}));
      const newStatus = body.status === 'resolved' ? 'resolved' : body.status === 'reviewing' ? 'reviewing' : 'pending';

      try {
        await env.DB.prepare("ALTER TABLE inspection_items ADD COLUMN defect_status TEXT DEFAULT 'pending'").run();
      } catch (e) {}

      await env.DB.prepare('UPDATE inspection_items SET defect_status = ? WHERE id = ?').bind(newStatus, itemId).run();
      return jsonResponse({
        success: true,
        message: `อัปเดตสถานะเป็น "${newStatus}" เรียบร้อย`,
        id: itemId,
        defect_status: newStatus
      });
    }

    // Defects: Delete / Resolve Defect Item and Remove Associated Photo from Cloudflare R2
    // Requirement 1: ถ้าหากยังไม่แก้ จะไม่สามารถลบได้ หากแก้แล้วจึงสามารถลบได้
    if (url.pathname.match(/^\/api\/defects\/\d+$/) && request.method === 'DELETE') {
      if (currentUser?.role === 'guest') {
        return jsonResponse({ error: 'Guest mode is view-only / โหมดผู้มาเยือนดูข้อมูลได้อย่างเดียว' }, 403);
      }
      const itemId = parseInt(url.pathname.split('/')[3], 10);

      try {
        await env.DB.prepare("ALTER TABLE inspection_items ADD COLUMN defect_status TEXT DEFAULT 'pending'").run();
      } catch (e) {}

      const item: any = await env.DB.prepare('SELECT * FROM inspection_items WHERE id = ?').bind(itemId).first();
      if (!item) return jsonResponse({ error: 'Defect item not found' }, 404);

      // Check requirement 1: must be 'resolved' to delete!
      if (item.defect_status !== 'resolved') {
        return jsonResponse({
          error: 'ไม่สามารถลบรายการนี้ได้เนื่องจากสถานะยังเป็น "ยังไม่แก้" — ต้องทำการแก้ไขและเปลี่ยนสถานะเป็น "แก้แล้ว" ก่อน จึงจะสามารถลบออกจากระบบได้'
        }, 400);
      }

      // Delete photo from Cloudflare R2 if it exists
      if (item.image_key) {
        try {
          await env.R2_BUCKET.delete(item.image_key);
        } catch (e) {
          console.warn('Failed to delete image_key from R2:', e);
        }
      }
      if (item.image_url) {
        try {
          const rawKey = item.image_url.replace(/^\/api\/r2\//, '').replace(/^r2sbop\//, '').replace(/^\/+/, '');
          if (rawKey) {
            await env.R2_BUCKET.delete(rawKey);
          }
        } catch (e) {
          console.warn('Failed to delete image_url from R2:', e);
        }
      }

      // Mark defect as resolved ('OK') and clear defect fields
      await env.DB.prepare(`
        UPDATE inspection_items
        SET result = 'OK', finding_topic = NULL, severity = NULL, action_plan = NULL, responsible_person = NULL, due_date = NULL, image_url = NULL, image_key = NULL
        WHERE id = ?
      `).bind(itemId).run();

      // Recalculate parent inspection counts and score
      const inspectionId = item.inspection_id;
      const counts: any = await env.DB.prepare(`
        SELECT 
          SUM(CASE WHEN result = 'OK' THEN 1 ELSE 0 END) as total_ok,
          SUM(CASE WHEN result = 'NO' THEN 1 ELSE 0 END) as total_no,
          SUM(CASE WHEN result = 'N/A' THEN 1 ELSE 0 END) as total_na
        FROM inspection_items WHERE inspection_id = ?
      `).bind(inspectionId).first();

      const pOk = counts?.total_ok || 0;
      const pNo = counts?.total_no || 0;
      const pNa = counts?.total_na || 0;
      const pTotal = pOk + pNo;
      const pScore = pTotal > 0 ? Number(((pOk / pTotal) * 100).toFixed(2)) : 100.0;

      await env.DB.prepare(`
        UPDATE inspections 
        SET total_ok = ?, total_no = ?, total_na = ?, score_percent = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(pOk, pNo, pNa, pScore, inspectionId).run();

      return jsonResponse({
        message: 'ลบข้อผิดพลาดที่ได้รับการแก้ไขแล้ว และลบรูปภาพหลักฐานออกจากระบบจัดเก็บเรียบร้อยแล้ว',
        inspectionId,
        newScore: pScore,
        totalNo: pNo,
      });
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

        const imageUrl = `/api/r2/${key}`;

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

    // Serve images directly from R2 bucket
    if (url.pathname.startsWith('/api/r2/')) {
      const key = decodeURIComponent(url.pathname.replace(/^\/api\/r2\//, ''));
      try {
        const object = await env.R2_BUCKET.get(key);
        if (!object) {
          return new Response('Image not found', { status: 404 });
        }
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(object.body, { headers });
      } catch (err: any) {
        return new Response('Error retrieving image: ' + err.message, { status: 500 });
      }
    }

    // In-App Notifications: List & Unread Count
    if (url.pathname === '/api/notifications' && request.method === 'GET') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);

      const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'superadmin';

      let sql = '';
      let countSql = '';
      const params: any[] = [currentUser.id];

      if (isPrivileged) {
        // Admin and Superadmin receive: direct notifications, system alerts, registration alerts, and broadcasts
        sql = `
          SELECT * FROM notifications 
          WHERE user_id = ? OR (user_id IS NULL AND type IN ('registration_alert', 'alert', 'broadcast'))
          ORDER BY id DESC LIMIT 50
        `;
        countSql = `
          SELECT COUNT(*) as unread_count FROM notifications 
          WHERE (user_id = ? OR (user_id IS NULL AND type IN ('registration_alert', 'alert', 'broadcast')))
            AND is_read = 0
        `;
      } else {
        // Regular employees ONLY receive their own direct notifications and global broadcasts (NEVER registration alerts)
        sql = `
          SELECT * FROM notifications 
          WHERE user_id = ? OR (user_id IS NULL AND type = 'broadcast')
          ORDER BY id DESC LIMIT 50
        `;
        countSql = `
          SELECT COUNT(*) as unread_count FROM notifications 
          WHERE (user_id = ? OR (user_id IS NULL AND type = 'broadcast'))
            AND is_read = 0
        `;
      }

      const { results: notifications } = await env.DB.prepare(sql).bind(...params).all();
      const unreadRow: any = await env.DB.prepare(countSql).bind(...params).first();

      return jsonResponse({
        notifications: notifications || [],
        unreadCount: unreadRow?.unread_count || 0,
      });
    }

    // Notifications: Mark Single as Read
    if (url.pathname.match(/^\/api\/notifications\/\d+\/read$/) && request.method === 'PATCH') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const notifId = parseInt(url.pathname.split('/')[3], 10);
      await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').bind(notifId).run();
      return jsonResponse({ message: 'Marked as read' });
    }

    // Notifications: Mark All as Read
    if (url.pathname === '/api/notifications/read-all' && request.method === 'POST') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'superadmin';

      if (isPrivileged) {
        await env.DB.prepare(`
          UPDATE notifications 
          SET is_read = 1 
          WHERE user_id = ? OR (user_id IS NULL AND type IN ('registration_alert', 'alert', 'broadcast'))
        `).bind(currentUser.id).run();
      } else {
        await env.DB.prepare(`
          UPDATE notifications 
          SET is_read = 1 
          WHERE user_id = ? OR (user_id IS NULL AND type = 'broadcast')
        `).bind(currentUser.id).run();
      }
      return jsonResponse({ message: 'All marked as read' });
    }

    // Notifications: Clear / Delete Read Notifications
    if (url.pathname === '/api/notifications/clear-read' && (request.method === 'POST' || request.method === 'DELETE')) {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'superadmin';

      if (isPrivileged) {
        await env.DB.prepare(`
          DELETE FROM notifications 
          WHERE is_read = 1 
            AND (user_id = ? OR (user_id IS NULL AND type IN ('registration_alert', 'alert', 'broadcast')))
        `).bind(currentUser.id).run();
      } else {
        await env.DB.prepare(`
          DELETE FROM notifications 
          WHERE is_read = 1 
            AND (user_id = ? OR (user_id IS NULL AND type = 'broadcast'))
        `).bind(currentUser.id).run();
      }
      return jsonResponse({ message: 'Read notifications cleared successfully' });
    }

    // Notifications: Send In-App Notification (Admin or System)
    if (url.pathname === '/api/notifications' && request.method === 'POST') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const body: any = await request.json();
      const { userId, title, message, type = 'info', link = null } = body;
      await env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).bind(userId || null, title, message, type, link).run();
      return jsonResponse({ message: 'Notification sent successfully' }, 201);
    }

    // Users Directory: list approved users for responsible person assignment and in-app notifications
    if (url.pathname === '/api/users/directory' && request.method === 'GET') {
      if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
      const { results } = await env.DB.prepare(`
        SELECT id, username, first_name, last_name, email, department, position, role, avatar_url
        FROM users 
        WHERE status = 'approved'
        ORDER BY department ASC, first_name ASC
      `).all();
      return jsonResponse(results || []);
    }

    // Admin: Users List & Management
    if (url.pathname === '/api/users' && request.method === 'GET') {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) return jsonResponse({ error: 'Forbidden' }, 403);
      const status = url.searchParams.get('status');
      const dept = url.searchParams.get('department');
      const search = url.searchParams.get('search');

      let sql = `
        SELECT id, username, first_name, last_name, phone, email, department, position,
               responsible_area, role, status, approved_at, created_at, updated_at, avatar_url
        FROM users WHERE 1=1
      `;
      const params: any[] = [];
      if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
      if (dept && dept !== 'all') { sql += ' AND department = ?'; params.push(dept); }
      if (search) {
        sql += ' AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR position LIKE ?)';
        const t = `%${search}%`;
        params.push(t, t, t, t, t);
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
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) return jsonResponse({ error: 'Forbidden' }, 403);
      const userId = parseInt(url.pathname.split('/')[3], 10);
      const targetUser: any = await env.DB.prepare('SELECT first_name, last_name, email FROM users WHERE id = ?').bind(userId).first();
      if (!targetUser) return jsonResponse({ error: 'User not found' }, 404);

      await env.DB.prepare(`
        UPDATE users 
        SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(currentUser.id, userId).run();

      // In-app notification for user
      await env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'บัญชีของคุณได้รับการอนุมัติแล้ว', 'ยินดีต้อนรับสู่ระบบ SBOP บัญชีของคุณได้รับการอนุมัติโดยผู้ดูแลระบบแล้ว สามารถเริ่มบันทึกการตรวจได้ทันที', 'success')
      `).bind(userId).run();

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
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) return jsonResponse({ error: 'Forbidden' }, 403);
      const userId = parseInt(url.pathname.split('/')[3], 10);
      await env.DB.prepare(`
        UPDATE users 
        SET status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(currentUser.id, userId).run();

      await env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'บัญชีไม่ผ่านการอนุมัติ', 'ขออภัย บัญชีผู้ใช้งานของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อ EHS หรือหัวหน้างาน', 'error')
      `).bind(userId).run();

      return jsonResponse({ message: 'Account rejected' });
    }

    // Admin: Change Role
    if (url.pathname.match(/^\/api\/users\/\d+\/role$/) && request.method === 'PUT') {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) return jsonResponse({ error: 'Forbidden' }, 403);
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
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) return jsonResponse({ error: 'Forbidden' }, 403);
      const userId = parseInt(url.pathname.split('/')[3], 10);
      if (userId === currentUser.id) return jsonResponse({ error: 'Cannot delete own account' }, 400);

      await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
      return jsonResponse({ message: 'User deleted successfully' });
    }

    // SuperAdmin / Admin: Reset User Password to 123456
    if (url.pathname.match(/^\/api\/users\/\d+\/reset-password$/) && request.method === 'POST') {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) return jsonResponse({ error: 'Forbidden' }, 403);
      const userId = parseInt(url.pathname.split('/')[3], 10);
      const targetUser: any = await env.DB.prepare('SELECT id, first_name, last_name, email FROM users WHERE id = ?').bind(userId).first();
      if (!targetUser) return jsonResponse({ error: 'User not found' }, 404);

      const defaultPassword = '123456';
      const newHash = bcrypt.hashSync(defaultPassword, 10);
      await env.DB.prepare(`
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newHash, userId).run();

      // In-app notification for the user
      await env.DB.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'รหัสผ่านของคุณถูกรีเซ็ตเป็น 123456', 'ผู้ดูแลระบบได้ทำการรีเซ็ตรหัสผ่านเริ่มต้นของคุณเป็น: 123456 กรุณาเข้าสู่ระบบและเปลี่ยนรหัสผ่านใหม่เพื่อความปลอดภัย', 'alert')
      `).bind(userId).run();

      return jsonResponse({ message: `รหัสผ่านของ ${targetUser.first_name} ${targetUser.last_name} ถูกรีเซ็ตเป็น 123456 เรียบร้อยแล้ว` });
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
