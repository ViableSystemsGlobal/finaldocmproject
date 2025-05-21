import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function to safely format dates with the same output on server and client
export function safeFormatDate(dateString: string): string {
  try {
    // Use a fixed ISO string format that will be consistent between server and client
    const date = new Date(dateString);
    // Use YYYY-MM-DD format which is consistent
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}
