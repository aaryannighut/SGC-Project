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
        req.session.save((err) => {
            if (err) console.error("Session save error:", err);
            res.redirect('/admin/dashboard');
        });
    } else {
        req.flash('error', 'Invalid admin username or password.');
        res.redirect('/admin/login');
    }
};

// Handle admin logout
module.exports.logout = (req, res) => {
    req.session.isAdmin = false;
    req.session.save((err) => {
        if (err) console.error("Session save error:", err);
        req.flash('success', 'Logged out successfully.');
        res.redirect('/');
    });
};

// Render admin dashboard
module.exports.dashboard = async (req, res) => {
    const studentCount = await Student.countDocuments({});
    const teacherCount = await Teacher.countDocuments({});
    const classes = await Class.find({});
    classes.sort((a, b) => a.className.localeCompare(b.className, 'en', { numeric: true }));
    const classCount = classes.length;

    const allowedClasses = classes.map(c => c.className);
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
            const seenAbsents = new Set();
            classRecords.forEach(r => {
                if (r.status === 'Absent' && r.student) {
                    seenAbsents.add(r.student.toString());
                }
            });
            const absentCount = seenAbsents.size;
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
        allowedClasses,
        title: 'Admin Dashboard - Shri Ganesh Classes' 
    });
};

// Render a view listing all absent students for a class today
module.exports.showClassAbsentees = async (req, res) => {
    const { className } = req.params;
    const existingClass = await Class.findOne({ className });
    if (!existingClass) {
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

    // Deduplicate records by student ID to handle any concurrent duplicate submissions
    const uniqueAbsentRecords = [];
    const seenStudentIds = new Set();
    for (const record of absentRecords) {
        if (record.student) {
            const studentId = record.student._id.toString();
            if (!seenStudentIds.has(studentId)) {
                seenStudentIds.add(studentId);
                uniqueAbsentRecords.push(record);
            }
        } else {
            uniqueAbsentRecords.push(record);
        }
    }

    // Sort absent records alphabetically by student name
    uniqueAbsentRecords.sort((a, b) => {
        const nameA = a.student ? a.student.name : '';
        const nameB = b.student ? b.student.name : '';
        return nameA.localeCompare(nameB, 'en', { sensitivity: 'base', numeric: true });
    });

    res.render('admin/classAbsentees', {
        className,
        absentRecords: uniqueAbsentRecords,
        title: `Class ${className} Absentees Report - Shri Ganesh Classes`
    });
};

// Send WhatsApp notifications to parents of absent students for a class standard today
module.exports.sendWhatsAppToAbsentees = async (req, res) => {
    const { className } = req.params;
    const existingClass = await Class.findOne({ className });
    if (!existingClass) {
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
    }).populate('student');

    if (absentRecords.length === 0) {
        req.flash('error', `No absent students found today for Class ${className} to notify.`);
        return res.redirect(`/admin/attendance/class/${className}`);
    }

    const { sendWhatsAppMessage } = require('../utils/whatsapp');
    const whatsappPromises = [];
    const seenStudentIds = new Set();

    for (const record of absentRecords) {
        if (record.student) {
            const studentId = record.student._id.toString();
            if (!seenStudentIds.has(studentId)) {
                seenStudentIds.add(studentId);
                if (record.student.parentMobile) {
                    whatsappPromises.push(sendWhatsAppMessage(record.student.parentMobile, record.student.name, className));
                } else {
                    console.warn(`[ADMIN WORKFLOW WARNING] Absent student ${record.student.name} has no parent mobile number on record.`);
                }
            }
        }
    }

    try {
        await Promise.allSettled(whatsappPromises);
        req.flash('success', `WhatsApp notifications triggered for absent students of Class ${className}!`);
    } catch (err) {
        console.error(`[ADMIN WORKFLOW ERROR] Error triggering WhatsApp notifications:`, err);
        req.flash('error', 'Something went wrong while sending WhatsApp notifications.');
    }

    res.redirect(`/admin/attendance/class/${className}`);
};