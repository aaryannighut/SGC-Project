const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/sgc_attendance')
    .then(async () => {
        const Student = require('../models/student');
        const Class = require('../models/class');
        const Attendance = require('../models/attendance');

        const classes = await Class.find({});
        const activeClassNames = classes.map(c => c.className);
        console.log('Active classes:', activeClassNames);

        // Delete students whose className is not active
        const deleteResult = await Student.deleteMany({ className: { $nin: activeClassNames } });
        console.log('Deleted orphaned students count:', deleteResult.deletedCount);

        // Also delete attendance records whose className is not active
        const deleteAttResult = await Attendance.deleteMany({ className: { $nin: activeClassNames } });
        console.log('Deleted orphaned attendance records count:', deleteAttResult.deletedCount);

        // Print final student count
        const finalCount = await Student.countDocuments({});
        console.log('Final student count:', finalCount);

        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error during cleanup:', err);
    });
