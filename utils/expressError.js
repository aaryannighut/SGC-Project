/**
 * utils/expressError.js
 * Custom error class to manage status codes and messages.
 */

class ExpressError extends Error {
    constructor(statusCode, message) {
        super();
        this.statusCode = statusCode;
        this.message = message;
    }
}

module.exports = ExpressError;
