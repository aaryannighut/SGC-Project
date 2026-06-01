/**
 * routes/class.js
 * Class routes for Shri Ganesh Classes Attendance Management System
 */

const express = require('express');
const router = express.Router();
const classController = require('../controllers/class');
const wrapAsync = require('../utils/wrapAsync');

// /classes
router.route('/')
    .get(wrapAsync(classController.index))
    .post(wrapAsync(classController.createClass));

// /classes/:id
router.route('/:id')
    .put(wrapAsync(classController.updateClass))
    .delete(wrapAsync(classController.deleteClass));

module.exports = router;
