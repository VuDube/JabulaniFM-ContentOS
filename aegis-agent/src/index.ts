import type { Env } from './types';
import { handleApiRequest } from './routes/api';
import { handleTTSRequest } from './routes/tts';
import { handlePaystackWebhook } from './routes/paystack';
import { runDreamingCycle } from './dreaming/cycle';

const fallbackSite = `<!doctype html><html lang="en-ZA"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>JabulaniFM</title><style>body{margin:0;background:#0a0b0e;color:#f9fafb;font:16px system-ui;padding:12vw 8vw}main{max-width:850px}small{color:#f59e0b;letter-spacing:.15em}h1{font-size:clamp(3rem,9vw,8rem);line-height:.9;letter-spacing:-.07em}em{color:#f59e0b;font-style:normal}p{color:#9ca3af;line-height:1.6}.button{display:inline-block;background:#f59e0b;color:#0a0b0e;padding:14px 20px;font-weight:700}</style><main><small>JABULANIFM / CONTENT OS</small><h1>South African ideas,<br><em>broadcast differently.</em></h1><p>Ten specialist shows covering money, work, culture, history and health — made for the way Mzansi actually lives.</p><a class="button" href="/api/shows">Explore the network API</a></main>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,x-paystack-signature' } });
    if (url.pathname.startsWith('/api/')) return handleApiRequest(request, env);
    if (url.pathname.startsWith('/tts/')) return handleTTSRequest(request, env);
    if (url.pathname === '/webhook/paystack') return handlePaystackWebhook(request, env);
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response(fallbackSite, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(event.cron === '0 6 * * *' ? runDreamingCycle(env) : event.cron === '0 3 * * *' ? env.CONTENT_QUEUE.send({ type: 'daily_generation' }) : Promise.resolve());
  },
  async queue(batch: MessageBatch<unknown>, env: Env) {
    for (const message of batch.messages) {
      if (message.body && typeof message.body === 'object' && 'show_slug' in message.body) await env.DB.prepare("UPDATE content_jobs SET status='script_ready' WHERE show_slug=? AND status='script_ready'").bind((message.body as { show_slug: string }).show_slug).run();
      message.ack();
    }
  }
};
