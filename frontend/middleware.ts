import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  /*
    const token = request.cookies.get("spotify_access_token");
  const { pathname } = request.nextUrl;

  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
  */
  console.log("Middleware running:", request.nextUrl.pathname);
  return NextResponse.next();
}
