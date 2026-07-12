/**
 * routes/authRoutes.js
 * Screen 1 - Login / Signup.
 * Signup ALWAYS creates a plain 'Employee' (employees.role default) -
 * role promotion only happens via Admin in employeeRoutes (Screen 3, Tab C).
 */

'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, isNonEmptyString, isEmail } = require('../middleware/validation');

// POST /api/auth/signup - creates an Employee-role account only
router.post(
  '/signup',
  [
    isNonEmptyString('name', 150),
    isEmail('email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('department_id').optional({ nullable: true }).isInt({ min: 1 }),
  ],
  validate,
  authController.signup
);

// POST /api/auth/login
router.post(
  '/login',
  [isEmail('email'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  authController.login
);

// POST /api/auth/forgot-password - issues a password_reset_tokens entry
router.post('/forgot-password', [isEmail('email')], validate, authController.forgotPassword);

// POST /api/auth/reset-password - consumes the token
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('new_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  authController.resetPassword
);

// GET /api/auth/me - session validation, returns the authenticated employee
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/logout - stateless JWT: client discards token; endpoint kept for symmetry/future token blacklist
router.post('/logout', authenticate, authController.logout);

module.exports = router;
