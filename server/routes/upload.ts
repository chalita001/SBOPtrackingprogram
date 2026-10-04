import { Router, Response } from 'express';
import multer from 'multer';
import { uploadFile } from '../storage.js';
import { authenticate, AuthRequest } from '../auth.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// Upload defect photo to Cloudflare R2 (or local fallback)
router.post('/', authenticate, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { buffer, originalname, mimetype } = req.file;

    // Upload to Cloudflare R2 storage
    const result = await uploadFile(buffer, originalname, mimetype);

    return res.status(200).json({
      message: 'Image uploaded successfully to Cloudflare R2',
      imageUrl: result.url,
      imageKey: result.key,
      storage: result.storage,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to upload image: ' + err.message });
  }
});

export default router;
