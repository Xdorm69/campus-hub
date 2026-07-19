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
      // Network down / backend unreachable
      console.error("Network error: unable to reach the server.");
      return Promise.reject(error);
    }

    return Promise.reject(new Error(error.response.data.message));
  }
);
