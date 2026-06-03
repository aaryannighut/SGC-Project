/**
 * models/teacher.js - Teacher Model Schema
 * Shri Ganesh Classes Attendance Management System
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
