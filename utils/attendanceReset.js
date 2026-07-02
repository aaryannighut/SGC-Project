/**
 * utils/attendanceReset.js
 * Utility helper functions for managing the daily student attendance reset.
 */

const Student = require('../models/student');

/**
 * Calculates today's 12:00 AM in Asia/Kolkata (IST) timezone.
 * @returns {Date} Today's midnight Date object
 */
function getTodayMidnightIST() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    const dateParts = formatter.formatToParts(now);
    const year = parseInt(dateParts.find(p => p.type === 'year').value, 10);
    const month = parseInt(dateParts.find(p => p.type === 'month').value, 10);
    const day = parseInt(dateParts.find(p => p.type === 'day').value, 10);
    
    return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+05:30`);
}

/**
 * Calculates the next 12:00 AM (tomorrow's midnight) in Asia/Kolkata (IST) timezone.
 * @returns {Date} Tomorrow's midnight Date object
 */
function getNextMidnightIST() {
    const todayMidnight = getTodayMidnightIST();
    // Add 24 hours to get tomorrow's midnight
    return new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Resets all students' status to 'Present' if they haven't been updated today yet.
 * Used on server boot to catch up on missed daily resets.
 */
async function resetAllStudentsIfMissed() {
    try {
        const midnightIST = getTodayMidnightIST();
        const result = await Student.updateMany(
            {
                $or: [
                    { updatedAt: { $lt: midnightIST } },
                    { status: { $exists: false } }
                ]
            },
            { status: 'Present' }
        );
        if (result.modifiedCount > 0) {
            console.log(`[AUTORESET] Successfully caught up and reset ${result.modifiedCount} students to 'Present'.`);
        } else {
            console.log(`[AUTORESET] Catch-up check: All students' attendance statuses are already up-to-date for today.`);
        }
    } catch (err) {
        console.error('[AUTORESET ERROR] Failed to run catch-up student attendance reset:', err);
    }
}

/**
 * Schedules a daily recursive reset of all students' attendance status to 'Present'
 * exactly at 12:00 AM IST (Indian Standard Time).
 */
function scheduleDailyReset() {
    const now = new Date();
    const tomorrowMidnight = getNextMidnightIST();
    const delay = tomorrowMidnight - now;

    console.log(`[AUTORESET] Next scheduled daily reset: ${tomorrowMidnight.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST (in ${(delay / 1000 / 60).toFixed(1)} minutes).`);

    setTimeout(async () => {
        console.log('[AUTORESET] Triggering scheduled daily student attendance reset...');
        try {
            const result = await Student.updateMany({}, { status: 'Present' });
            console.log(`[AUTORESET] Daily reset completed. ${result.modifiedCount} students updated.`);
        } catch (err) {
            console.error('[AUTORESET ERROR] Scheduled daily reset failed:', err);
        }
        // Recursively schedule next reset to prevent drift
        scheduleDailyReset();
    }, delay);
}

module.exports = {
    getTodayMidnightIST,
    getNextMidnightIST,
    resetAllStudentsIfMissed,
    scheduleDailyReset
};
