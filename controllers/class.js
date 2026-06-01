/**
 * controllers/class.js
 * Shri Ganesh Classes Attendance Management System
 */

const Class = require('../models/class');
const Teacher = require('../models/teacher');
const ExpressError = require('../utils/expressError');

// Show all classes and handle adding new classes on the same page
module.exports.index = async (req, res) => {
    const classes = await Class.find({}).populate('assignedTeacher').sort({ className: 1 });
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
    
    // Sync with Teacher: update the assignedClass of the teacher
    if (newClass.assignedTeacher) {
        await Teacher.findByIdAndUpdate(newClass.assignedTeacher, { assignedClass: newClass._id });
    }
    
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
    
    // Sync teacher relationships
    if (String(oldClass.assignedTeacher) !== String(updatedClass.assignedTeacher)) {
        // Remove class from old teacher
        if (oldClass.assignedTeacher) {
            await Teacher.findByIdAndUpdate(oldClass.assignedTeacher, { assignedClass: null });
        }
        // Add class to new teacher
        if (updatedClass.assignedTeacher) {
            await Teacher.findByIdAndUpdate(updatedClass.assignedTeacher, { assignedClass: updatedClass._id });
        }
    }
    
    res.redirect('/classes');
};

// Delete Class
module.exports.deleteClass = async (req, res) => {
    const { id } = req.params;
    const classItem = await Class.findById(id);
    if (!classItem) {
        throw new ExpressError(404, 'Class not found');
    }
    
    // Remove class reference from the assigned teacher
    if (classItem.assignedTeacher) {
        await Teacher.findByIdAndUpdate(classItem.assignedTeacher, { assignedClass: null });
    }
    
    await Class.findByIdAndDelete(id);
    res.redirect('/classes');
};
