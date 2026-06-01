/**
 * routes/student.js
 * Student routes for Shri Ganesh Classes Attendance Management System
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student');
const wrapAsync = require('../utils/wrapAsync');

// /students
router.route('/')
    .get(wrapAsync(studentController.index))
    .post(wrapAsync(studentController.createStudent));

// /students/new
router.get('/new', studentController.renderNewForm);

// /students/:id
router.route('/:id')
    .get(wrapAsync(studentController.showStudent))
    .put(wrapAsync(studentController.updateStudent))
    .delete(wrapAsync(studentController.deleteStudent));

// /students/:id/edit
router.get('/:id/edit', wrapAsync(studentController.renderEditForm));

module.exports = router;
