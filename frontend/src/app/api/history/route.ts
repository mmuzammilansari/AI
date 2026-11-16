import { NextRequest, NextResponse } from "next/server";

const backend = process.env.AGENT_API_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  try {
    const url = new URL(`${backend}/ai/history`);
    url.searchParams.set("session_id", sessionId);
    const response = await fetch(url, { cache: "no-store" });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "text/plain; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ detail: "Could not connect to the FastAPI agent at the configured URL." }, { status: 502 });
  }
}
