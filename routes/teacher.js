/**
 * routes/teacher.js
 * Teacher routes for Shri Ganesh Classes Attendance Management System
 */

const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher');
const wrapAsync = require('../utils/wrapAsync');

// /teachers
router.route('/')
    .get(wrapAsync(teacherController.index))
    .post(wrapAsync(teacherController.createTeacher));

// /teachers/new
router.get('/new', wrapAsync(teacherController.renderNewForm));

// /teachers/:id
router.route('/:id')
    .get(wrapAsync(teacherController.showTeacher))
    .put(wrapAsync(teacherController.updateTeacher))
    .delete(wrapAsync(teacherController.deleteTeacher));

// /teachers/:id/edit
router.get('/:id/edit', wrapAsync(teacherController.renderEditForm));

module.exports = router;
