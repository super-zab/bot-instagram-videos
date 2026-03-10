// =============================================================================
// SHARED SERVICE UTILITIES
// Small helpers used across multiple service files.
// =============================================================================

/** Generate a short random ID (no uuid dependency needed for now) */
export function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Return current UTC time as an ISO 8601 string */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Simulated async delay — used by mock implementations so the UI
 * can exercise loading states without real API calls.
 */
export function fakDelay(ms = 2000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
