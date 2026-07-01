/**
 * controllers/teacher.js
 * Shri Ganesh Classes Attendance Management System
 */

const Teacher = require('../models/teacher');
const Class = require('../models/class');
const ExpressError = require('../utils/expressError');

// Show all teachers
module.exports.index = async (req, res) => {
    const teachers = await Teacher.find({}).sort({ createdAt: -1 });
    res.render('teachers/index', { teachers, title: 'All Teachers - Shri Ganesh Classes' });
};

// Render form to create new teacher
module.exports.renderNewForm = async (req, res) => {
    res.render('teachers/new', { title: 'Add New Teacher - Shri Ganesh Classes' });
};

// Show details of a specific teacher
module.exports.showTeacher = async (req, res) => {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
        throw new ExpressError(404, 'Teacher not found');
    }
    res.render('teachers/show', { teacher, title: `${teacher.name} - Profile` });
};

// Create a new teacher in DB
module.exports.createTeacher = async (req, res) => {
    if (!req.body.teacher) {
        throw new ExpressError(400, 'Invalid Teacher Data');
    }
    const teacher = new Teacher(req.body.teacher);
    await teacher.save();
    res.redirect('/teachers');
};

// Render form to edit a teacher
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
        throw new ExpressError(404, 'Teacher not found');
    }
    res.render('teachers/edit', { teacher, title: `Edit Teacher - ${teacher.name}` });
};

// Update teacher details
module.exports.updateTeacher = async (req, res) => {
    const { id } = req.params;
    if (!req.body.teacher) {
        throw new ExpressError(400, 'Invalid Teacher Data');
    }
    const teacher = await Teacher.findByIdAndUpdate(id, { ...req.body.teacher }, { new: true, runValidators: true });
    if (!teacher) {
        throw new ExpressError(404, 'Teacher not found');
    }
    res.redirect('/teachers');
};

// Delete teacher
module.exports.deleteTeacher = async (req, res) => {
    const { id } = req.params;
    const teacher = await Teacher.findByIdAndDelete(id);
    if (!teacher) {
        throw new ExpressError(404, 'Teacher not found');
    }
    res.redirect('/teachers');
};
