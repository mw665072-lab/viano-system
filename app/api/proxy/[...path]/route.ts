import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "DELETE");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "PATCH");
}

async function handleProxy(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "API base URL not configured" },
      { status: 500 }
    );
  }

  const { path } = await params;
  const targetPath = path.join("/");
  const targetUrl = new URL(`${API_BASE_URL}/api/${targetPath}`);

  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Build headers to forward
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    // Skip host and origin to avoid conflicts with the target server
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "origin") {
      headers.set(key, value);
    }
  });

  // Skip ngrok browser warning interstitial page
  headers.set("ngrok-skip-browser-warning", "1");

  let body: BodyInit | undefined;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    body = await request.formData();
    // Let fetch set the correct multipart boundary
    headers.delete("content-type");
  } else if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
    });

    const responseBody = await response.text();
    const responseHeaders = new Headers(response.headers);
    // Remove CORS headers from backend since we're proxying
    responseHeaders.delete("access-control-allow-origin");
    responseHeaders.delete("access-control-allow-credentials");

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy request" },
      { status: 502 }
    );
  }
}
