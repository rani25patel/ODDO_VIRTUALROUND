'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const UPLOAD_ROOT = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
const MAX_FILE_SIZE_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

// Ensure base upload directories exist at boot.
['assets', 'maintenance', 'misc'].forEach((sub) => {
  const dir = path.join(UPLOAD_ROOT, sub);
  fs.mkdirSync(dir, { recursive: true });
});

function resolveSubfolder(req) {
  // Route-level code can set req.uploadFolder = 'assets' | 'maintenance' | 'misc'
  // before invoking the multer middleware (see routes for usage pattern).
  return req.uploadFolder && ['assets', 'maintenance', 'misc'].includes(req.uploadFolder)
    ? req.uploadFolder
    : 'misc';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = resolveSubfolder(req);
    cb(null, path.join(UPLOAD_ROOT, sub));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF, PDF.'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 5,
  },
});

module.exports = {
  upload,
  UPLOAD_ROOT,
};
