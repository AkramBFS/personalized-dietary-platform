import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    // Log CSP violation report for monitoring and review
    console.warn("[CSP VIOLATION REPORT]:", JSON.stringify(report));
    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "ignored" }, { status: 400 });
  }
}
