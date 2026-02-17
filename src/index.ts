/**
 * Main Worker Entry Point - cf_ai_finsight
 * ============================================================================
 * This is the main Cloudflare Worker that handles all incoming requests.
 * It routes API requests to the appropriate Durable Object or Workflow,
 * and serves static frontend assets.
 * 
 * Architecture:
 * - /api/* routes → Backend logic (Durable Objects, Workflows)
 * - /* routes → Static frontend assets (React SPA)
 * ============================================================================
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Re-export Durable Object and Workflow classes for Wrangler
export { UserSession } from './UserSession';
export { BriefingWorkflow } from './BriefingWorkflow';

// Environment bindings type definition
interface Env {
  AI: Ai;
  USER_SESSION: DurableObjectNamespace;
  BRIEFING_WORKFLOW: Workflow;
  ENVIRONMENT: string;
}

// Initialize Hono app with typed environment
const app = new Hono<{ Bindings: Env }>();

// Enable CORS for frontend communication
app.use('/api/*', cors({
  origin: '*', // In production, restrict to your domain
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

/**
 * Helper function to get the UserSession Durable Object stub
 * Uses a hardcoded ID for demo purposes - in production, use user authentication
 */
function getUserSession(env: Env, userId: string = 'default-user'): DurableObjectStub {
  // idFromName creates a consistent ID from a string
  // This ensures the same user always connects to the same Durable Object
  const id = env.USER_SESSION.idFromName(userId);
  
  // get() returns a stub that proxies requests to the Durable Object
  return env.USER_SESSION.get(id);
}

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /api/chat
 * Send a message to the AI financial coach
 * Request body: { message: string }
 * Response: { message: string, timestamp: string }
 */
app.post('/api/chat', async (c) => {
  const stub = getUserSession(c.env);
  
  // Forward the request to the Durable Object
  // The DO handles AI interaction and state management
  const response = await stub.fetch(
    new Request('http://internal/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await c.req.json()),
    })
  );

  const data = await response.json();
  return c.json(data, response.status as 200);
});

/**
 * GET /api/history
 * Retrieve the full chat history for the user
 * Response: { history: ChatMessage[] }
 */
app.get('/api/history', async (c) => {
  const stub = getUserSession(c.env);
  
  const response = await stub.fetch(
    new Request('http://internal/history', { method: 'GET' })
  );

  const data = await response.json();
  return c.json(data);
});

/**
 * POST /api/profile
 * Update the user's financial profile
 * Request body: Partial<FinancialProfile>
 * Response: { profile: FinancialProfile, success: boolean }
 */
app.post('/api/profile', async (c) => {
  const stub = getUserSession(c.env);
  
  const response = await stub.fetch(
    new Request('http://internal/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await c.req.json()),
    })
  );

  const data = await response.json();
  return c.json(data, response.status as 200);
});

/**
 * GET /api/profile
 * Get the user's current financial profile
 * Response: { profile: FinancialProfile }
 */
app.get('/api/profile', async (c) => {
  const stub = getUserSession(c.env);
  
  const response = await stub.fetch(
    new Request('http://internal/profile', { method: 'GET' })
  );

  const data = await response.json();
  return c.json(data);
});

/**
 * POST /api/clear
 * Clear the chat history (for demo/testing)
 * Response: { success: boolean, message: string }
 */
app.post('/api/clear', async (c) => {
  const stub = getUserSession(c.env);
  
  const response = await stub.fetch(
    new Request('http://internal/clear', { method: 'POST' })
  );

  const data = await response.json();
  return c.json(data);
});

/**
 * POST /api/trigger-briefing
 * Manually trigger the daily briefing workflow (for demo purposes)
 * In production, this would be triggered by a cron schedule
 * Response: { success: boolean, instanceId: string }
 */
app.post('/api/trigger-briefing', async (c) => {
  try {
    // Create a new workflow instance
    // Workflows run independently and can have multiple steps
    const instance = await c.env.BRIEFING_WORKFLOW.create({
      params: {
        userId: 'default-user',
        timestamp: new Date().toISOString(),
      },
    });

    return c.json({
      success: true,
      instanceId: instance.id,
      message: 'Daily briefing workflow triggered successfully',
    });
  } catch (error) {
    console.error('Failed to trigger briefing workflow:', error);
    return c.json(
      { success: false, error: 'Failed to trigger workflow' },
      500
    );
  }
});

/**
 * GET /api/workflow-status/:instanceId
 * Check the status of a workflow instance
 * Response: { status: string, ... }
 */
app.get('/api/workflow-status/:instanceId', async (c) => {
  try {
    const instanceId = c.req.param('instanceId');
    const instance = await c.env.BRIEFING_WORKFLOW.get(instanceId);
    const status = await instance.status();

    return c.json({
      instanceId,
      status: status.status,
      output: status.output,
      error: status.error,
    });
  } catch (error) {
    console.error('Failed to get workflow status:', error);
    return c.json(
      { success: false, error: 'Failed to get workflow status' },
      500
    );
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'cf_ai_finsight',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// ============================================================================
// Static Asset Serving (Frontend)
// ============================================================================

/**
 * Catch-all route for serving the React SPA
 * In production with [site] bucket, Wrangler handles this automatically
 * This fallback ensures the SPA routing works correctly
 */
app.get('*', async (c) => {
  // During development without built frontend, return a helpful message
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>cf_ai_finsight - API Server</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          h1 { color: #f6821f; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
          .endpoint { margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>🏦 cf_ai_finsight API Server</h1>
        <p>The API server is running. Available endpoints:</p>
        <div class="endpoint"><code>POST /api/chat</code> - Send a message to the AI coach</div>
        <div class="endpoint"><code>GET /api/history</code> - Get chat history</div>
        <div class="endpoint"><code>POST /api/profile</code> - Update financial profile</div>
        <div class="endpoint"><code>GET /api/profile</code> - Get financial profile</div>
        <div class="endpoint"><code>POST /api/trigger-briefing</code> - Trigger daily briefing</div>
        <div class="endpoint"><code>POST /api/clear</code> - Clear chat history</div>
        <div class="endpoint"><code>GET /api/health</code> - Health check</div>
        <hr>
        <p>To serve the frontend, build it with <code>npm run build:frontend</code></p>
      </body>
    </html>
  `);
});

// Export the Hono app as the default export
// Cloudflare Workers expect a fetch handler
export default app;
