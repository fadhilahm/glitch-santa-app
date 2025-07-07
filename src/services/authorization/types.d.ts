import { ErrorResponse, HttpCode } from "@customTypes/response";

export interface User {
  id: string;
  username: string;
  age: number;
  address: string;
}

export interface UserProfile {
  userID: string;
  name: string;
  birthdate: string;
}

export interface ValidationResult {
  isValid: boolean;
  user?: User;
  error?: {
    code: HttpCode;
    message: string;
  };
}
