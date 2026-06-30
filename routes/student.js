/**
 * routes/student.js
 * Student routes for Shri Ganesh Classes Attendance Management System
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student');
const wrapAsync = require('../utils/wrapAsync');
const { isAdmin } = require('../middleware');

// /students
router.get('/', wrapAsync(studentController.index));

// Redirect legacy /students/new to class selector
router.get('/new', isAdmin, (req, res) => {
    req.flash('error', 'Please select a class standard first to enroll a student.');
    res.redirect('/students');
});

// Class-specific routes
router.get('/class/:className', wrapAsync(studentController.showClassRegistry));
router.post('/class/:className', isAdmin, wrapAsync(studentController.createStudent));
router.get('/class/:className/new', isAdmin, wrapAsync(studentController.renderNewForm));
router.get('/class/:className/attendance-summary', wrapAsync(studentController.showAttendanceSummary));
router.post('/class/:className/send-to-admin', wrapAsync(studentController.sendAttendanceToAdmin));
router.post('/class/:className/fees/notify', isAdmin, wrapAsync(studentController.notifyPendingFees));

// /students/:id
router.get('/:id', wrapAsync(studentController.showStudent));
router.put('/:id', isAdmin, wrapAsync(studentController.updateStudent));
router.put('/:id/fees', isAdmin, wrapAsync(studentController.updateStudentFees));
router.delete('/:id', isAdmin, wrapAsync(studentController.deleteStudent));
router.get('/:id/history', wrapAsync(studentController.showHistoryMonths));
router.get('/:id/history/months', wrapAsync(studentController.showHistoryMonthsSelector));
router.get('/:id/history/:year/:month', wrapAsync(studentController.showHistoryDetail));

// /students/:id/attendance
router.patch('/:id/attendance', wrapAsync(studentController.toggleAttendance));

// /students/:id/edit
router.get('/:id/edit', isAdmin, wrapAsync(studentController.renderEditForm));

module.exports = router;
