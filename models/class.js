/**
 * models/class.js - Class Model Schema
 * Shri Ganesh Classes Attendance Management System
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const classSchema = new Schema({
    className: {
        type: String,
        required: true,
        unique: true,
        enum: ['5th', '6th', '7th', '8th', '9th', '10th']
    },
    assignedTeacher: {
        type: Schema.Types.ObjectId,
        ref: 'Teacher'
    }
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
