import { ErrorHttpCode } from "./response";

export class ErrorWithCode extends Error {
  code: ErrorHttpCode;
  constructor(code: ErrorHttpCode, message: string) {
    super(message);
    this.code = code;
  }
}
