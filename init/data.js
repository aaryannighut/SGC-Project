/**
 * init/data.js
 * Mock data for seeding the Shri Ganesh Classes database.
 */

const sampleStudents = [
    {
        name: "Aarav Sharma",
        serialNo: 1,
        className: "5th",
        parentName: "Rajesh Sharma",
        parentMobile: "9876543210",
        status: "Absent"
    },
    {
        name: "Isha Patel",
        serialNo: 2,
        className: "6th",
        parentName: "Amit Patel",
        parentMobile: "9123456789",
        status: "Absent"
    },
    {
        name: "Rohan Verma",
        serialNo: 3,
        className: "7th",
        parentName: "Sanjay Verma",
        parentMobile: "9988776655",
        status: "Absent"
    },
    {
        name: "Ananya Iyer",
        serialNo: 4,
        className: "8th",
        parentName: "Raman Iyer",
        parentMobile: "9876123456",
        status: "Absent"
    },
    {
        name: "Kabir Singh",
        serialNo: 5,
        className: "9th",
        parentName: "Jasbir Singh",
        parentMobile: "9567890123",
        status: "Absent"
    },
    {
        name: "Diya Mehta",
        serialNo: 6,
        className: "10th",
        parentName: "Pankaj Mehta",
        parentMobile: "9432109876",
        status: "Absent"
    }
];

const sampleTeachers = [
    {
        name: "Aditya Kulkarni",
        username: "aditya123",
        password: "password123",
        mobile: "8765432109",
        subject: "Mathematics"
    },
    {
        name: "Sneha Deshmukh",
        username: "sneha123",
        password: "password123",
        mobile: "8123456789",
        subject: "Science"
    },
    {
        name: "Vikram Joshi",
        username: "vikram123",
        password: "password123",
        mobile: "8988776655",
        subject: "English"
    }
];

module.exports = { sampleStudents, sampleTeachers };
