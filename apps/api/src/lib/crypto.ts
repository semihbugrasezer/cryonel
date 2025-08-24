// apps/api/src/lib/crypto.ts
import crypto from "crypto";
import { env } from "./env";
import { logger } from "./logger";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits for GCM
const MASTER_KEY = Buffer.from(env.ENCRYPTION_MASTER_KEY, "hex");

// Validate master key length
if (MASTER_KEY.length !== 32) {
  throw new Error(`Invalid encryption key length: ${MASTER_KEY.length}. Expected 32 bytes (64 hex characters)`);
}

/**
 * Encrypt a string using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @returns Base64 encoded encrypted data (IV + Tag + Ciphertext)
 */
export function encrypt(plaintext: string): string {
  try {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);

    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final()
    ]);

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine IV + Tag + Encrypted data
    const result = Buffer.concat([iv, tag, encrypted]);

    return result.toString("base64");
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Encryption failed");
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string using AES-256-GCM
 * @param encryptedData - Base64 encoded encrypted data
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  try {
    // Decode base64
    const data = Buffer.from(encryptedData, "base64");

    // Extract components
    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
    decipher.setAuthTag(tag);

    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Decryption failed");
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Generate a secure random string
 * @param length - Length of the string to generate
 * @returns Random string
 */
export function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a secure random UUID
 * @returns Random UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Hash a password using Argon2id
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const { hash } = await import("argon2");
    return await hash(password, {
      type: 2, // Argon2id
      memoryCost: 2 ** 16, // 64 MiB
      timeCost: 3, // 3 iterations
      parallelism: 1, // 1 thread
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Password hashing failed");
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const { verify } = await import("argon2");
    return await verify(hash, password);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Password verification failed");
    return false;
  }
}

/**
 * Generate a secure random token for JWT
 * @param length - Length of the token in bytes
 * @returns Base64 encoded token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

/**
 * Hash a refresh token for storage
 * @param token - Plain refresh token
 * @returns SHA-256 hash of the token
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Export types
export interface EncryptionResult {
  encrypted: string;
  iv: string;
}

export interface DecryptionResult {
  decrypted: string;
  success: boolean;
}