/**
 * controllers/student.js
 * Shri Ganesh Classes Attendance Management System
 */

const Student = require('../models/student');
const ExpressError = require('../utils/expressError');

// Show class selection dashboard
module.exports.index = async (req, res) => {
    const classNames = ['5th', '6th', '7th', '8th', '9th', '10th'];
    const classCounts = {};
    for (let name of classNames) {
        classCounts[name] = await Student.countDocuments({ className: name });
    }
    res.render('students/selectClass', { classCounts, title: 'Select Class - Shri Ganesh Classes' });
};

// Show registry for a specific class
module.exports.showClassRegistry = async (req, res) => {
    const { className } = req.params;
    const allowedClasses = ['5th', '6th', '7th', '8th', '9th', '10th'];
    if (!allowedClasses.includes(className)) {
        throw new ExpressError(400, 'Invalid class standard');
    }
    const students = await Student.find({ className }).sort({ serialNo: 1 });
    res.render('students/index', { students, className, title: `Class ${className} Registry - Shri Ganesh Classes` });
};

// Render form to create new student in a specific class
module.exports.renderNewForm = (req, res) => {
    const { className } = req.params;
    const allowedClasses = ['5th', '6th', '7th', '8th', '9th', '10th'];
    if (!allowedClasses.includes(className)) {
        throw new ExpressError(400, 'Invalid class standard');
    }
    res.render('students/new', { className, title: `Add Student to Class ${className} - Shri Ganesh Classes` });
};

// Create a new student in DB
module.exports.createStudent = async (req, res) => {
    const { className } = req.params;
    if (!req.body.student) {
        throw new ExpressError(400, 'Invalid Student Data');
    }
    
    // Auto-generate serialNo by finding the maximum serialNo currently in this class
    const lastStudent = await Student.findOne({ className }).sort({ serialNo: -1 });
    const nextSerialNo = lastStudent && typeof lastStudent.serialNo === 'number' ? lastStudent.serialNo + 1 : 1;
    
    const student = new Student({
        ...req.body.student,
        className,
        serialNo: nextSerialNo
    });
    await student.save();
    res.redirect(`/students/class/${className}`);
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
    
    // Re-index subsequent students within the same class
    if (typeof student.serialNo === 'number') {
        await Student.updateMany(
            { className: student.className, serialNo: { $gt: student.serialNo } },
            { $inc: { serialNo: -1 } }
        );
    }
    
    res.redirect(`/students/class/${student.className}`);
};

// Toggle student attendance status
module.exports.toggleAttendance = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Present', 'Absent'].includes(status)) {
        throw new ExpressError(400, 'Invalid attendance status');
    }
    
    const student = await Student.findByIdAndUpdate(id, { status }, { new: true });
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    
    res.json({ success: true, status: student.status });
};
