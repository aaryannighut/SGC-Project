/**
 * init/data.js
 * Mock data for seeding the Shri Ganesh Classes database.
 */

const sampleStudents = [
    {
        name: "Aarav Sharma",
        rollNo: "S-501",
        className: "5th",
        parentName: "Rajesh Sharma",
        parentMobile: "9876543210"
    },
    {
        name: "Isha Patel",
        rollNo: "S-601",
        className: "6th",
        parentName: "Amit Patel",
        parentMobile: "9123456789"
    },
    {
        name: "Rohan Verma",
        rollNo: "S-701",
        className: "7th",
        parentName: "Sanjay Verma",
        parentMobile: "9988776655"
    },
    {
        name: "Ananya Iyer",
        rollNo: "S-801",
        className: "8th",
        parentName: "Raman Iyer",
        parentMobile: "9876123456"
    },
    {
        name: "Kabir Singh",
        rollNo: "S-901",
        className: "9th",
        parentName: "Jasbir Singh",
        parentMobile: "9567890123"
    },
    {
        name: "Diya Mehta",
        rollNo: "S-1001",
        className: "10th",
        parentName: "Pankaj Mehta",
        parentMobile: "9432109876"
    }
];

const sampleTeachers = [
    {
        name: "Aditya Kulkarni",
        email: "aditya.k@shriganesh.edu",
        mobile: "8765432109"
    },
    {
        name: "Sneha Deshmukh",
        email: "sneha.d@shriganesh.edu",
        mobile: "8123456789"
    },
    {
        name: "Vikram Joshi",
        email: "vikram.j@shriganesh.edu",
        mobile: "8988776655"
    }
];

module.exports = { sampleStudents, sampleTeachers };
