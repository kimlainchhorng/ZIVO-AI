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

export function logError(err: AppError): void {
  const errorLog = `[${new Date().toISOString()}] ${err.statusCode || 500} - ${err.message}\n${err.stack}\n`;
  console.error(errorLog);
}