/**
 * middleware/role.js
 * Role-based access control, built on top of req.user set by middleware/auth.js.
 *
 * Roles come straight from employees.role ENUM:
 *   'Admin' | 'Asset Manager' | 'Department Head' | 'Employee'
 *
 * Usage:
 *   router.post('/departments', authenticate, requireRole('Admin'), controller.create);
 *   router.post('/maintenance/:id/approve', authenticate, requireRole('Admin', 'Asset Manager'), controller.approve);
 */

'use strict';

const ApiResponse = require('../utils/apiResponse');

/**
 * Restricts access to one or more of the four employees.role values.
 * Must run AFTER authenticate.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        403
      );
    }

    return next();
  };
}

/**
 * Convenience guard: Admin only (e.g. Organization Setup screen - Screen 3).
 */
const requireAdmin = requireRole('Admin');

/**
 * Convenience guard: any role with elevated privileges over a plain Employee
 * (Admin, Asset Manager, Department Head) - useful for approval-style actions
 * where the exact allowed set differs per endpoint but "not a plain Employee"
 * is the common denominator. Prefer requireRole(...) with explicit roles when
 * the spec calls out specific approvers (e.g. only Asset Manager can approve
 * maintenance/transfers).
 */
const requireStaff = requireRole('Admin', 'Asset Manager', 'Department Head');

/**
 * Ownership/scoping helper (not a route guard by itself): confirms the
 * authenticated user is either an Admin/Asset Manager (org-wide access) or
 * belongs to the department passed in. Controllers call this after fetching
 * the target record's department_id. Kept here since it is access-control
 * logic, but it returns a boolean instead of behaving as middleware.
 */
function isSameDepartmentOrPrivileged(req, targetDepartmentId) {
  if (['Admin', 'Asset Manager'].includes(req.user.role)) return true;
  if (req.user.role === 'Department Head' && req.user.department_id === targetDepartmentId) return true;
  return false;
}

module.exports = {
  requireRole,
  requireAdmin,
  requireStaff,
  isSameDepartmentOrPrivileged,
};
