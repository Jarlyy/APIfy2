import { sendAlert } from "@/lib/alerts";
import { createAdminClient } from "@/lib/supabase/admin";
import { type NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const requestLog = new Map<string, number[]>();

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(request: NextRequest) {
  const key = getClientKey(request);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const history =
    requestLog.get(key)?.filter((value) => value >= windowStart) || [];

  if (history.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(key, history);
    return false;
  }

  history.push(now);
  requestLog.set(key, history);
  return true;
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== "object") return {};
  return Object.fromEntries(
    Object.entries(headers as Record<string, unknown>).map(([k, v]) => [
      k,
      String(v),
    ]),
  );
}

async function runMonitoring(request: NextRequest) {
  if (!checkRateLimit(request)) {
    console.warn("[monitor.run] Rate limit exceeded");
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const authHeader = request.headers.get("authorization");
  const expected = process.env.MONITOR_CRON_SECRET;

  if (!expected) {
    console.error("[monitor.run] MONITOR_CRON_SECRET is not configured");
    return NextResponse.json(
      { error: "Cron secret is not configured" },
      { status: 503 },
    );
  }

  if (authHeader !== `Bearer ${expected}`) {
    console.warn("[monitor.run] Unauthorized request rejected");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const startedAt = Date.now();

  const { data: monitors, error } = await supabase
    .from("monitor_configs")
    .select("*")
    .eq("active", true)
    .lte("next_run_at", nowIso)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const processed: Array<{
    id: string;
    success: boolean;
    status: number | null;
  }> = [];

  for (const monitor of monitors || []) {
    const started = Date.now();
    let statusCode: number | null = null;
    let success = false;
    let errorMessage: string | null = null;

    try {
      const res = await fetch(monitor.url, {
        method: monitor.method || "GET",
        headers: normalizeHeaders(monitor.headers),
        body: monitor.method !== "GET" ? monitor.body || undefined : undefined,
        signal: AbortSignal.timeout(15000),
      });
      statusCode = res.status;
      success = statusCode === (monitor.expected_status || 200);
    } catch (e) {
      success = false;
      errorMessage = e instanceof Error ? e.message : "Unknown error";
    }

    const responseTimeMs = Date.now() - started;
    const nextRun = new Date(
      Date.now() + (monitor.interval_minutes || 5) * 60 * 1000,
    ).toISOString();
    const consecutiveFailures = success
      ? 0
      : (monitor.consecutive_failures || 0) + 1;

    await supabase.from("monitor_runs").insert({
      monitor_id: monitor.id,
      user_id: monitor.user_id,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      success,
      error_message: errorMessage,
    });

    await supabase
      .from("monitor_configs")
      .update({
        next_run_at: nextRun,
        last_run_at: new Date().toISOString(),
        consecutive_failures: consecutiveFailures,
        updated_at: new Date().toISOString(),
      })
      .eq("id", monitor.id);

    if (!success && monitor.alert_on_failure) {
      const { data: channels } = await supabase
        .from("alert_channels")
        .select("*")
        .eq("user_id", monitor.user_id)
        .eq("active", true);

      for (const channel of channels || []) {
        await sendAlert(
          {
            type: channel.type,
            config: (channel.config || {}) as Record<string, string>,
          },
          {
            monitorName: monitor.name,
            url: monitor.url,
            statusCode,
            responseTimeMs,
            errorMessage,
          },
        );
      }
    }

    processed.push({ id: monitor.id, success, status: statusCode });
  }

  console.info(
    `[monitor.run] completed processed=${processed.length} duration_ms=${Date.now() - startedAt}`,
  );

  return NextResponse.json({ ok: true, processed });
}

export async function POST(request: NextRequest) {
  try {
    return await runMonitoring(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return await runMonitoring(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
