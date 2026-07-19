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
    serialNo: {
        type: Number,
        required: true
    },
    className: {
        type: String,
        required: true
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
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        default: 'Present'
    },
    totalFee: {
        type: Number,
        default: 0
    },
    receivedFee: {
        type: Number,
        default: 0
    },
    pendingFee: {
        type: Number,
        default: 0
    },
    paymentHistory: [
        {
            amount: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                required: true,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
