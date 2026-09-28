import type { Env, ScriptResult } from '../types';
import { routeAI } from '../providers/router';

export async function generateScript(env: Env, showSlug: string, topic: string): Promise<ScriptResult> {
  const show = await env.DB
    .prepare('SELECT show_name,tone,target_demographic FROM shows WHERE show_slug=?')
    .bind(showSlug)
    .first<{ show_name: string; tone: string; target_demographic: string }>();
  if (!show) throw new Error(`Unknown show: ${showSlug}`);

  const prompt = `Create a South African short-form video for ${show.show_name}. Topic: ${topic}. Tone: ${show.tone}. Audience: ${show.target_demographic}. Return JSON only with title, hook, body, cta, full_script, affiliate_keywords (array), scene_descriptions (exactly 8), target_platforms (array). Use accurate ZAR and local context; never invent statistics.`;
  const raw = await routeAI(env, 'script', prompt, "You are JabulaniFM's fact-conscious editorial producer.");
  const clean = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(clean) as ScriptResult;
  if (!parsed.title || !parsed.full_script || parsed.scene_descriptions?.length !== 8) {
    throw new Error('AI output failed editorial schema validation');
  }
  parsed.show_slug = showSlug;
  await env.DB
    .prepare("INSERT INTO content_jobs(show_slug,topic,script,status) VALUES(?,?,?,'script_ready')")
    .bind(showSlug, topic, JSON.stringify(parsed))
    .run();
  await env.CONTENT_QUEUE.send({ type: 'render_request', show_slug: showSlug, topic, script: parsed });
  return parsed;
}
