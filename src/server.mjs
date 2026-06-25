#!/usr/bin/env node
// spotlight-api — a small OpenAPI-first HTTP surface over the Spotlight engine.
import Fastify from 'fastify';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { lint, listRulesets, FORMATS, BUILTIN_RULESETS } from './engine.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' }, bodyLimit: 8 * 1024 * 1024 });

// Permissive CORS for a public read API (no credentials used).
app.addHook('onRequest', async (req, reply) => {
  reply.header('access-control-allow-origin', '*');
  reply.header('access-control-allow-methods', 'GET,POST,OPTIONS');
  reply.header('access-control-allow-headers', 'content-type');
  if (req.method === 'OPTIONS') reply.code(204).send();
});

app.get('/', async () => ({
  service: 'spotlight-api',
  version: pkg.version,
  description: 'Lint API artifacts and work with Spotlight rulesets over HTTP.',
  openapi: '/openapi.yaml',
  endpoints: ['POST /lint', 'GET /rulesets', 'GET /formats', 'POST /rulesets/validate', 'GET /health'],
}));

app.get('/health', async () => ({ status: 'ok' }));

app.get('/openapi.yaml', async (_req, reply) => {
  reply.header('content-type', 'application/yaml');
  return readFileSync(join(ROOT, 'openapi.yaml'), 'utf8');
});

app.get('/formats', async () => ({ formats: FORMATS }));

app.get('/rulesets', async () => ({ rulesets: listRulesets() }));

// POST /lint  { content, format?, ruleset? }  ->  { diagnostics, counts }
app.post('/lint', async (req, reply) => {
  const { content, format, ruleset } = req.body ?? {};
  if (typeof content !== 'string' || !content.trim()) {
    return reply.code(400).send({ error: 'bad_request', detail: '`content` (string) is required' });
  }
  try {
    const out = await lint(content, { format, ruleset });
    return { ...out, total: out.diagnostics.length };
  } catch (e) {
    return reply.code(422).send({ error: 'lint_error', detail: String(e?.message || e) });
  }
});

// POST /rulesets/validate  { ruleset }  ->  { valid, error? }
// Validates by constructing the ruleset with the engine (structural check).
app.post('/rulesets/validate', async (req, reply) => {
  let { ruleset } = req.body ?? {};
  if (ruleset == null) return reply.code(400).send({ error: 'bad_request', detail: '`ruleset` is required' });
  if (typeof ruleset === 'string') {
    try { ruleset = parse(ruleset); } catch (e) { return { valid: false, error: `not valid YAML/JSON: ${e.message}` }; }
  }
  try {
    await lint('{}\n', { ruleset }); // build + run on an empty doc
    return { valid: true };
  } catch (e) {
    return { valid: false, error: String(e?.message || e) };
  }
});

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '0.0.0.0';
app.listen({ port, host }).then(() => app.log.info(`spotlight-api on http://${host}:${port}`)).catch((e) => {
  app.log.error(e);
  process.exit(1);
});

export { app };
