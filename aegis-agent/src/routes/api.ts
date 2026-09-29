import type { Env } from '../types';
import { generateScript } from '../content/script-gen';
import { recordEpisode, listEpisodes } from '../memory/episodic';
import { searchSemantic, upsertSemantic } from '../memory/semantic';
import { listGoals, createGoal, updateGoal } from '../goals/autonomous';
import { fetchNotebookLMResearch } from '../research/notebooklm';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const parseJson = async <T>(request: Request): Promise<T> => { try { return await request.json() as T; } catch { throw new Error('Request body must be valid JSON'); } };

async function allowRequest(env: Env, key: string): Promise<boolean> {
  const date = new Date().toISOString().slice(0, 10); const row = await env.DB.prepare('SELECT count FROM rate_limits WHERE api_key=? AND date=?').bind(key, date).first<{ count: number }>();
  if ((row?.count ?? 0) >= 100) return false;
  await env.DB.prepare('INSERT INTO rate_limits(api_key,date,count) VALUES(?,?,1) ON CONFLICT(api_key,date) DO UPDATE SET count=count+1').bind(key, date).run();
  return true;
}

export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = request.headers.get('CF-Connecting-IP') ?? 'anonymous';
  if (!(await allowRequest(env, key))) return json({ error: 'Daily request limit reached' }, 429);
  try {
    if (request.method === 'GET' && url.pathname === '/api/health') return json({ ok: true, service: 'jabulanifm', version: '2.0.0', timestamp: new Date().toISOString() });
    if (request.method === 'GET' && url.pathname === '/api/shows') { const result = await env.DB.prepare("SELECT show_slug,show_name,tone,target_demographic,primary_platforms,rpm_range,recurring_offer_name,recurring_offer_price FROM shows WHERE status='active' ORDER BY id").all(); return json({ shows: result.results }); }
    if (request.method === 'GET' && /^\/api\/shows\/[^/]+$/.test(url.pathname)) { const slug = url.pathname.split('/').pop(); const show = await env.DB.prepare("SELECT * FROM shows WHERE show_slug=? AND status='active'").bind(slug).first(); return show ? json(show) : json({ error: 'Show not found' }, 404); }
    if (request.method === 'GET' && url.pathname === '/api/content/jobs') { const jobs = await env.DB.prepare('SELECT * FROM content_jobs ORDER BY created_at DESC LIMIT 50').all(); return json({ jobs: jobs.results }); }
    if (request.method === 'POST' && url.pathname === '/api/content/generate') { const body = await parseJson<{ show_slug?: string; topic?: string }>(request); if (!body.show_slug || !body.topic || body.topic.length > 240) return json({ error: 'show_slug and a topic up to 240 characters are required' }, 400); return json(await generateScript(env, body.show_slug, body.topic), 202); }
    if (request.method === 'GET' && url.pathname === '/api/memory/episodic') return json({ memories: await listEpisodes(env, url.searchParams.get('session_id') ?? '') });
    if (request.method === 'POST' && url.pathname === '/api/memory/episodic') { const body = await parseJson<{ session_id?: string; show_slug?: string; role?: 'user'|'agent'|'system'; content?: string }>(request); if (!body.session_id || !body.role || !body.content) return json({ error: 'session_id, role, and content are required' }, 400); return json(await recordEpisode(env, {session_id:body.session_id,show_slug:body.show_slug,role:body.role,content:body.content})); }
    if (request.method === 'GET' && url.pathname === '/api/memory/semantic') return json({ memories: await searchSemantic(env, url.searchParams.get('q') ?? '') });
    if (request.method === 'POST' && url.pathname === '/api/memory/semantic') { const body = await parseJson<{ concept?: string; definition?: string; source?: string; confidence?: number }>(request); if (!body.concept || !body.definition) return json({ error: 'concept and definition are required' }, 400); return json(await upsertSemantic(env, {concept:body.concept,definition:body.definition,source:body.source,confidence:body.confidence})); }
    if (request.method === 'GET' && url.pathname === '/api/goals') return json({ goals: await listGoals(env) });
    if (request.method === 'POST' && url.pathname === '/api/goals') { const body = await parseJson<{ goal_title?: string; goal_description?: string; show_slug?: string; standing_order?: string; schedule_cron?: string }>(request); if (!body.goal_title || !body.goal_description) return json({ error: 'goal_title and goal_description are required' }, 400); return json(await createGoal(env, {goal_title:body.goal_title,goal_description:body.goal_description,show_slug:body.show_slug,standing_order:body.standing_order,schedule_cron:body.schedule_cron}), 201); }
    if (request.method === 'PATCH' && url.pathname.startsWith('/api/goals/')) { const id = Number(url.pathname.split('/').pop()); const body = await parseJson<{ status?: string; progress?: number }>(request); return json(await updateGoal(env, id, body)); }
    if (request.method === 'POST' && url.pathname === '/api/research/notebooklm') { const body = await parseJson<{ notebook_id?: string; query?: string }>(request); if (!body.notebook_id || !body.query) return json({ error: 'notebook_id and query are required' }, 400); return json(await fetchNotebookLMResearch(env, body.notebook_id, body.query)); }
    return json({ error: 'Not found' }, 404);
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Request failed' }, 500); }
}
