import { ApiErrorResponse } from "@/types/auth";
import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  withCredentials: true, // send the HTTP-only JWT cookie on every request
  headers: {
    "Content-Type": "application/json",
  },
});


// Central place to react to auth/network failures without repeating
// try/catch boilerplate in every hook or component.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      return Promise.reject(new Error("Unable to reach server"));
    }

    if (error.response.status === 401) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.replace(
          `/login?from=${encodeURIComponent(window.location.pathname)}`
        );
      }

      return Promise.reject(error);
    }

    return Promise.reject(
      new Error(error.response.data.message)
    );
  }
);