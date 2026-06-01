/**
 * models/student.js - Student Model Schema
 * Shri Ganesh Classes Attendance Management System
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const studentSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    rollNo: {
        type: String,
        required: true,
        trim: true
    },
    className: {
        type: String,
        required: true,
        enum: ['5th', '6th', '7th', '8th', '9th', '10th']
    },
    parentName: {
        type: String,
        required: true,
        trim: true
    },
    parentMobile: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
