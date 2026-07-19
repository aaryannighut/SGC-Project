/**
 * controllers/student.js
 * Shri Ganesh Classes Attendance Management System
 */

const Student = require('../models/student');
const Attendance = require('../models/attendance');
const Class = require('../models/class');
const Teacher = require('../models/teacher');
const ExpressError = require('../utils/expressError');
const { getTodayMidnightIST } = require('../utils/attendanceReset');

// Helper to re-index serial numbers of students alphabetically by name within a class
const reindexStudentsByClass = async (className) => {
    const students = await Student.find({ className });
    students.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }));
    for (let i = 0; i < students.length; i++) {
        await Student.findByIdAndUpdate(students[i]._id, { serialNo: i + 1 });
    }
};

// Show class selection dashboard
module.exports.index = async (req, res) => {
    const classes = await Class.find({});
    classes.sort((a, b) => a.className.localeCompare(b.className, 'en', { numeric: true }));
    const classCounts = {};
    for (let c of classes) {
        classCounts[c.className] = await Student.countDocuments({ className: c.className });
    }
    res.render('students/selectClass', { classes, classCounts, title: 'Select Class - Shri Ganesh Classes' });
};

// Show registry for a specific class
module.exports.showClassRegistry = async (req, res) => {
    const { className } = req.params;
    const existingClass = await Class.findOne({ className });
    if (!existingClass) {
        throw new ExpressError(400, 'Invalid class standard');
    }
    
    // Auto re-index when displaying the registry to ensure everything is sorted alphabetically
    await reindexStudentsByClass(className);
    
    // Calculate midnight today in IST timezone using shared helper
    const midnightIST = getTodayMidnightIST();
    
    // Reset status to 'Present' for students whose records haven't been updated today yet
    await Student.updateMany(
        { 
            className, 
            $or: [
                { updatedAt: { $lt: midnightIST } },
                { status: { $exists: false } }
            ]
        },
        { status: 'Present' }
    );
    
    const students = await Student.find({ className }).sort({ serialNo: 1 });
    res.render('students/index', { students, className, title: `Class ${className} Registry - Shri Ganesh Classes` });
};

// Render form to create new student in a specific class
module.exports.renderNewForm = async (req, res) => {
    const { className } = req.params;
    const existingClass = await Class.findOne({ className });
    if (!existingClass) {
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
    
    const totalFee = parseFloat(req.body.student.totalFee) || 0;
    const receivedFee = parseFloat(req.body.student.receivedFee) || 0;
    const pendingFee = totalFee - receivedFee;
    
    const paymentHistory = [];
    if (receivedFee > 0) {
        paymentHistory.push({
            amount: receivedFee,
            date: new Date()
        });
    }
    
    const student = new Student({
        ...req.body.student,
        totalFee,
        receivedFee,
        pendingFee,
        className,
        serialNo: nextSerialNo,
        paymentHistory
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
    
    const student = await Student.findById(id);
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    
    const totalFee = typeof req.body.student.totalFee !== 'undefined' 
        ? parseFloat(req.body.student.totalFee) || 0 
        : student.totalFee;
    const receivedFee = typeof req.body.student.receivedFee !== 'undefined' 
        ? parseFloat(req.body.student.receivedFee) || 0 
        : student.receivedFee;
    const pendingFee = Math.max(0, totalFee - receivedFee);
    
    const feeDiff = receivedFee - student.receivedFee;
    if (feeDiff > 0) {
        student.paymentHistory.push({
            amount: feeDiff,
            date: new Date()
        });
    }
    
    const updatedData = {
        ...req.body.student,
        totalFee,
        receivedFee,
        pendingFee,
        paymentHistory: student.paymentHistory
    };
    
    const updatedStudent = await Student.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
    res.redirect(`/students/class/${updatedStudent.className}`);
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

// Show attendance review/summary for absent students
module.exports.showAttendanceSummary = async (req, res) => {
    const { className } = req.params;
    const existingClass = await Class.findOne({ className });
    if (!existingClass) {
        throw new ExpressError(400, 'Invalid class standard');
    }
    
    // Auto re-index to ensure everything is sorted alphabetically
    await reindexStudentsByClass(className);
    
    // Fetch all students in this class
    const students = await Student.find({ className }).sort({ serialNo: 1 });
    
    // Calculate counts
    const totalCount = students.length;
    const presentCount = students.filter(s => s.status === 'Present').length;
    const absentCount = students.filter(s => s.status === 'Absent' || !s.status).length;
    
    // Filter absent students
    const absentStudents = students.filter(s => s.status === 'Absent' || !s.status);
    
    res.render('students/attendanceSummary', {
        className,
        totalCount,
        presentCount,
        absentCount,
        absentStudents,
        title: `Class ${className} Attendance Summary`
    });
};

// Send attendance data to admin (save to Attendance collection)
module.exports.sendAttendanceToAdmin = async (req, res) => {
    const { className } = req.params;
    const existingClass = await Class.findOne({ className });
    if (!existingClass) {
        throw new ExpressError(400, 'Invalid class standard');
    }
    
    // Auto re-index to ensure everything is sorted alphabetically
    await reindexStudentsByClass(className);
    
    // Find all students in this class
    const students = await Student.find({ className }).sort({ serialNo: 1 });
    if (students.length === 0) {
        req.flash('error', `No students found in Class ${className} to record attendance.`);
        return res.redirect('/students');
    }
    
    // Determine the teacher ID for recording the attendance log
    let teacherId = req.session.teacherId;
    if (!teacherId) {
        // Fallback 1: Assigned teacher of the class
        const classDoc = await Class.findOne({ className });
        teacherId = classDoc && classDoc.assignedTeacher;
    }
    if (!teacherId) {
        // Fallback 2: First teacher in the DB (for Admin logins or unassigned classes)
        const firstTeacher = await Teacher.findOne({});
        teacherId = firstTeacher && firstTeacher._id;
    }
    if (!teacherId) {
        throw new ExpressError(500, 'No registered teachers found in database to associate with this attendance record.');
    }
    
    // Date boundaries for today (server local day) to avoid duplicates
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Remove previous records for this class standard today to prevent double logging
    await Attendance.deleteMany({
        className,
        date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const submittedByAdmin = !!req.session.isAdmin;
    
    const { sendWhatsAppMessage } = require('../utils/whatsapp');

    // Insert new attendance log entries for all students
    const attendanceRecords = students.map(student => ({
        student: student._id,
        teacher: teacherId,
        className,
        date: new Date(),
        status: student.status || 'Absent',
        submittedByAdmin
    }));
    
    await Attendance.insertMany(attendanceRecords);
    
    // Trigger WhatsApp notifications for absent students
    console.log(`\n✓ Attendance saved`);
    const whatsappPromises = [];
    for (const record of attendanceRecords) {
        if (record.status === 'Absent') {
            const student = students.find(s => s._id.toString() === record.student.toString());
            if (student && student.parentMobile) {
                console.log(`✓ Parent number found`);
                console.log(`✓ Sending WhatsApp notification`);
                whatsappPromises.push(sendWhatsAppMessage(student.parentMobile, student.name, className));
            } else {
                console.warn(`[ATTENDANCE WORKFLOW WARNING] Absent student ${student ? student.name : 'Unknown'} has no parent mobile number on record.`);
            }
        }
    }
    
    // Await all WhatsApp messages without crashing the server if they fail
    try {
        await Promise.allSettled(whatsappPromises);
        console.log(`[ATTENDANCE WORKFLOW] WhatsApp delivered (completed processing all absent students).`);
    } catch (err) {
        console.error(`[ATTENDANCE WORKFLOW ERROR] API error if failed:`, err);
    }
    
    if (req.session.isAdmin) {
        req.flash('success', `Attendance report for Class ${className} recorded & WhatsApp notifications triggered!`);
    } else {
        req.flash('success', `Attendance report for Class ${className} sent to Admin successfully!`);
    }
    res.redirect('/students');
};

// Show history scope selection page (Admin) or redirect to months selection (Teacher)
module.exports.showHistoryMonths = async (req, res) => {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    
    // Determine teacher's subject if applicable
    if (req.session.isTeacher) {
        const teacher = await Teacher.findById(req.session.teacherId);
        const subjectName = teacher ? teacher.subject : null;
        if (subjectName) {
            return res.redirect(`/students/${id}/history/months?subject=${encodeURIComponent(subjectName)}`);
        }
    }
    
    // If Admin, redirect directly to overall attendance months view
    res.redirect(`/students/${id}/history/months?subject=all`);
};

// Show 12-month calendar grid for the selected scope
module.exports.showHistoryMonthsSelector = async (req, res) => {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    
    // Determine subject filter (default: 'all' or teacher's subject)
    let subject = req.query.subject || 'all';
    if (req.session.isTeacher) {
        const teacher = await Teacher.findById(req.session.teacherId);
        subject = teacher ? teacher.subject : 'all';
    }
    
    // Build query
    const query = { student: id };
    if (subject !== 'all') {
        const siblingTeachers = await Teacher.find({ subject }).select('_id');
        const teacherIds = siblingTeachers.map(t => t._id);
        query.teacher = { $in: teacherIds };
    }
    
    const records = await Attendance.find(query);
    
    // Calculate absent days per month for the current year
    const currentYear = new Date().getFullYear();
    const monthAbsences = Array(12).fill(0);
    
    records.forEach(record => {
        const recDate = new Date(record.date);
        if (recDate.getFullYear() === currentYear && record.status === 'Absent') {
            monthAbsences[recDate.getMonth()]++;
        }
    });
    
    res.render('students/attendanceHistoryMonths', {
        student,
        monthAbsences,
        currentYear,
        subject,
        title: `${student.name} - Attendance Calendar`
    });
};

// Show detailed monthly absenteeism log
module.exports.showHistoryDetail = async (req, res) => {
    const { id, year, month } = req.params;
    const student = await Student.findById(id);
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    
    const parsedYear = parseInt(year, 10);
    const parsedMonth = parseInt(month, 10);
    if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 0 || parsedMonth > 11) {
        throw new ExpressError(400, 'Invalid year or month');
    }
    
    // Determine subject filter
    let subject = req.query.subject || 'all';
    if (req.session.isTeacher) {
        const teacher = await Teacher.findById(req.session.teacherId);
        subject = teacher ? teacher.subject : 'all';
    }
    
    // Date boundaries
    const startOfMonth = new Date(parsedYear, parsedMonth, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(parsedYear, parsedMonth + 1, 0, 23, 59, 59, 999);
    
    // Build query
    const query = {
        student: id,
        date: { $gte: startOfMonth, $lte: endOfMonth }
    };
    if (subject !== 'all') {
        const siblingTeachers = await Teacher.find({ subject }).select('_id');
        const teacherIds = siblingTeachers.map(t => t._id);
        query.teacher = { $in: teacherIds };
    }
    
    const records = await Attendance.find(query).populate('teacher').sort({ date: 1 });
    
    // Calculate stats
    const totalSessions = records.length;
    const absentDays = records.filter(r => r.status === 'Absent').length;
    const presentDays = records.filter(r => r.status === 'Present').length;
    const absenteeismRate = totalSessions > 0 ? ((absentDays / totalSessions) * 100).toFixed(1) : '0.0';
    
    res.render('students/attendanceHistoryDetail', {
        student,
        records,
        year: parsedYear,
        month: parsedMonth,
        totalSessions,
        absentDays,
        presentDays,
        absenteeismRate,
        subject,
        title: `${student.name} - Monthly Details`
    });
};

// Update student fees details
module.exports.updateStudentFees = async (req, res) => {
    const { id } = req.params;
    if (!req.body.student) {
        throw new ExpressError(400, 'Invalid Student Fee Data');
    }
    
    const student = await Student.findById(id);
    if (!student) {
        throw new ExpressError(404, 'Student not found');
    }
    
    const { totalFee, currentPayment } = req.body.student;
    const parsedTotal = parseFloat(totalFee) || 0;
    const parsedCurrentPayment = parseFloat(currentPayment) || 0;
    
    const newReceivedFee = student.receivedFee + parsedCurrentPayment;
    const parsedPending = Math.max(0, parsedTotal - newReceivedFee);
    
    student.totalFee = parsedTotal;
    student.receivedFee = newReceivedFee;
    student.pendingFee = parsedPending;
    
    if (parsedCurrentPayment > 0) {
        student.paymentHistory.push({
            amount: parsedCurrentPayment,
            date: new Date()
        });
    }
    await student.save();
    
    req.flash('success', `Fees updated for ${student.name} successfully.`);
    res.redirect(`/students/class/${student.className}`);
};

// Send WhatsApp fee reminders for pending amounts to all parents in a class standard
module.exports.notifyPendingFees = async (req, res) => {
    const { className } = req.params;
    const existingClass = await Class.findOne({ className });
    if (!existingClass) {
        throw new ExpressError(400, 'Invalid class standard');
    }
    
    const students = await Student.find({ className });
    const pendingStudents = students.filter(s => s.pendingFee > 0);
    
    if (pendingStudents.length === 0) {
        req.flash('error', `No students with pending fees found in Class ${className}.`);
        return res.redirect(`/students/class/${className}`);
    }
    
    const { sendWhatsAppFeeMessage } = require('../utils/whatsapp');
    const whatsappPromises = [];
    
    for (const student of pendingStudents) {
        if (student.parentMobile) {
            whatsappPromises.push(sendWhatsAppFeeMessage(student.parentMobile, student.name, className, student.pendingFee));
        } else {
            console.warn(`[FEES WORKFLOW WARNING] Student ${student.name} has pending fee but no parent mobile number.`);
        }
    }
    
    try {
        await Promise.allSettled(whatsappPromises);
        req.flash('success', `WhatsApp fee notifications sent successfully for Class ${className}!`);
    } catch (err) {
        console.error('[FEES WORKFLOW ERROR]', err);
        req.flash('error', 'Failed to send some fee notifications.');
    }
    
    res.redirect(`/students/class/${className}`);
};
