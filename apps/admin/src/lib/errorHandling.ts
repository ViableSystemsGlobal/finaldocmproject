/**
 * Utility functions for handling database errors consistently across the application
 */

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Handle Supabase/PostgreSQL errors with user-friendly messages
 */
export function handleDatabaseError(error: any, context?: string): Error {
  const contextPrefix = context ? `${context}: ` : '';
  
  // Handle specific constraint violations with user-friendly messages
  if (error.code === '23505') { // Unique constraint violation
    if (error.message.includes('contacts_email_key')) {
      return new Error(`${contextPrefix}This email address is already in use. Please use a different email or update the existing contact.`);
    } else if (error.message.includes('contacts_phone_key')) {
      return new Error(`${contextPrefix}This phone number is already in use. Please use a different phone number or update the existing contact.`);
    } else if (error.message.includes('newsletter_subscribers_email_key')) {
      return new Error(`${contextPrefix}This email address is already subscribed to the newsletter.`);
    } else if (error.message.includes('users_email_key')) {
      return new Error(`${contextPrefix}This email address is already registered. Please use a different email.`);
    } else {
      return new Error(`${contextPrefix}A record with this information already exists. Please check the details and try again.`);
    }
  }
  
  // Handle other specific errors
  if (error.code === '23502') { // Not null constraint violation
    return new Error(`${contextPrefix}Required information is missing. Please fill in all required fields.`);
  }
  
  if (error.code === '23514') { // Check constraint violation
    return new Error(`${contextPrefix}The information provided is not valid. Please check your entries and try again.`);
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    return new Error(`${contextPrefix}This record cannot be deleted because it is referenced by other data. Please remove related records first.`);
  }
  
  if (error.code === '42703') { // Undefined column
    return new Error(`${contextPrefix}Database structure issue. Please contact support.`);
  }
  
  if (error.code === '42P01') { // Undefined table
    return new Error(`${contextPrefix}Database table not found. Please contact support.`);
  }
  
  if (error.code === 'PGRST116') { // PostgREST - not found
    return new Error(`${contextPrefix}Record not found.`);
  }
  
  if (error.code === 'PGRST301') { // PostgREST - multiple results
    return new Error(`${contextPrefix}Multiple records found when only one was expected.`);
  }
  
  // Generic error handling for other cases
  return new Error(`${contextPrefix}${error.message || 'An unexpected error occurred'}`);
}

/**
 * Handle contact creation errors specifically
 */
export function handleContactCreationError(error: any): Error {
  return handleDatabaseError(error, 'Failed to create contact');
}

/**
 * Handle contact update errors specifically
 */
export function handleContactUpdateError(error: any): Error {
  return handleDatabaseError(error, 'Failed to update contact');
}

/**
 * Handle contact deletion errors specifically
 */
export function handleContactDeletionError(error: any): Error {
  return handleDatabaseError(error, 'Failed to delete contact');
}

/**
 * Check if error is a duplicate key constraint violation
 */
export function isDuplicateKeyError(error: any): boolean {
  return error.code === '23505';
}

/**
 * Check if error is a duplicate email error
 */
export function isDuplicateEmailError(error: any): boolean {
  return error.code === '23505' && error.message.includes('email');
}

/**
 * Check if error is a duplicate phone error
 */
export function isDuplicatePhoneError(error: any): boolean {
  return error.code === '23505' && error.message.includes('phone');
}

/**
 * Extract user-friendly error message from any error
 */
export function getErrorMessage(error: any, fallback: string = 'An unexpected error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return fallback;
} 