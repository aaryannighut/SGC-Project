/**
 * init/index.js
 * Database initialization/seeding script.
 * Run using: node init/index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/student');
const Teacher = require('../models/teacher');
const Class = require('../models/class');
const { sampleStudents, sampleTeachers } = require('./data');

const dbUrl = process.env.ATLASDB_URL || process.env.MONGO_URL;

if (!dbUrl) {
    console.error("Error: Neither ATLASDB_URL nor MONGO_URL environment variable is defined in .env file.");
    process.exit(1);
}

async function seedDB() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing data
        await Student.deleteMany({});
        await Teacher.deleteMany({});
        await Class.deleteMany({});
        console.log("Cleared existing Students, Teachers, and Classes.");

        // Seed all allowed Class standards
        const classNames = ['5th', '6th', '7th', '8th', '9th', '10th'];
        const classDocs = [];
        for (let name of classNames) {
            const classDoc = new Class({ className: name });
            await classDoc.save();
            classDocs.push(classDoc);
        }
        console.log("Created Class standards: 5th, 6th, 7th, 8th, 9th, 10th.");

        // Seed Teachers and link them to Classes one-way
        for (let i = 0; i < sampleTeachers.length; i++) {
            const teacherData = sampleTeachers[i];
            const teacher = new Teacher(teacherData);
            await teacher.save();

            // Link class to teacher: 10th class -> 1st teacher, 9th class -> 2nd teacher, 8th class -> 3rd teacher
            let targetClassDoc = null;
            if (i === 0) targetClassDoc = classDocs.find(c => c.className === '10th');
            if (i === 1) targetClassDoc = classDocs.find(c => c.className === '9th');
            if (i === 2) targetClassDoc = classDocs.find(c => c.className === '8th');

            if (targetClassDoc) {
                await Class.findByIdAndUpdate(targetClassDoc._id, { assignedTeacher: teacher._id });
            }
        }
        console.log("Seeded Teachers and synced class assignments.");

        // Seed Students
        await Student.insertMany(sampleStudents);
        console.log("Seeded Students Registry.");

        console.log("Database seeded successfully!");
        mongoose.connection.close();
    } catch (err) {
        console.error("Error seeding the database:", err);
        mongoose.connection.close();
        process.exit(1);
    }
}

seedDB();
