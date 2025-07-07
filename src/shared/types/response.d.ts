import { SUCCESS_HTTP_CODES, ERROR_HTTP_CODES, HTTP_CODES } from '@constants/httpCodes';

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface SuccessResponse<T> {
  success: true;
  data: T;
  status: (typeof SUCCESS_HTTP_CODES)[number];
}

export interface ErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
  };
  status: (typeof ERROR_HTTP_CODES)[number];
}

export type SuccessHttpCode =  typeof SUCCESS_HTTP_CODES[number];
export type ErrorHttpCode =  typeof ERROR_HTTP_CODES[number];

export type HttpCode = SuccessHttpCode | ErrorHttpCode;
