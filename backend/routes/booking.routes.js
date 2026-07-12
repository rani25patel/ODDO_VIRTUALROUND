/**
 * routes/bookingRoutes.js
 * Screen 6 - Resource Booking.
 * create -> CALL sp_book_resource(...) (rejects overlaps)
 * cancel -> CALL sp_cancel_booking(...)
 * reschedule -> UPDATE bookings SET start_time/end_time (trg_bookings_before_update re-checks overlap)
 */

'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { validate, isPositiveIntParam, isDateTimeBody } = require('../middleware/validation');

router.use(authenticate);

// GET /api/bookings - list (optionally filtered by status/date range via query params)
router.get('/', bookingController.list);

// GET /api/bookings/:id
router.get('/:id', [isPositiveIntParam('id')], validate, bookingController.getById);

// GET /api/bookings/asset/:asset_id - calendar view of a resource's existing bookings
router.get('/asset/:asset_id', [isPositiveIntParam('asset_id')], validate, bookingController.getByAsset);

// POST /api/bookings - book a shared/bookable resource for a time slot
router.post(
  '/',
  [
    body('asset_id').isInt({ min: 1 }),
    body('department_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('purpose').optional({ nullable: true }).trim().isLength({ max: 255 }),
    isDateTimeBody('start_time'),
    isDateTimeBody('end_time'),
  ],
  validate,
  bookingController.create
);

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', [isPositiveIntParam('id')], validate, bookingController.cancel);

// PATCH /api/bookings/:id/reschedule
router.patch(
  '/:id/reschedule',
  [isPositiveIntParam('id'), isDateTimeBody('start_time'), isDateTimeBody('end_time')],
  validate,
  bookingController.reschedule
);

module.exports = router;
