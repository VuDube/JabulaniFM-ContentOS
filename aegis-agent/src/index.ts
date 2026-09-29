import type { Env } from './types';
import { handleApiRequest } from './routes/api';
import { handleTTSRequest } from './routes/tts';
import { handlePaystackWebhook } from './routes/paystack';
import { runDreamingCycle } from './dreaming/cycle';
import { runContentPipeline } from './content/pipeline';
import { runWeeklyStrategy } from './goals/autonomous';
import { handleMcpRequest } from './mcp/server';

function corsHeaders(): HeadersInit {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-paystack-signature' };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    let response: Response;
    if (url.pathname.startsWith('/api/')) response = await handleApiRequest(request, env);
    else if (url.pathname.startsWith('/tts/')) response = await handleTTSRequest(request, env);
    else if (url.pathname === '/webhook/paystack') response = await handlePaystackWebhook(request, env);
    else if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) response = await handleMcpRequest(request, env);
    else response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      if (event.cron === '0 3 * * *') await runContentPipeline(env);
      else if (event.cron === '0 6 * * *') await runDreamingCycle(env);
      else if (event.cron === '0 12 * * 1') await runWeeklyStrategy(env);
    })());
  },
  async queue(batch: MessageBatch<unknown>, env: Env) {
    for (const message of batch.messages) {
      try {
        const body = message.body as { type?: string; job_id?: number; show_slug?: string };
        if (body.type === 'render_request' && body.job_id) await env.DB.prepare("UPDATE content_jobs SET status='script_ready' WHERE id=?").bind(body.job_id).run();
        message.ack();
      } catch (error) {
        await env.DB.prepare("UPDATE daily_stats SET errors=errors+1, updated_at=CURRENT_TIMESTAMP WHERE date=?").bind(new Date().toISOString().slice(0, 10)).run().catch(() => undefined);
        message.retry();
      }
    }
  }
};
