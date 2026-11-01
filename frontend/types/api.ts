import { FieldError } from "@/lib/api-error";

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  type?: string;
  message: string;
  errors?: FieldError[];
}
