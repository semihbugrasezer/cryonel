// apps/api/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

// Custom error classes
export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public isOperational: boolean;

    constructor(message: string, statusCode: number, code: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}

// Global error handler middleware
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    const requestId = req.headers['x-request-id'] || 'unknown';

    // Log error with request context
    logger.error({
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        requestId,
        url: req.url,
        method: req.method,
        ip: req.ip
    }, 'Unhandled error');

    // Handle different error types
    if (error instanceof ZodError) {
        res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: error.errors
            },
            requestId
        });
        return;
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message
            },
            requestId
        });
        return;
    }

    // Handle database errors
    if ((error as any).code === '23505') { // Unique constraint violation
        res.status(409).json({
            error: {
                code: 'DUPLICATE_ENTRY',
                message: 'Resource already exists'
            },
            requestId
        });
        return;
    }

    if ((error as any).code === '23503') { // Foreign key violation
        res.status(400).json({
            error: {
                code: 'INVALID_REFERENCE',
                message: 'Referenced resource does not exist'
            },
            requestId
        });
        return;
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid authentication token'
            },
            requestId
        });
        return;
    }

    if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            error: {
                code: 'TOKEN_EXPIRED',
                message: 'Authentication token has expired'
            },
            requestId
        });
        return;
    }

    // Default error response
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An internal server error occurred'
                : error.message
        },
        requestId
    });
}

// Utility to wrap async route handlers
export function asyncHandler<T extends Request, U extends Response>(
    fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
    return (req: T, res: U, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
