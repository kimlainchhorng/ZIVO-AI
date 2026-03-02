// Custom error classes
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation Error') {
        super(message, 400);
    }
}

// Error Logger
const fs = require('fs');
const path = require('path');

const logError = (err) => {
    const errorLog = `
[${new Date().toISOString()}] ${err.statusCode || 500} - ${err.message}\n${err.stack}\n`;
    fs.appendFileSync(path.join(__dirname, 'error.log'), errorLog);
};

// Error Middleware
const errorMiddleware = (err, req, res, next) => {
    if (!err.isOperational) {
        logError(err);
    }
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message,
    });
};

module.exports = { AppError, NotFoundError, ValidationError, errorMiddleware };