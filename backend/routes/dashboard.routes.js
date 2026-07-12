/**
 * routes/dashboardRoutes.js
 * Screen 2 - Dashboard / Home.
 * getKpis reads the v_dashboard_kpis view; getOverdueReturns reads
 * v_overdue_allocations; getUpcomingBookings reads v_upcoming_bookings.
 */

'use strict';

const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard/kpis - Assets Available, Assets Allocated, Maintenance Today,
// Active Bookings, Pending Transfers, Upcoming Returns, Overdue Returns
router.get('/kpis', dashboardController.getKpis);

// GET /api/dashboard/overdue-returns
router.get('/overdue-returns', dashboardController.getOverdueReturns);

// GET /api/dashboard/upcoming-bookings
router.get('/upcoming-bookings', dashboardController.getUpcomingBookings);

module.exports = router;
