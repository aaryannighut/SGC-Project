/**
 * controllers/admin.js
 * Admin authentication and dashboard logic
 */

const Student = require('../models/student');
const Teacher = require('../models/teacher');
const Class = require('../models/class');
const Attendance = require('../models/attendance');
const ExpressError = require('../utils/expressError');

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

    const allowedClasses = ['5th', '6th', '7th', '8th', '9th', '10th'];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get all today's attendance logs
    const todayAttendance = await Attendance.find({
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    const classAttendanceSummary = {};
    for (let className of allowedClasses) {
        const classRecords = todayAttendance.filter(r => r.className === className);
        if (classRecords.length > 0) {
            const absentCount = classRecords.filter(r => r.status === 'Absent').length;
            const submittedByAdmin = classRecords.some(r => r.submittedByAdmin === true);
            classAttendanceSummary[className] = {
                submitted: true,
                absentCount,
                submittedByAdmin
            };
        } else {
            classAttendanceSummary[className] = {
                submitted: false,
                absentCount: 0
            };
        }
    }
    
    res.render('admin/dashboard', { 
        studentCount, 
        teacherCount, 
        classCount,
        classAttendanceSummary,
        title: 'Admin Dashboard - Shri Ganesh Classes' 
    });
};

// Render a view listing all absent students for a class today
module.exports.showClassAbsentees = async (req, res) => {
    const { className } = req.params;
    const allowedClasses = ['5th', '6th', '7th', '8th', '9th', '10th'];
    if (!allowedClasses.includes(className)) {
        throw new ExpressError(400, 'Invalid class standard');
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find all today's absent records for this class standard, populating details
    const absentRecords = await Attendance.find({
        className,
        status: 'Absent',
        date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('student').populate('teacher');

    res.render('admin/classAbsentees', {
        className,
        absentRecords,
        title: `Class ${className} Absentees Report - Shri Ganesh Classes`
    });
};