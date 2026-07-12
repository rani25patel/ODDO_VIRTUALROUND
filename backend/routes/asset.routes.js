/**
 * routes/assetRoutes.js
 * Screen 4 - Asset Registration & Directory.
 * Registration/editing restricted to Admin/Asset Manager; everyone
 * authenticated can search/view (needed for allocation/booking flows).
 */

'use strict';

const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const assetController = require('../controllers/assetController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { upload } = require('../config/multer');
const {
  validate,
  isPositiveIntParam,
  isNonEmptyString,
  isOptionalEnumBody,
  isOptionalDateBody,
  ASSET_CONDITION,
  ASSET_STATUS,
  paginationQuery,
} = require('../middleware/validation');

router.use(authenticate);

// Tags the request so config/multer.js stores files under uploads/assets/
function tagAssetsUpload(req, res, next) {
  req.uploadFolder = 'assets';
  next();
}

// GET /api/assets - search/filter by tag, serial number, qr_code, category, status, department, location
router.get(
  '/',
  [
    ...paginationQuery(),
    query('search').optional().trim(),
    query('category_id').optional().isInt({ min: 1 }),
    query('status').optional().isIn(ASSET_STATUS),
    query('department_id').optional().isInt({ min: 1 }),
    query('location').optional().trim(),
  ],
  validate,
  assetController.list
);

// GET /api/assets/:id
router.get('/:id', [isPositiveIntParam('id')], validate, assetController.getById);

// GET /api/assets/:id/history - allocation history + maintenance history
router.get('/:id/history', [isPositiveIntParam('id')], validate, assetController.getHistory);

// POST /api/assets - register (asset_tag is auto-generated server-side, see utils/generateAssetTag)
router.post(
  '/',
  requireRole('Admin', 'Asset Manager'),
  tagAssetsUpload,
  upload.array('photos', 5),
  [
    isNonEmptyString('name', 150),
    body('category_id').isInt({ min: 1 }).withMessage('category_id is required'),
    body('serial_number').optional({ nullable: true }).trim().isLength({ max: 100 }),
    isOptionalDateBody('acquisition_date'),
    body('acquisition_cost').optional({ nullable: true }).isFloat({ min: 0 }),
    isOptionalEnumBody('condition_status', ASSET_CONDITION),
    body('location').optional({ nullable: true }).trim().isLength({ max: 150 }),
    body('is_bookable').optional().isBoolean().toBoolean(),
  ],
  validate,
  assetController.create
);

// PUT /api/assets/:id - edit details (Admin/Asset Manager)
router.put(
  '/:id',
  requireRole('Admin', 'Asset Manager'),
  tagAssetsUpload,
  upload.array('photos', 5),
  [
    isPositiveIntParam('id'),
    body('name').optional().trim().notEmpty(),
    body('category_id').optional().isInt({ min: 1 }),
    body('serial_number').optional({ nullable: true }).trim().isLength({ max: 100 }),
    isOptionalDateBody('acquisition_date'),
    body('acquisition_cost').optional({ nullable: true }).isFloat({ min: 0 }),
    isOptionalEnumBody('condition_status', ASSET_CONDITION),
    body('location').optional({ nullable: true }).trim().isLength({ max: 150 }),
    body('is_bookable').optional().isBoolean().toBoolean(),
  ],
  validate,
  assetController.update
);

// PATCH /api/assets/:id/status - manual lifecycle transitions (e.g. -> Retired, -> Disposed)
router.patch(
  '/:id/status',
  requireRole('Admin', 'Asset Manager'),
  [isPositiveIntParam('id'), body('status').isIn(ASSET_STATUS)],
  validate,
  assetController.updateStatus
);

// POST /api/assets/:id/documents - attach extra photos/documents (asset_documents table)
router.post(
  '/:id/documents',
  requireRole('Admin', 'Asset Manager'),
  tagAssetsUpload,
  upload.array('files', 5),
  [isPositiveIntParam('id')],
  validate,
  assetController.uploadDocuments
);

module.exports = router;
