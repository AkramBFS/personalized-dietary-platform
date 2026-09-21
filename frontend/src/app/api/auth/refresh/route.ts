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
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { status: "error", message: "No refresh token available." },
        { status: 401 }
      );
    }

    const djangoBase = getDjangoBaseUrl();
    const refreshUrl = new URL("auth/token/refresh/", djangoBase);

    const djangoRes = await fetch(refreshUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!djangoRes.ok) {
      const response = NextResponse.json(
        { status: "error", message: "Session expired." },
        { status: 401 }
      );
      response.cookies.set("access_token", "", { path: "/", maxAge: 0 });
      response.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });
      response.cookies.set("user_role", "", { path: "/", maxAge: 0 });
      return response;
    }

    const data = await djangoRes.json();
    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      status: "success",
      message: "Session token refreshed successfully.",
    });

    response.cookies.set("access_token", data.access, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: `Token refresh failed: ${String(err)}` },
      { status: 500 }
    );
  }
}
