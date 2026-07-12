/**
 * middleware/auth.js
 * Verifies the JWT sent in the Authorization header and attaches the
 * decoded employee identity to req.user.
 *
 * Token payload shape (set at login, see authController - future phase):
 *   { employee_id, email, role, department_id }
 *
 * req.user mirrors columns on the `employees` table so downstream
 * controllers/middleware can reference req.user.employee_id, req.user.role,
 * req.user.department_id directly without another DB hit.
 */

'use strict';

const jwt = require('jsonwebtoken');
require('dotenv').config();
const ApiResponse = require('../utils/apiResponse');

/**
 * Requires a valid access token. Rejects the request with 401 if missing/invalid/expired.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return ApiResponse.error(res, 'Authentication required. Provide a Bearer token.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      employee_id: decoded.employee_id,
      email: decoded.email,
      role: decoded.role,
      department_id: decoded.department_id ?? null,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Session expired. Please log in again.', 401);
    }
    return ApiResponse.error(res, 'Invalid authentication token.', 401);
  }
}

/**
 * Attaches req.user if a valid token is present, but does not reject the
 * request when the token is missing. Useful for endpoints that behave
 * differently for logged-in vs anonymous callers (rare in this app, but
 * kept available for the public asset lookup-by-QR use case).
 */
function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      employee_id: decoded.employee_id,
      email: decoded.email,
      role: decoded.role,
      department_id: decoded.department_id ?? null,
    };
  } catch (err) {
    // Ignore invalid token in optional mode; treat as anonymous.
  }
  return next();
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};
