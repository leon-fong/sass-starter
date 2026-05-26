import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createSessionExpiry,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  signToken,
  verifyToken,
} from "@/lib/auth/session";

const protectedRoutes = "/dashboard";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isProtectedRoute = pathname.startsWith(protectedRoutes);

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === "GET") {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = createSessionExpiry();

      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString(),
        }),
        ...getSessionCookieOptions(expiresInOneDay),
      });
    } catch (error) {
      console.error("Error updating session:", error);
      res.cookies.delete(SESSION_COOKIE_NAME);
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
