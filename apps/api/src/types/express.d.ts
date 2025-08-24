// Type declarations for Express Request extension

declare namespace Express {
  interface Request {
    user?: import("../lib/auth").JWTPayload;
    auth?: import("../lib/auth").JWTPayload;
  }
}
