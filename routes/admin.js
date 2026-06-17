/**
 * routes/admin.js
 * Admin authentication and control panel routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const { isAdminLoggedIn } = require('../middleware');
const wrapAsync = require('../utils/wrapAsync');

// /admin/login
router.route('/login')
    .get(adminController.renderLogin)
    .post(wrapAsync(adminController.login));

// /admin/logout
router.get('/logout', adminController.logout);

// /admin/dashboard
router.get('/dashboard', isAdminLoggedIn, wrapAsync(adminController.dashboard));

// /admin/attendance/class/:className
router.get('/attendance/class/:className', isAdminLoggedIn, wrapAsync(adminController.showClassAbsentees));
router.post('/attendance/class/:className/send-whatsapp', isAdminLoggedIn, wrapAsync(adminController.sendWhatsAppToAbsentees));

module.exports = router;