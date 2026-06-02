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

// Check if either Admin or Teacher is logged in
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.session.isAdmin && !req.session.isTeacher) {
        req.flash('error', 'Please log in to access this page.');
        return res.redirect('/');
    }
    next();
};

// Check if user is Admin specifically
module.exports.isAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
        req.flash('error', 'Access denied. Admin privileges required.');
        return res.redirect('/admin/login');
    }
    next();
};