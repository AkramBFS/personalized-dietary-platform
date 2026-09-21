import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const getDjangoBaseUrl = () => {
  const url =
    process.env.INTERNAL_DJANGO_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api/v1/";
  return url.endsWith("/") ? url : `${url}/`;
};

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const accessToken = request.cookies.get("access_token")?.value;

  if (refreshToken) {
    try {
      const djangoBase = getDjangoBaseUrl();
      const logoutUrl = new URL("auth/logout/", djangoBase);

      await fetch(logoutUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Ignore backend revocation error during local teardown
    }
  }

  const response = NextResponse.json({
    status: "success",
    message: "Logged out successfully.",
  });

  // Clear all auth cookies
  response.cookies.set("access_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("user_role", "", { path: "/", maxAge: 0 });

  return response;
}
