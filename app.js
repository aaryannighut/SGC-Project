/**
 * app.js - Main Application Server
 * Shri Ganesh Classes Attendance Management System
 */

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

// Import routes and custom error
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const classRoutes = require('./routes/class');
const ExpressError = require('./utils/expressError');

const app = express();

// Set up views and view engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parser middlewwares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override for PUT, DELETE HTTP verbs
app.use(methodOverride('_method'));

// MongoDB Connection using Mongoose and async/await
const dbUrl = process.env.MONGO_URL;

async function connectDB() {
    try {
        await mongoose.connect(dbUrl);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
}

connectDB();

// Home Route
app.get('/', (req, res) => {
    res.render('home', { title: 'Shri Ganesh Classes Attendance System' });
});

// Route Middleware
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/classes', classRoutes);

// Catch-all 404 route
app.use((req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong!' } = err;
    res.status(statusCode).render('error', { statusCode, message, title: 'Error - Shri Ganesh Classes' });
});

// Port configuration and Server Listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
