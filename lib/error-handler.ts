// Custom error classes
import fs from 'node:fs';
import path from 'node:path';

class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
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
const logError = (err: AppError) => {
    const errorLog = `
[${new Date().toISOString()}] ${err.statusCode || 500} - ${err.message}\n${err.stack}\n`;
    fs.appendFileSync(path.join(__dirname, 'error.log'), errorLog);
};

// Error Middleware
const errorMiddleware = (err: AppError, req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }, _next: () => void) => {
    if (!err.isOperational) {
        logError(err);
    }
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message,
    });
};

export { AppError, NotFoundError, ValidationError, errorMiddleware };