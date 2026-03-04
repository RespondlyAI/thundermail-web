/**
 * Email Event Types and Sources
 * Configurable via environment variables for easy updates without code changes
 */

// Default values (fallback)
const DEFAULT_EVENT_TYPES = [
  "otp_signup",
  "otp_password_reset", 
  "welcome_owner",
  "organization_invite",
  "organization_credentials",
  "contact_form_internal",
  "contact_form_acknowledgement"
] as const;

const DEFAULT_EVENT_SOURCES = [
  "auth-service",
  "organization-service", 
  "marketing-site"
] as const;

// Load from environment variables or use defaults
const getEventTypes = (): string[] => {
  const envEventTypes = process.env.EMAIL_EVENT_TYPES;
  if (envEventTypes) {
    return envEventTypes.split(',').map(type => type.trim());
  }
  return [...DEFAULT_EVENT_TYPES];
};

const getEventSources = (): string[] => {
  const envEventSources = process.env.EMAIL_EVENT_SOURCES;
  if (envEventSources) {
    return envEventSources.split(',').map(source => source.trim());
  }
  return [...DEFAULT_EVENT_SOURCES];
};

// Runtime enums
export const EMAIL_EVENT_TYPES = getEventTypes();
export const EMAIL_EVENT_SOURCES = getEventSources();

// Type definitions for TypeScript
export type EmailEventType = typeof EMAIL_EVENT_TYPES[number];
export type EmailEventSource = typeof EMAIL_EVENT_SOURCES[number];

// Validation functions
export const isValidEventType = (eventType: string): eventType is EmailEventType => {
  return EMAIL_EVENT_TYPES.includes(eventType);
};

export const isValidEventSource = (eventSource: string): eventSource is EmailEventSource => {
  return EMAIL_EVENT_SOURCES.includes(eventSource);
};

// Helper to get all valid options (useful for API documentation/validation errors)
export const getValidEventTypes = () => EMAIL_EVENT_TYPES;
export const getValidEventSources = () => EMAIL_EVENT_SOURCES;