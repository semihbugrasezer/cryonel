// apps/api/src/middleware/requestId.ts
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
    namespace Express {
        interface Request {
            id: string;
        }
    }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
    req.id = req.headers['x-request-id'] as string || randomUUID();
    res.setHeader('X-Request-ID', req.id);
    next();
}
