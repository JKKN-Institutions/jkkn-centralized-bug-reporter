import { nanoid } from 'nanoid';

/**
 * Generate a secure API key for applications
 * Format: br_<32-character-nanoid>
 * Example: br_V1StGXR8_Z5jdHi6B-myT_n1N1C3rD4t
 */
export function generateApiKey(): string {
  const prefix = 'br';
  const key = nanoid(32);
  return `${prefix}_${key}`;
}

/**
 * Validate API key format
 * Checks if the key follows the br_<nanoid> pattern
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Check prefix and length
  const parts = apiKey.split('_');
  return parts.length === 2 && parts[0] === 'br' && parts[1].length === 32;
}
