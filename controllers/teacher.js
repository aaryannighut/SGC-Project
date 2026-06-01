/**
 * controllers/teacher.js
 * Shri Ganesh Classes Attendance Management System
 */

const Teacher = require('../models/teacher');
const Class = require('../models/class');
const ExpressError = require('../utils/expressError');

// Show all teachers
module.exports.index = async (req, res) => {
    const teachers = await Teacher.find({}).populate('assignedClass').sort({ createdAt: -1 });
    res.render('teachers/index', { teachers, title: 'All Teachers - Shri Ganesh Classes' });
};

// Render form to create new teacher
module.exports.renderNewForm = async (req, res) => {
    const classes = await Class.find({});
    res.render('teachers/new', { classes, title: 'Add New Teacher - Shri Ganesh Classes' });
};

// Show details of a specific teacher
module.exports.showTeacher = async (req, res) => {
    const { id } = req.params;
    const teacher = await Teacher.findById(id).populate('assignedClass');
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
    
    const teacherData = req.body.teacher;
    if (teacherData.assignedClass === '') {
        teacherData.assignedClass = null;
    }
    
    const teacher = new Teacher(teacherData);
    await teacher.save();
    
    // If a class is assigned, set this teacher as the class's assigned teacher
    if (teacher.assignedClass) {
        await Class.findByIdAndUpdate(teacher.assignedClass, { assignedTeacher: teacher._id });
    }
    
    res.redirect('/teachers');
};

// Render form to edit a teacher
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
        throw new ExpressError(404, 'Teacher not found');
    }
    const classes = await Class.find({});
    res.render('teachers/edit', { teacher, classes, title: `Edit Teacher - ${teacher.name}` });
};

// Update teacher details
module.exports.updateTeacher = async (req, res) => {
    const { id } = req.params;
    if (!req.body.teacher) {
        throw new ExpressError(400, 'Invalid Teacher Data');
    }
    
    const teacherData = req.body.teacher;
    if (teacherData.assignedClass === '') {
        teacherData.assignedClass = null;
    }
    
    const oldTeacher = await Teacher.findById(id);
    if (!oldTeacher) {
        throw new ExpressError(404, 'Teacher not found');
    }
    
    const teacher = await Teacher.findByIdAndUpdate(id, { ...teacherData }, { new: true, runValidators: true });
    
    // Check if class assignment has changed to keep class and teacher records in sync
    if (String(oldTeacher.assignedClass) !== String(teacher.assignedClass)) {
        // Remove teacher from old class
        if (oldTeacher.assignedClass) {
            await Class.findByIdAndUpdate(oldTeacher.assignedClass, { assignedTeacher: null });
        }
        // Add teacher to new class
        if (teacher.assignedClass) {
            await Class.findByIdAndUpdate(teacher.assignedClass, { assignedTeacher: teacher._id });
        }
    }
    
    res.redirect(`/teachers/${teacher._id}`);
};

// Delete teacher
module.exports.deleteTeacher = async (req, res) => {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
        throw new ExpressError(404, 'Teacher not found');
    }
    
    // Remove teacher reference from their assigned class
    if (teacher.assignedClass) {
        await Class.findByIdAndUpdate(teacher.assignedClass, { assignedTeacher: null });
    }
    
    await Teacher.findByIdAndDelete(id);
    res.redirect('/teachers');
};
