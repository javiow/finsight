import "server-only";

import { PostHog } from "posthog-node";

interface ServerErrorContext {
  route: string;
  distinctId?: string;
  properties?: Record<string, unknown>;
}

export async function reportServerError(
  error: unknown,
  context: ServerErrorContext,
): Promise<void> {
  console.error(`[${context.route}]`, error);

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!projectToken || !host) return;

  try {
    const client = new PostHog(projectToken, { host, flushAt: 1, flushInterval: 0 });
    await client.captureExceptionImmediate(error, context.distinctId, {
      route: context.route,
      ...context.properties,
    });
    await client.shutdown();
  } catch (captureError) {
    console.error(`[${context.route}] PostHog 에러 캡처 실패`, captureError);
  }
}
