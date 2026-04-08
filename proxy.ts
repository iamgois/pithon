import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Track referral code from ?ref=
  const ref = searchParams.get("ref");
  if (ref && !request.cookies.get("ref_code")) {
    response.cookies.set("ref_code", ref, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    });
  }

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token =
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token");
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
