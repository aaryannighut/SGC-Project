/**
 * utils/wrapAsync.js
 * A wrapper to handle asynchronous routes/controller functions and catch errors.
 */

module.exports = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
