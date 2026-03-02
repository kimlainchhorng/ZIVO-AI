import { appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Custom error classes
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation Error') {
        super(message, 400);
    }
}

// Error Logger
const logError = (err: AppError): void => {
    const errorLog = `\n[${new Date().toISOString()}] ${err.statusCode || 500} - ${err.message}\n${err.stack}\n`;
    const dir = typeof __dirname !== "undefined"
        ? __dirname
        : dirname(fileURLToPath(import.meta.url));
    appendFileSync(join(dir, 'error.log'), errorLog);
};

// Error handler for Next.js API routes
export const handleApiError = (err: unknown): { message: string; statusCode: number } => {
    if (err instanceof AppError) {
        if (!err.isOperational) {
            logError(err);
        }
        return { message: err.message, statusCode: err.statusCode };
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return { message, statusCode: 500 };
};