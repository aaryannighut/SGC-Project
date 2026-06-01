/**
 * controllers/admin.js
 * Admin authentication and dashboard logic
 */

const Student = require('../models/student');
const Teacher = require('../models/teacher');
const Class = require('../models/class');

// Render admin login page
module.exports.renderLogin = (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin/dashboard');
    }
    res.render('users/login', { title: 'Admin Login - Shri Ganesh Classes' });
};

// Handle admin login POST
module.exports.login = async (req, res) => {
    const { username, password } = req.body;
    const envUsername = (process.env.ADMIN_USERNAME || '').trim();
    const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();

    console.log("Comparing login credentials:");
    console.log(`Submitted: username="${cleanUsername}", password="${cleanPassword}"`);
    console.log(`Expected (env): username="${envUsername}", password="${envPassword}"`);

    if (cleanUsername === envUsername && cleanPassword === envPassword) {
        req.session.isAdmin = true;
        req.flash('success', 'Successfully logged in as Admin! Welcome back.');
        res.redirect('/admin/dashboard');
    } else {
        req.flash('error', 'Invalid admin username or password.');
        res.redirect('/admin/login');
    }
};

// Handle admin logout
module.exports.logout = (req, res) => {
    req.session.isAdmin = false;
    req.flash('success', 'Logged out successfully.');
    res.redirect('/');
};

// Render admin dashboard
module.exports.dashboard = async (req, res) => {
    const studentCount = await Student.countDocuments({});
    const teacherCount = await Teacher.countDocuments({});
    const classCount = await Class.countDocuments({});
    
    res.render('admin/dashboard', { 
        studentCount, 
        teacherCount, 
        classCount,
        title: 'Admin Dashboard - Shri Ganesh Classes' 
    });
};