import { NextRequest, NextResponse } from "next/server";

const backend = process.env.AGENT_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const response = await fetch(`${backend}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "Could not connect to the FastAPI agent at the configured URL." }, { status: 502 });
  }
}
