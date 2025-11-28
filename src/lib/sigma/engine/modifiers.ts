/**
 * SIGMA Field Modifiers
 *
 * Implements all SIGMA field modification operators
 */

import { SigmaModifier } from '../types';

// ============================================================================
// REGEX MEMOIZATION CACHE
// ============================================================================

// Regex compilation cache - avoids recompiling the same patterns repeatedly
const regexCache = new Map<string, RegExp | null>();
const MAX_REGEX_CACHE_SIZE = 1000;

/**
 * Get or create a cached RegExp
 * Returns null if pattern is invalid or dangerous
 */
function getCachedRegex(pattern: string): RegExp | null {
  // Check cache first
  if (regexCache.has(pattern)) {
    return regexCache.get(pattern)!;
  }

  // Validate pattern length
  if (pattern.length > 500) {
    regexCache.set(pattern, null);
    return null;
  }

  // Check for dangerous patterns (nested quantifiers that could cause ReDoS)
  if (/(\+|\*|\{)\s*\1/.test(pattern) || /\([^)]*(\+|\*)[^)]*\)\s*(\+|\*)/.test(pattern)) {
    regexCache.set(pattern, null);
    return null;
  }

  // Compile regex
  try {
    const regex = new RegExp(pattern, 'i');

    // Evict oldest entry if cache is too large (LRU-like behavior)
    if (regexCache.size >= MAX_REGEX_CACHE_SIZE) {
      const firstKey = regexCache.keys().next().value;
      if (firstKey) regexCache.delete(firstKey);
    }

    regexCache.set(pattern, regex);
    return regex;
  } catch (e) {
    regexCache.set(pattern, null);
    return null;
  }
}

/**
 * Clear the regex cache (useful for testing or memory management)
 */
export function clearRegexCache(): void {
  regexCache.clear();
}

/**
 * Get regex cache stats for debugging
 */
export function getRegexCacheStats(): { size: number; maxSize: number } {
  return { size: regexCache.size, maxSize: MAX_REGEX_CACHE_SIZE };
}

// ============================================================================
// MODIFIER APPLICATION
// ============================================================================

/**
 * Apply modifier to field value and check if it matches target
 */
export function applyModifier(
  fieldValue: any,
  targetValue: any,
  modifier?: SigmaModifier
): boolean {
  if (fieldValue === undefined || fieldValue === null) {
    return modifier === 'exists' ? false : false;
  }

  const fieldStr = String(fieldValue);
  const targetStr = String(targetValue);
  const fieldLower = fieldStr.toLowerCase();
  const targetLower = typeof targetValue === 'string'
    ? targetStr === targetStr.toLowerCase() ? targetStr : targetStr.toLowerCase()
    : targetStr;

  switch (modifier) {
    case 'contains':
      return fieldLower.includes(targetLower);

    case 'startswith':
      return fieldLower.startsWith(targetLower);

    case 'endswith':
      return fieldLower.endsWith(targetLower);

    case 'all':
      // Value must contain all target values
      if (!Array.isArray(targetValue)) {
        return fieldLower.includes(targetLower);
      }
      return targetValue.every(v =>
        fieldLower.includes(String(v).toLowerCase())
      );

    case 're': {
      // Regular expression matching with memoized compilation
      const regex = getCachedRegex(targetStr);
      if (!regex) return false;
      return regex.test(fieldStr);
    }

    case 'base64':
      // Decode base64 and check
      try {
        const decoded = atob(fieldStr);
        return decoded.toLowerCase().includes(targetStr.toLowerCase());
      } catch (e) {
        return false;
      }

    case 'base64offset':
      // Base64 with offset variants (3 possible encodings)
      return checkBase64Offset(fieldStr, targetStr);

    case 'utf16le':
      // UTF-16 Little Endian encoding
      return checkUtf16(fieldStr, targetStr, 'le');

    case 'utf16be':
      // UTF-16 Big Endian encoding
      return checkUtf16(fieldStr, targetStr, 'be');

    case 'wide':
      // Wide character (null-byte separated)
      return checkWideChar(fieldStr, targetStr);

    case 'exists':
      // Field exists (any non-null value)
      return true;

    default:
      // No modifier = exact match (case-insensitive)
      return fieldLower === targetLower;
  }
}

/**
 * Parse field name and extract modifier
 * e.g., "CommandLine|contains" => { field: "CommandLine", modifier: "contains" }
 * e.g., "CommandLine|contains|all" => { field: "CommandLine", modifier: "contains", requireAll: true }
 */
export function parseFieldModifier(fieldName: string): {
  field: string;
  modifier?: SigmaModifier;
  requireAll?: boolean;
} {
  const parts = fieldName.split('|');

  if (parts.length === 1) {
    return { field: parts[0] };
  }

  const field = parts[0];
  const modifiers = parts.slice(1).map(m => m.toLowerCase());

  // Validate modifier
  const validModifiers: SigmaModifier[] = [
    'contains',
    'startswith',
    'endswith',
    'all',
    're',
    'base64',
    'base64offset',
    'utf16le',
    'utf16be',
    'wide',
    'exists'
  ];

  // Check for 'all' modifier (special case - it modifies behavior)
  const hasAll = modifiers.includes('all');
  const primaryModifier = modifiers.find(m => m !== 'all');

  if (!primaryModifier) {
    // Only 'all' modifier, treat as 'all'
    return { field, modifier: 'all' };
  }

  if (validModifiers.includes(primaryModifier as SigmaModifier)) {
    return {
      field,
      modifier: primaryModifier as SigmaModifier,
      requireAll: hasAll
    };
  }

  return { field: fieldName }; // Treat as field name if unknown modifier
}

/**
 * Check base64 with offset variants
 * Base64 encoding can have 3 different forms depending on offset
 */
function checkBase64Offset(fieldValue: string, target: string): boolean {
  try {
    // Try direct base64
    const decoded = atob(fieldValue);
    if (decoded.toLowerCase().includes(target.toLowerCase())) {
      return true;
    }

    // Try with offset padding
    for (const padding of ['A', 'AA', 'AAA']) {
      try {
        const paddedDecoded = atob(padding + fieldValue);
        if (paddedDecoded.toLowerCase().includes(target.toLowerCase())) {
          return true;
        }
      } catch (e) {
        // Ignore invalid padding
      }
    }

    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Check UTF-16 encoded strings
 */
function checkUtf16(fieldValue: string, target: string, endian: 'le' | 'be'): boolean {
  try {
    // Convert target to UTF-16 pattern
    const utf16Pattern = target
      .split('')
      .map(c => {
        const code = c.charCodeAt(0);
        if (endian === 'le') {
          return String.fromCharCode(code & 0xff) + String.fromCharCode((code >> 8) & 0xff);
        } else {
          return String.fromCharCode((code >> 8) & 0xff) + String.fromCharCode(code & 0xff);
        }
      })
      .join('');

    return fieldValue.includes(utf16Pattern);
  } catch (e) {
    return false;
  }
}

/**
 * Check wide character encoding (null-byte separated)
 * e.g., "test" becomes "t\0e\0s\0t\0"
 */
function checkWideChar(fieldValue: string, target: string): boolean {
  const wideTarget = target.split('').join('\0') + '\0';
  return fieldValue.includes(wideTarget);
}

/**
 * Get all possible field names from a field specification
 * Handles modifiers and returns base field name
 */
export function getBaseFieldName(fieldSpec: string): string {
  return parseFieldModifier(fieldSpec).field;
}

/**
 * Check if value matches with any of multiple patterns
 */
export function matchAny(
  fieldValue: any,
  patterns: any[],
  modifier?: SigmaModifier
): boolean {
  return patterns.some(pattern => applyModifier(fieldValue, pattern, modifier));
}

/**
 * Check if value matches with all patterns
 */
export function matchAll(
  fieldValue: any,
  patterns: any[],
  modifier?: SigmaModifier
): boolean {
  return patterns.every(pattern => applyModifier(fieldValue, pattern, modifier));
}

/**
 * Validate modifier is supported
 */
export function isValidModifier(modifier: string): boolean {
  const validModifiers: SigmaModifier[] = [
    'contains',
    'startswith',
    'endswith',
    'all',
    're',
    'base64',
    'base64offset',
    'utf16le',
    'utf16be',
    'wide',
    'exists'
  ];

  return validModifiers.includes(modifier as SigmaModifier);
}
