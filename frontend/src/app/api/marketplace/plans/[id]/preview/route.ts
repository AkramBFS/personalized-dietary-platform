import { NextRequest, NextResponse } from "next/server";

const DJANGO_API_BASE_URL = "http://127.0.0.1:8000/api/v1/";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  
  try {
    const upstream = await fetch(`${DJANGO_API_BASE_URL}marketplace/plans/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Using cache-control for better performance since plan details don't change frequently
      next: { revalidate: 60 } 
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Marketplace plan not found or unavailable" },
        { status: upstream.status },
      );
    }

    const raw = await upstream.json();
    
    // The Django backend might return { status: 'success', data: { ... } } or just { ... }
    // based on ApiEnvelope in api.ts
    const plan = raw?.data ?? raw;

    // Security & Product Risk Fix: Strip all days except the first one (Day 1)
    const previewContent = Array.isArray(plan.content_json) && plan.content_json.length > 0
      ? [plan.content_json[0]]
      : [];

    const previewPayload = {
      ...plan,
      content_json: previewContent,
    };

    return NextResponse.json(previewPayload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching plan preview from Django:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching plan preview" },
      { status: 500 },
    );
  }
}
