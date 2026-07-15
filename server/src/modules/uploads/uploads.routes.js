import { Router } from 'express';
import multer from 'multer';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { requireRestaurantRole } from '../../middleware/requireAuth.js';
import imagekit from '../../lib/imagekit.js';

export const uploadsRouter = Router();
const requireManage = requireRestaurantRole('owner', 'manager');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new HttpError(400, 'File must be an image'));
    cb(null, true);
  },
});

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (!err) return resolve();
      if (err instanceof multer.MulterError) return reject(new HttpError(400, err.message));
      reject(err);
    });
  });
}

uploadsRouter.post(
  '/image',
  requireManage,
  asyncRoute(async (req, res) => {
    await runMulter(req, res);
    if (!req.file) throw new HttpError(400, 'No file provided');

    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname || `product-${Date.now()}`,
      folder: '/products',
    });

    const url = imagekit.url({
      path: result.filePath,
      transformation: [{ width: '1000', quality: 'auto', format: 'auto' }],
    });

    res.status(201).json({ url });
  })
);
