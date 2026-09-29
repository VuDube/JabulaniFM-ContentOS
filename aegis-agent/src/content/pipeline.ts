import type { Env } from '../types';
const topics = ['How South Africans can build resilience in 2026','The practical decision behind a better month','What the latest local data means for ordinary households'];
export async function runContentPipeline(env: Env) { const shows = await env.DB.prepare("SELECT show_slug FROM shows WHERE status='active' ORDER BY id LIMIT 3").all<{ show_slug: string }>(); for (const [index, show] of shows.results.entries()) await env.CONTENT_QUEUE.send({ type: 'scheduled_generation', show_slug: show.show_slug, topic: topics[index % topics.length] }); }
