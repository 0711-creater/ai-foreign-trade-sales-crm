import { NextRequest, NextResponse } from "next/server";

function unauthorized(message = "Authentication required") {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="AI Sales CRM Admin"',
    },
  });
}

export function middleware(request: NextRequest) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.log("[BasicAuth] Admin credentials missing");
    return unauthorized("Admin credentials are not configured");
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const base64Credentials = authHeader.split(" ")[1];
    const decodedCredentials = atob(base64Credentials);
    const separatorIndex = decodedCredentials.indexOf(":");

    if (separatorIndex === -1) {
      return unauthorized();
    }

    const inputUsername = decodedCredentials.slice(0, separatorIndex).trim();
    const inputPassword = decodedCredentials.slice(separatorIndex + 1).trim();

    const usernameMatched = inputUsername === username.trim();
    const passwordMatched = inputPassword === password.trim();

    console.log("[BasicAuth]", {
      hasAdminUsername: Boolean(username),
      hasAdminPassword: Boolean(password),
      usernameMatched,
      passwordLengthMatched: inputPassword.length === password.trim().length,
    });

    if (usernameMatched && passwordMatched) {
      return NextResponse.next();
    }

    return unauthorized();
  } catch (error) {
    console.log("[BasicAuth] Failed to parse authorization header");
    return unauthorized();
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/inquiries/:path*"],
};
