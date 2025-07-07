export const HTTP_CODES = {
  SUCCESS: {
    OK: 200,
    CREATED: 201,
  },
  ERROR: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
} as const;

export const SUCCESS_HTTP_CODES = Object.values(HTTP_CODES.SUCCESS);
export const ERROR_HTTP_CODES = Object.values(HTTP_CODES.ERROR);
