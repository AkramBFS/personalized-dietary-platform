import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const getDjangoBaseUrl = () => {
  const url =
    process.env.INTERNAL_DJANGO_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api/v1/";
  return url.endsWith("/") ? url : `${url}/`;
};

function validateCsrf(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  // 1. Check Origin or Referer header against host
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (host && originUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (host && refererUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // 2. Custom header requirement to block scriptless form posts
  const requestedWith = request.headers.get("x-requested-with");
  if (requestedWith !== "XMLHttpRequest") {
    return false;
  }

  return true;
}

async function handleProxyRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  if (!validateCsrf(request)) {
    return NextResponse.json(
      {
        status: "error",
        error_code: "CSRF_FORBIDDEN",
        message: "Cross-site request forgery validation failed.",
      },
      { status: 403 }
    );
  }

  const djangoBase = getDjangoBaseUrl();
  const subpath = pathSegments.join("/");
  // Django DRF urls expect a trailing slash
  const trailingSlash = subpath.endsWith("/") ? "" : "/";
  const targetUrl = new URL(`${djangoBase}${subpath}${trailingSlash}`);

  // Forward query parameters
  request.nextUrl.searchParams.forEach((val, key) => {
    targetUrl.searchParams.append(key, val);
  });

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const headers: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const method = request.method.toUpperCase();
  let body: ArrayBuffer | undefined = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    body = await request.arrayBuffer();
  }

  let upstreamResponse = await fetch(targetUrl.toString(), {
    method,
    headers,
    body,
  });

  let newAccessToken: string | null = null;

  // Auto token refresh if upstream returned 401
  if (upstreamResponse.status === 401 && refreshToken) {
    try {
      const refreshUrl = new URL("auth/token/refresh/", djangoBase);
      const refreshRes = await fetch(refreshUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        newAccessToken = refreshData.access;

        headers["Authorization"] = `Bearer ${newAccessToken}`;
        upstreamResponse = await fetch(targetUrl.toString(), {
          method,
          headers,
          body,
        });
      }
    } catch {
      // Refresh error ignored; will return upstreamResponse
    }
  }

  const responseBody = await upstreamResponse.arrayBuffer();
  const clientResponse = new NextResponse(responseBody, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });

  const respContentType = upstreamResponse.headers.get("content-type");
  if (respContentType) {
    clientResponse.headers.set("content-type", respContentType);
  }

  const isProd = process.env.NODE_ENV === "production";

  if (newAccessToken) {
    clientResponse.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
  } else if (upstreamResponse.status === 401 && refreshToken) {
    // Clear cookies if refresh failed
    clientResponse.cookies.set("access_token", "", { path: "/", maxAge: 0 });
    clientResponse.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });
    clientResponse.cookies.set("user_role", "", { path: "/", maxAge: 0 });
  }

  return clientResponse;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolved = await params;
  return handleProxyRequest(request, resolved.path || []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolved = await params;
  return handleProxyRequest(request, resolved.path || []);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolved = await params;
  return handleProxyRequest(request, resolved.path || []);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolved = await params;
  return handleProxyRequest(request, resolved.path || []);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolved = await params;
  return handleProxyRequest(request, resolved.path || []);
}
