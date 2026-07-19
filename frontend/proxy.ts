import { NextRequest, NextResponse } from "next/server";

// Name of the HTTP-only cookie the backend sets on login.
// Update this to match your backend's actual cookie name.
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "token";

const AUTH_ROUTES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(AUTH_COOKIE_NAME);

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Signed-in users shouldn't see the login/register forms again.
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Everything outside the auth routes requires a session cookie.
  // The backend remains the source of truth: it will still return 401
  // on any request with an invalid/expired token, which the axios
  // interceptor catches and redirects on.
  if (!isAuthRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - static files / _next internals
     * - favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
