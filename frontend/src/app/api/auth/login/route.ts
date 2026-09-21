import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";

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
    const body = await request.json();
    const { email, password, turnstile_token } = body;

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email and password are required." },
        { status: 400 }
      );
    }

    // Phase 5C: Bot Protection via Cloudflare Turnstile
    const clientIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      undefined;

    const turnstileResult = await verifyTurnstileToken(turnstile_token, clientIp);
    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          status: "error",
          error_code: "BOT_VERIFICATION_FAILED",
          message: turnstileResult.error || "Bot verification challenge failed.",
        },
        { status: 400 }
      );
    }

    // Call Django backend login endpoint
    const djangoBase = getDjangoBaseUrl();
    const loginUrl = new URL("auth/login/", djangoBase);

    const djangoRes = await fetch(loginUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(clientIp ? { "X-Forwarded-For": clientIp } : {}),
      },
      body: JSON.stringify({ email, password }),
    });

    const djangoData = await djangoRes.json();

    if (!djangoRes.ok || djangoData.status === "error") {
      return NextResponse.json(
        djangoData,
        { status: djangoRes.status }
      );
    }

    const { tokens, user } = djangoData.data;
    const isProd = process.env.NODE_ENV === "production";

    // Create client response containing only user information (never exposing raw JWTs to JS)
    const clientResponse = NextResponse.json({
      status: "success",
      data: {
        user,
      },
    });

    // Set HttpOnly cookies for JWTs
    clientResponse.cookies.set("access_token", tokens.access, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 3600, // 1 hour
    });

    clientResponse.cookies.set("refresh_token", tokens.refresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 604800, // 7 days
    });

    // Set non-sensitive user_role cookie for Next.js 16 proxy.ts routing UX
    clientResponse.cookies.set("user_role", user.role, {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });

    return clientResponse;
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: `Authentication error: ${String(err)}` },
      { status: 500 }
    );
  }
}
