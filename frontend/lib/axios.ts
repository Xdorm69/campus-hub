import axios, { AxiosError } from "axios";
import { ApiErrorResponse } from "@/types/api";
import { ApiError } from "./api-error";

export const api = axios.create({
  // Must include the version prefix, e.g. http://localhost:4000/api/v1
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  withCredentials: true, // send the HTTP-only JWT cookie on every request
});

const PUBLIC_PATHS = ["/login", "/register"];

// One place that turns transport/HTTP failures into an ApiError and reacts to
// an expired session, so hooks and components never deal with AxiosError.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    if (!error.response) {
      return Promise.reject(new ApiError("Unable to reach the server. Check your connection."));
    }

    const { status, data } = error.response;

    if (status === 401 && typeof window !== "undefined") {
      const { pathname } = window.location;
      if (!PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        window.location.replace(`/login?from=${encodeURIComponent(pathname)}`);
      }
    }

    return Promise.reject(
      new ApiError(
        data?.message ?? error.message,
        status,
        data?.type ?? "HttpError",
        data?.errors ?? []
      )
    );
  }
);
