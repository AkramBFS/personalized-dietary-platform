import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const role = request.cookies.get("user_role")?.value;

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  // Parse payload from JWT safely without secret key to get user_id & email
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decodedJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
      const payload = JSON.parse(decodedJson);

      return NextResponse.json({
        authenticated: true,
        user: {
          id: payload.user_id,
          role: role || payload.role || "client",
          email: payload.email || undefined,
        },
      });
    }
  } catch {
    // If decoding fails, return basic authenticated state
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      role: role || "client",
    },
  });
}
