import { NextRequest, NextResponse } from "next/server";

/**
 * Optional access gate for public deployments: set APP_PASSWORD to require
 * HTTP Basic Auth (any username) on every request. Unset = open, for local
 * use. Protects the API routes, which spend OpenAI credits.
 */
export function proxy(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const supplied = atob(header.slice(6)).split(":").slice(1).join(":");
      if (supplied === password) return NextResponse.next();
    } catch {
      // fall through to the 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Kausap"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
