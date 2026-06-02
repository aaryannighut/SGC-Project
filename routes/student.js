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
router.get('/class/:className/new', isAdmin, studentController.renderNewForm);

// /students/:id
router.get('/:id', wrapAsync(studentController.showStudent));
router.put('/:id', isAdmin, wrapAsync(studentController.updateStudent));
router.delete('/:id', isAdmin, wrapAsync(studentController.deleteStudent));

// /students/:id/attendance
router.patch('/:id/attendance', wrapAsync(studentController.toggleAttendance));

// /students/:id/edit
router.get('/:id/edit', isAdmin, wrapAsync(studentController.renderEditForm));

module.exports = router;
