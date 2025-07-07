import { ErrorResponse, HttpCode } from "@customTypes/response";

export interface User {
  username: string;
  uid: string;
}

export interface UserProfile {
  userUid: string;
  address: string;
  birthdate: string; // YYYY/MM/DD
}

export interface ValidatedUser extends User {
  age: number;
  address: string;
}

export interface ValidationResult {
  isValid: boolean;
  user?: ValidatedUser;
  error?: {
    code: HttpCode;
    message: string;
  };
}
