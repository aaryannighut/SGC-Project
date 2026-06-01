/**
 * middleware.js
 * Middleware definitions for Shri Ganesh Classes Attendance System
 */

module.exports.isAdminLoggedIn = (req, res, next) => {
    if (!req.session.isAdmin) {
        req.flash('error', 'You must be logged in as Admin to access this page.');
        return res.redirect('/admin/login');
    }
    next();
};