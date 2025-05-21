import React from 'react';

// Utility function to handle Next.js params safely
// Works with current version and future-proofs for when React.use is required
export function useNextParams<T extends Record<string, any>>(params: T | Promise<T>): T {
  // For now, just return the params directly if they're not a Promise
  if (!(params instanceof Promise)) {
    return params;
  }
  
  // If params is a Promise (future Next.js), unwrap it with React.use
  return React.use(params);
} 