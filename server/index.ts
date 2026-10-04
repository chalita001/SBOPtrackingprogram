import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import departmentsRouter from './routes/departments.js';
import checklistRouter from './routes/checklist.js';
import inspectionsRouter from './routes/inspections.js';
import uploadRouter from './routes/upload.js';
import emailRouter from './routes/email.js';
import dashboardRouter from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database tables & seeds
try {
  initDatabase();
} catch (dbErr) {
  console.error('Failed to initialize database:', dbErr);
}

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve local uploaded images static directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    d1Database: 'd1sbop (413b2fe9-b280-4a1b-81ac-cb20f9e41935)',
    r2Bucket: 'r2sbop',
    r2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com/r2sbop',
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/checklist', checklistRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/email', emailRouter);
app.use('/api/dashboard', dashboardRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SBOP Safety Tracking Program API Server running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`💾 Cloudflare D1 Target: d1sbop (413b2fe9-b280-4a1b-81ac-cb20f9e41935)`);
  console.log(`📦 Cloudflare R2 Storage: r2sbop`);
  console.log(`====================================================`);
});
