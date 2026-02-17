import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { runLLM } from '../utils/llm';

/**
 * BriefingWorkflow: Generates and injects a daily financial briefing.
 */
export class BriefingWorkflow extends WorkflowEntrypoint<any, { userId: string }> {
  async run(event: WorkflowEvent<{ userId: string }>, step: WorkflowStep) {
    // Step 1: Fetch mock market data
    const news = await step.do('fetch-news', async () => [
      "Interest rates dropped by 0.25%",
      "Student loan forgiveness program expanded",
      "Part-time job market is growing"
    ]);

    // Step 2: LLM analyzes news for a student
    const summary = await step.do('analyze-news', async () => {
      const prompt = `Today's news: ${news.join('; ')}. Summarize what this means for a college student and give 2 actionable tips.`;
      const resp = await runLLM(this.env, [
        { role: 'system', content: "You are a financial coach for students." },
        { role: 'user', content: prompt }
      ], 256);
      return resp.response || 'No summary generated.';
    });

    // Step 3: Inject briefing into UserSession DO
    await step.do('inject-briefing', async () => {
      const id = this.env.USER_SESSION.idFromName('default-user');
      const stub = this.env.USER_SESSION.get(id);
      await stub.fetch(new Request('http://internal/injectBriefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summary })
      }));
      return true;
    });

    return 'Briefing complete';
  }
}
