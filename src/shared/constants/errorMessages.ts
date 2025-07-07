export const ERROR_MESSAGES = {
  FETCH_USER_DATA_FAILED: "Failed to fetch user data",
  USER_NOT_FOUND: "User not found",
  USER_PROFILE_NOT_FOUND: "User profile not found",
  USER_TOO_OLD: (age: number) => `User is too old: ${age} years old`,
  USERNAME_REQUIRED: "Username is required",
  USERNAME_TOO_LONG: "Username too long",
  MESSAGE_REQUIRED: "Message is required",
  MESSAGE_TOO_LONG: "Message too long",
  ADDRESS_REQUIRED: "Address is required",
  ADDRESS_TOO_LONG: "Address too long",
} as const;
