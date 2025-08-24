/**
 * Client-side AES-GCM encryption utilities for API keys
 * SECURITY: All encryption happens in the browser before sending to server
 */

export interface EncryptedData {
  encrypted: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  tag: string; // Base64 encoded authentication tag
  algorithm: 'AES-GCM';
  keyDerivation: 'PBKDF2';
}

export interface KeyDerivationParams {
  salt: string; // Base64 encoded salt
  iterations: number;
  hash: string; // 'SHA-256'
}

/**
 * Generate a cryptographically secure random password
 */
export function generateSecurePassword(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

/**
 * Generate random bytes for IV, salt, etc.
 */
export function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derive encryption key from user password using PBKDF2
 */
export async function deriveKey(
  password: string, 
  salt: Uint8Array, 
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import the password as a key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive the AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: iterations,
      hash: 'SHA-256'
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(
  data: string, 
  password: string
): Promise<{ encrypted: EncryptedData; keyParams: KeyDerivationParams }> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Generate random salt and IV
  const salt = generateRandomBytes(16); // 128 bits
  const iv = generateRandomBytes(12); // 96 bits for GCM
  
  // Derive key from password
  const key = await deriveKey(password, salt);
  
  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
      tagLength: 128 // 128-bit authentication tag
    },
    key,
    dataBuffer
  );
  
  // Split encrypted data and authentication tag
  const encrypted = new Uint8Array(encryptedBuffer.slice(0, -16)); // All but last 16 bytes
  const tag = new Uint8Array(encryptedBuffer.slice(-16)); // Last 16 bytes
  
  return {
    encrypted: {
      encrypted: arrayBufferToBase64(encrypted.buffer as ArrayBuffer),
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      tag: arrayBufferToBase64(tag.buffer as ArrayBuffer),
      algorithm: 'AES-GCM',
      keyDerivation: 'PBKDF2'
    },
    keyParams: {
      salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
      iterations: 100000,
      hash: 'SHA-256'
    }
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  keyParams: KeyDerivationParams,
  password: string
): Promise<string> {
  // Validate algorithm
  if (encryptedData.algorithm !== 'AES-GCM') {
    throw new Error('Unsupported encryption algorithm');
  }
  
  if (encryptedData.keyDerivation !== 'PBKDF2') {
    throw new Error('Unsupported key derivation method');
  }
  
  // Convert base64 to ArrayBuffers
  const encrypted = base64ToArrayBuffer(encryptedData.encrypted);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const tag = base64ToArrayBuffer(encryptedData.tag);
  const salt = base64ToArrayBuffer(keyParams.salt);
  
  // Derive key from password
  const key = await deriveKey(password, new Uint8Array(salt), keyParams.iterations);
  
  // Combine encrypted data and tag
  const encryptedWithTag = new Uint8Array(encrypted.byteLength + tag.byteLength);
  encryptedWithTag.set(new Uint8Array(encrypted));
  encryptedWithTag.set(new Uint8Array(tag), encrypted.byteLength);
  
  try {
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      encryptedWithTag
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed - invalid password or corrupted data');
  }
}

/**
 * Encrypt API key data before sending to server
 */
export async function encryptApiKey(
  apiKey: string,
  apiSecret: string,
  userPassword: string
): Promise<{
  encrypted_key: EncryptedData;
  encrypted_secret: EncryptedData;
  key_params: KeyDerivationParams;
}> {
  // Use the same salt for both key and secret for consistency
  const salt = generateRandomBytes(16);
  const iterations = 100000;
  
  // Encrypt API key
  const keyResult = await encryptData(apiKey, userPassword);
  
  // Encrypt API secret
  const secretResult = await encryptData(apiSecret, userPassword);
  
  // Use the same key derivation params for both
  const keyParams: KeyDerivationParams = {
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    iterations,
    hash: 'SHA-256'
  };
  
  return {
    encrypted_key: keyResult.encrypted,
    encrypted_secret: secretResult.encrypted,
    key_params: keyParams
  };
}

/**
 * Decrypt API key data received from server
 */
export async function decryptApiKey(
  encryptedKey: EncryptedData,
  encryptedSecret: EncryptedData,
  keyParams: KeyDerivationParams,
  userPassword: string
): Promise<{ apiKey: string; apiSecret: string }> {
  const apiKey = await decryptData(encryptedKey, keyParams, userPassword);
  const apiSecret = await decryptData(encryptedSecret, keyParams, userPassword);
  
  return { apiKey, apiSecret };
}

/**
 * Validate that the browser supports required crypto APIs
 */
export function validateCryptoSupport(): { supported: boolean; missingFeatures: string[] } {
  const missingFeatures: string[] = [];
  
  if (!crypto) {
    missingFeatures.push('Web Crypto API');
  } else {
    if (!crypto.subtle) {
      missingFeatures.push('SubtleCrypto');
    }
    if (!crypto.getRandomValues) {
      missingFeatures.push('crypto.getRandomValues');
    }
  }
  
  if (!TextEncoder) {
    missingFeatures.push('TextEncoder');
  }
  
  if (!TextDecoder) {
    missingFeatures.push('TextDecoder');
  }
  
  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
}

/**
 * Generate a master password hint (non-reversible)
 */
export async function generatePasswordHint(password: string, userEmail: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + userEmail + 'hint_salt');
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashBase64 = arrayBufferToBase64(hashBuffer);
  
  // Return first 8 characters as hint
  return hashBase64.substring(0, 8);
}

/**
 * Test encryption/decryption functionality
 */
export async function testCrypto(): Promise<{ success: boolean; error?: string }> {
  try {
    const testData = 'test_api_key_12345';
    const testPassword = 'test_password_67890';
    
    // Encrypt
    const { encrypted, keyParams } = await encryptData(testData, testPassword);
    
    // Decrypt
    const decrypted = await decryptData(encrypted, keyParams, testPassword);
    
    if (decrypted !== testData) {
      return { success: false, error: 'Decrypted data does not match original' };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}