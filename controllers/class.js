/**
 * controllers/class.js
 * Shri Ganesh Classes Attendance Management System
 */

const Class = require('../models/class');
const Teacher = require('../models/teacher');
const ExpressError = require('../utils/expressError');

// Show all classes and handle adding new classes on the same page
module.exports.index = async (req, res) => {
    const classes = await Class.find({}).populate('assignedTeacher');
    classes.sort((a, b) => a.className.localeCompare(b.className, 'en', { numeric: true }));
    const teachers = await Teacher.find({});
    res.render('classes/index', { classes, teachers, title: 'Manage Classes - Shri Ganesh Classes' });
};

// Create a new Class
module.exports.createClass = async (req, res) => {
    if (!req.body.class) {
        throw new ExpressError(400, 'Invalid Class Data');
    }
    
    const classData = req.body.class;
    if (classData.assignedTeacher === '') {
        classData.assignedTeacher = null;
    }
    
    // Check if class already exists
    const existingClass = await Class.findOne({ className: classData.className });
    if (existingClass) {
        throw new ExpressError(400, `Class ${classData.className} already exists`);
    }
    
    const newClass = new Class(classData);
    await newClass.save();
    
    res.redirect('/classes');
};

// Update Class details (like assigning/changing teacher)
module.exports.updateClass = async (req, res) => {
    const { id } = req.params;
    if (!req.body.class) {
        throw new ExpressError(400, 'Invalid Class Data');
    }
    
    const classData = req.body.class;
    if (classData.assignedTeacher === '') {
        classData.assignedTeacher = null;
    }
    
    const oldClass = await Class.findById(id);
    if (!oldClass) {
        throw new ExpressError(404, 'Class not found');
    }
    
    const updatedClass = await Class.findByIdAndUpdate(id, { ...classData }, { new: true, runValidators: true });
    
    res.redirect('/classes');
};

// Delete Class
module.exports.deleteClass = async (req, res) => {
    const { id } = req.params;
    const classItem = await Class.findById(id);
    if (!classItem) {
        throw new ExpressError(404, 'Class not found');
    }
    
    // Delete all students belonging to this class standard
    const Student = require('../models/student');
    await Student.deleteMany({ className: classItem.className });
    
    // Delete all attendance records associated with this class standard
    const Attendance = require('../models/attendance');
    await Attendance.deleteMany({ className: classItem.className });
    
    await Class.findByIdAndDelete(id);
    res.redirect('/classes');
};
