import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const getDjangoOrigin = () => {
  if (process.env.INTERNAL_DJANGO_URL) {
    try {
      return new URL(process.env.INTERNAL_DJANGO_URL).origin;
    } catch {
      // ignore
    }
  }
  if (process.env.NEXT_PUBLIC_DJANGO_ORIGIN) {
    return process.env.NEXT_PUBLIC_DJANGO_ORIGIN.replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8000";
};

async function handleMediaProxyRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const subpath = pathSegments.join("/");

  // Rejection of directory traversal and null bytes
  if (
    !subpath ||
    subpath.includes("..") ||
    subpath.includes("\\") ||
    subpath.includes("\0") ||
    /%2e%2e|%00/i.test(subpath)
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid media path." },
      { status: 400 }
    );
  }

  const djangoOrigin = getDjangoOrigin();
  const targetUrl = new URL(`/media/${subpath}`, djangoOrigin);

  // Forward query parameters if any
  request.nextUrl.searchParams.forEach((val, key) => {
    targetUrl.searchParams.append(key, val);
  });

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const headers: Record<string, string> = {};

  const incomingAuth = request.headers.get("authorization");
  if (incomingAuth) {
    headers["Authorization"] = incomingAuth;
  } else if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const method = request.method.toUpperCase();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl.toString(), {
      method,
      headers,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Media backend unavailable." },
      { status: 502 }
    );
  }

  let newAccessToken: string | null = null;

  // Auto token refresh if upstream returned 401
  if (upstreamResponse.status === 401 && refreshToken) {
    try {
      const refreshUrl = new URL("/api/v1/auth/token/refresh/", djangoOrigin);
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
        });
      }
    } catch {
      // Refresh error ignored; will return upstreamResponse
    }
  }

  const clientResponse = new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });

  const headerList = [
    "content-type",
    "content-length",
    "content-disposition",
    "cache-control",
    "x-content-type-options",
    "content-security-policy",
    "last-modified",
    "etag",
  ];

  for (const h of headerList) {
    const val = upstreamResponse.headers.get(h);
    if (val) {
      clientResponse.headers.set(h, val);
    }
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
  }

  return clientResponse;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolved = await params;
  return handleMediaProxyRequest(request, resolved.path || []);
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolved = await params;
  return handleMediaProxyRequest(request, resolved.path || []);
}
