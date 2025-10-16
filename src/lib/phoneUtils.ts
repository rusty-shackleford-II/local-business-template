/**
 * Phone number utility functions for formatting and cleaning
 */

/**
 * Strips all non-digit characters except + from a phone number for tel: links
 * @param phoneNumber - The phone number to strip
 * @returns Clean phone number with only digits and + symbol
 */
export function stripPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/[^\d+]/g, '');
}

/**
 * Formats a phone number for display as the user types
 * Supports US phone number format: (XXX) XXX-XXXX
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Handle international numbers (starting with +)
  if (cleaned.startsWith('+')) {
    // For international numbers, just add some basic spacing
    if (cleaned.length > 4) {
      return cleaned.slice(0, 4) + ' ' + cleaned.slice(4);
    }
    return cleaned;
  }
  
  // Handle US phone numbers
  const digits = cleaned.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  
  // Handle numbers longer than 10 digits (like 1 + 10 digit US number)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // For other long numbers, just format the first 10 digits
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Validates if a phone number has enough digits to be valid
 * @param phoneNumber - The phone number to validate
 * @returns True if the phone number appears to be valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  const digits = phoneNumber.replace(/\D/g, '');
  
  // US numbers should have 10 digits, or 11 if starting with 1
  // International numbers should have at least 7 digits
  if (phoneNumber.startsWith('+')) {
    return digits.length >= 7;
  }
  
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}
