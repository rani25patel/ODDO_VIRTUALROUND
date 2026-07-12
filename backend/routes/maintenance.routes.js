/**
 * routes/maintenanceRoutes.js
 * Screen 7 - Maintenance Management.
 * create -> CALL sp_raise_maintenance_request(...)
 * decide -> CALL sp_approve_maintenance(...) with p_decision 'Approved'|'Rejected'
 *           (trg_maintenance_after_update flips asset to Under Maintenance on approval)
 * resolve -> CALL sp_resolve_maintenance(...) (trigger reverts asset to Available)
 * assignTechnician -> UPDATE maintenance_requests SET status='Technician Assigned', technician_name=...
 */

'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const maintenanceController = require('../controllers/maintenanceController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { upload } = require('../config/multer');
const { validate, isPositiveIntParam, MAINTENANCE_PRIORITY } = require('../middleware/validation');

router.use(authenticate);

function tagMaintenanceUpload(req, res, next) {
  req.uploadFolder = 'maintenance';
  next();
}

// GET /api/maintenance - list (filterable by status/asset/priority)
router.get('/', maintenanceController.list);

// GET /api/maintenance/:id
router.get('/:id', [isPositiveIntParam('id')], validate, maintenanceController.getById);

// POST /api/maintenance - raise request (any authenticated employee holding/using the asset)
router.post(
  '/',
  tagMaintenanceUpload,
  upload.single('photo'),
  [
    body('asset_id').isInt({ min: 1 }),
    body('issue_description').trim().notEmpty().isLength({ max: 500 }),
    body('priority').optional().isIn(MAINTENANCE_PRIORITY),
  ],
  validate,
  maintenanceController.create
);

// PATCH /api/maintenance/:id/decide - Approve/Reject (Asset Manager)
router.patch(
  '/:id/decide',
  requireRole('Admin', 'Asset Manager'),
  [isPositiveIntParam('id'), body('decision').isIn(['Approved', 'Rejected'])],
  validate,
  maintenanceController.decide
);

// PATCH /api/maintenance/:id/assign-technician (Asset Manager)
router.patch(
  '/:id/assign-technician',
  requireRole('Admin', 'Asset Manager'),
  [isPositiveIntParam('id'), body('technician_name').trim().notEmpty().isLength({ max: 150 })],
  validate,
  maintenanceController.assignTechnician
);

// PATCH /api/maintenance/:id/resolve (Asset Manager)
router.patch(
  '/:id/resolve',
  requireRole('Admin', 'Asset Manager'),
  [isPositiveIntParam('id'), body('resolution_notes').optional({ nullable: true }).trim().isLength({ max: 500 })],
  validate,
  maintenanceController.resolve
);

module.exports = router;
