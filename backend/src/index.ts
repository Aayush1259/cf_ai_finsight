import { Hono } from 'hono';
import { UserSession } from './objects/UserSession';
import { BriefingWorkflow } from './workflows/BriefingWorkflow';

export { UserSession, BriefingWorkflow };

type Env = {
  AI: Ai;
  USER_SESSION: DurableObjectNamespace;
  BRIEFING_WORKFLOW: Workflow;
};

const app = new Hono<{ Bindings: Env }>();

function getUserSession(env: Env) {
  const id = env.USER_SESSION.idFromName('default-user');
  return env.USER_SESSION.get(id);
}

app.post('/api/chat', async (c) => {
  const stub = getUserSession(c.env);
  const req = new Request('http://internal/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await c.req.json()),
  });
  const resp = await stub.fetch(req);
  return c.json(await resp.json(), resp.status as 200);
});

app.get('/api/history', async (c) => {
  const stub = getUserSession(c.env);
  const resp = await stub.fetch(new Request('http://internal/history'));
  return c.json(await resp.json());
});

app.post('/api/trigger-briefing', async (c) => {
  const instance = await c.env.BRIEFING_WORKFLOW.create({
    params: { userId: 'default-user' }
  });
  return c.json({ success: true, instanceId: instance.id });
});

app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.get('*', (c) =>
  c.html(`<h1>cf_ai_finsight API running</h1>`)
);

export default app;
