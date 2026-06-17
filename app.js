/**
 * app.js - Main Application Server
 * Shri Ganesh Classes Attendance Management System
 */

// Suppress deprecation warnings from third-party libraries (e.g., util.isArray)
process.noDeprecation = true;

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const flash = require('connect-flash');

// Import routes and custom error
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const classRoutes = require('./routes/class');
const adminRoutes = require('./routes/admin');
const ExpressError = require('./utils/expressError');
const { isAdminLoggedIn, isLoggedIn } = require('./middleware');

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

// Database connection URL
const dbUrl = process.env.ATLASDB_URL || process.env.MONGO_URL;

// Session configuration
const sessionSecret = process.env.SESSION_SECRET || 'shriganeshsessionsecretkeysgc';
const sessionConfig = {
    store: MongoStore.create({
        mongoUrl: dbUrl,
        touchAfter: 24 * 3600
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days in milliseconds
    }
};

app.use(session(sessionConfig));
app.use(flash());

// Global template variables middleware
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.isAdmin = req.session.isAdmin || false;
    res.locals.isTeacher = req.session.isTeacher || false;
    res.locals.teacher = req.session.teacher || null;
    next();
});

// MongoDB Connection using Mongoose and async/await

async function connectDB() {
    try {
        await mongoose.connect(dbUrl);
        console.log("MongoDB Connected");

        // Proactively clean up obsolete unique email index from teachers collection
        try {
            await mongoose.connection.db.collection('teachers').dropIndex('email_1');
            console.log("Obsolete unique email index dropped from teachers collection.");
        } catch (idxErr) {
            // Ignore NamespaceNotFound (26) and IndexNotFound (27) errors
            if (idxErr.code !== 26 && idxErr.code !== 27 && idxErr.codeName !== 'IndexNotFound' && idxErr.codeName !== 'NamespaceNotFound') {
                console.warn("Non-critical notice during index cleanup:", idxErr.message);
            }
        }
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
}

connectDB();

// Import Teacher model for login checks
const Teacher = require('./models/teacher');

// Home Route
app.get('/', (req, res) => {
    res.render('home', { title: 'Shri Ganesh Classes - Smart Academy Suite' });
});

// Teacher Authentication Routes
app.get('/teacher/login', (req, res) => {
    if (req.session.isTeacher) {
        return res.redirect('/students');
    }
    res.render('users/teacherLogin', { title: 'Teacher Login - Shri Ganesh Classes' });
});

app.post('/teacher/login', async (req, res) => {
    const { username, password } = req.body;
    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();

    const teacher = await Teacher.findOne({ username: cleanUsername });
    if (teacher && teacher.password === cleanPassword) {
        req.session.isTeacher = true;
        req.session.teacherId = teacher._id;
        req.session.teacher = teacher;
        req.flash('success', `Welcome back, ${teacher.name}!`);
        req.session.save((err) => {
            if (err) console.error("Session save error:", err);
            res.redirect('/students');
        });
    } else {
        req.flash('error', 'Invalid teacher username or password.');
        res.redirect('/teacher/login');
    }
});

app.get('/teacher/logout', (req, res) => {
    req.session.isTeacher = false;
    req.session.teacherId = null;
    req.session.teacher = null;
    req.session.save((err) => {
        if (err) console.error("Session save error:", err);
        req.flash('success', 'Logged out successfully.');
        res.redirect('/');
    });
});

// Route Middleware
app.use('/students', isLoggedIn, studentRoutes);
app.use('/teachers', isAdminLoggedIn, teacherRoutes);
app.use('/classes', isAdminLoggedIn, classRoutes);
app.use('/admin', adminRoutes);

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
