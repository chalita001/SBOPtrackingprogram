import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sbop_super_secret_jwt_security_key_2026_d1_r2';

export interface UserPayload {
  id: number;
  email: string;
  role: 'admin' | 'supervisor' | 'inspector' | 'staff';
  status: 'pending' | 'approved' | 'rejected';
  firstName: string;
  lastName: string;
  department: string;
}

export function generateToken(user: any): string {
  const payload: UserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    firstName: user.first_name,
    lastName: user.last_name,
    department: user.department,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    
    // Check if user is still active/approved in DB
    const user = db.prepare('SELECT id, role, status, email FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = {
      ...decoded,
      role: user.role,
      status: user.status
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required' });
  }
  next();
}

export function requireApproved(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.status !== 'approved') {
    return res.status(403).json({ error: 'Account pending approval from administrator' });
  }
  next();
}
