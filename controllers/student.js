/**
 * controllers/student.js
 * Shri Ganesh Classes Attendance Management System
 */

const Student = require('../models/student');
const ExpressError = require('../utils/expressError');

// Show all students
module.exports.index = async (req, res) => {
    const students = await Student.find({}).sort({ createdAt: -1 });
    res.render('students/index', { students, title: 'All Students - Shri Ganesh Classes' });
};

// Render form to create new student
module.exports.renderNewForm = (req, res) => {
    res.render('students/new', { title: 'Add New Student - Shri Ganesh Classes' });
};

// Show details of a specific student
module.exports.showStudent = async (req, res) => {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    res.render('students/show', { student, title: `${student.name} - Profile` });
};

// Create a new student in DB
module.exports.createStudent = async (req, res) => {
    if (!req.body.student) {
        throw new ExpressError(400, 'Invalid Student Data');
    }
    const student = new Student(req.body.student);
    await student.save();
    res.redirect('/students');
};

// Render form to edit a student
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    res.render('students/edit', { student, title: `Edit Student - ${student.name}` });
};

// Update student details
module.exports.updateStudent = async (req, res) => {
    const { id } = req.params;
    if (!req.body.student) {
        throw new ExpressError(400, 'Invalid Student Data');
    }
    const student = await Student.findByIdAndUpdate(id, { ...req.body.student }, { new: true, runValidators: true });
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    res.redirect(`/students/${student._id}`);
};

// Delete student
module.exports.deleteStudent = async (req, res) => {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    res.redirect('/students');
};
