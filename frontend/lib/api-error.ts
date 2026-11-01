export interface FieldError {
  field: string;
  message: string;
}

/** Normalized error for every failed API call. */
export class ApiError extends Error {
  readonly status: number;
  readonly type: string;
  readonly fieldErrors: FieldError[];

  constructor(message: string, status = 0, type = "NetworkError", fieldErrors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.type = type;
    this.fieldErrors = fieldErrors;
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
