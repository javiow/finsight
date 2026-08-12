import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { reportServerError } from "@/lib/posthog/server";
import { createServiceClient } from "@/lib/supabase/service";

const GITHUB_REPO = "javiow/finsight";

const payloadSchema = z.object({
  event_id: z.string().min(1),
  alert_kind: z.enum(["issue", "spike"]),
  issue_id: z.string().optional(),
  alert_id: z.string().optional(),
  title: z.string().min(1),
  url: z.string().url(),
  occurred_at: z.string().min(1),
});

type PostHogAlertPayload = z.infer<typeof payloadSchema>;

function isValidSecret(received: string | null): boolean {
  const expected = process.env.POSTHOG_ALERT_WEBHOOK_SECRET;
  if (!expected || !received) return false;

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

async function dispatchToCi(alert: PostHogAlertPayload): Promise<void> {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_DISPATCH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event_type: "posthog-alert", client_payload: alert }),
  });

  if (!response.ok) {
    throw new Error(`GitHub repository_dispatch 실패: ${response.status}`);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isValidSecret(request.headers.get("x-webhook-secret"))) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const parsedBody = payloadSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }
    const alert = parsedBody.data;

    const service = createServiceClient();

    // event_id를 먼저 삽입해 멱등성을 확보한다 — dispatch 성공 여부와 무관하게
    // 같은 배달(delivery)이 두 번 CI를 깨우지 않도록 삽입이 dispatch보다 앞선다.
    const { error: insertError } = await service.from("oncall_alert_events").insert({
      event_id: alert.event_id,
      alert_kind: alert.alert_kind,
      payload: alert,
    });

    let shouldDispatch = true;
    if (insertError) {
      if (insertError.code === "23505") {
        // 재전송(retry) — 이전 시도가 dispatch까지 끝냈는지 확인해 그 경우만 스킵한다.
        const { data: existing } = await service
          .from("oncall_alert_events")
          .select("dispatch_status")
          .eq("event_id", alert.event_id)
          .single();
        shouldDispatch = existing?.dispatch_status !== "dispatched";
      } else {
        throw insertError;
      }
    }

    if (!shouldDispatch) {
      return NextResponse.json({ status: "duplicate" }, { status: 200 });
    }

    await dispatchToCi(alert);

    await service
      .from("oncall_alert_events")
      .update({ dispatch_status: "dispatched" })
      .eq("event_id", alert.event_id);

    return NextResponse.json({ status: "dispatched" }, { status: 202 });
  } catch (error) {
    await reportServerError(error, { route: "POST /api/webhooks/posthog-alert" });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
