export const ERROR_MESSAGES = {
    FETCH_USER_DATA_FAILED: 'Failed to fetch user data',
    USER_NOT_FOUND: 'User not found',
    USER_PROFILE_NOT_FOUND: 'User profile not found',
    USER_TOO_OLD: (age: number) => `User is too old: ${age} years old`
} as const;