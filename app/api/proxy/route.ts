import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const BLOCKED_PORTS = new Set([
  "0",
  "21",
  "22",
  "23",
  "25",
  "53",
  "110",
  "135",
  "139",
  "143",
  "389",
  "445",
  "465",
  "587",
  "993",
  "995",
  "1433",
  "1521",
  "3306",
  "3389",
  "5432",
  "6379",
  "9200",
  "9300",
  "11211",
  "27017",
]);
const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);
const MAX_PROXY_BODY_BYTES = 1_000_000;

export async function GET(request: NextRequest) {
  return handleProxyRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleProxyRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return handleProxyRequest(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return handleProxyRequest(request, "DELETE");
}

export async function PATCH(request: NextRequest) {
  return handleProxyRequest(request, "PATCH");
}

async function handleProxyRequest(request: NextRequest, method: string) {
  try {
    const targetUrl = request.nextUrl.searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json(
        { error: "URL параметр обязателен" },
        { status: 400 },
      );
    }

    let url: URL;
    try {
      url = new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: "Невалидный URL" }, { status: 400 });
    }

    const safetyError = validateProxyTarget(url);
    if (safetyError) {
      return NextResponse.json({ error: safetyError }, { status: 400 });
    }

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (
        !key.startsWith("x-") &&
        key !== "host" &&
        key !== "connection" &&
        key !== "content-length" &&
        key !== "accept-encoding" &&
        key !== "cookie"
      ) {
        headers[key] = value;
      }
    });

    headers["accept-encoding"] = "identity";
    headers["user-agent"] = "APIfy-Proxy/1.0";

    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
      try {
        body = await request.text();
        if (new TextEncoder().encode(body).byteLength > MAX_PROXY_BODY_BYTES) {
          return NextResponse.json(
            { error: "Тело запроса превышает лимит локального прокси" },
            { status: 413 },
          );
        }
      } catch {
        body = undefined;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(targetUrl, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type");
      let data;

      try {
        if (contentType?.includes("application/json")) {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch (jsonError) {
            console.warn("Failed to parse JSON, returning as text:", jsonError);
            data = text;
          }
        } else {
          data = await response.text();
        }
      } catch (readError) {
        console.error("Error reading response:", readError);
        data = `Error reading response: ${readError}`;
      }

      return NextResponse.json(
        {
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries()),
        },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Превышено время ожидания ответа (8 сек)",
            timeout: true,
          },
          {
            status: 408,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Ошибка прокси",
        details: String(error),
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

function validateProxyTarget(url: URL) {
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return "Локальный прокси поддерживает только HTTP/HTTPS URL";
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    return "Локальный прокси не работает с локальными адресами";
  }

  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return "Локальный прокси не работает с внутренними доменами";
  }

  if (isPrivateIp(hostname)) {
    return "Локальный прокси не работает с приватными IP-адресами";
  }

  if (url.port && BLOCKED_PORTS.has(url.port)) {
    return "Указанный порт запрещен для локального прокси";
  }

  return null;
}

function isPrivateIp(hostname: string) {
  if (hostname === "0.0.0.0") {
    return true;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    const parts = hostname.split(".").map(Number);
    const [first, second] = parts;

    if (parts.some((part) => part < 0 || part > 255)) {
      return true;
    }

    return (
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }

  if (
    hostname === "::1" ||
    hostname.startsWith("fc") ||
    hostname.startsWith("fd")
  ) {
    return true;
  }

  return false;
}
