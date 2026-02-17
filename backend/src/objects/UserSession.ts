import { runLLM } from '../utils/llm';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/**
 * Durable Object: UserSession
 * Stores user chat history and financial profile.
 */
export class UserSession {
  state: DurableObjectState;
  env: any;
  history: ChatMessage[] = [];

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async initialize() {
    if (!this.history.length) {
      this.history = (await this.state.storage.get<ChatMessage[]>('history')) || [];
    }
  }

  async fetch(request: Request) {
    await this.initialize();
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/chat') {
      const { message } = await request.json();
      const userMsg: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      this.history.push(userMsg);

      const systemPrompt = "You are a financial coach for students. Give clear, actionable, and encouraging advice.";
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.history.slice(-20).map(({ role, content }) => ({ role, content }))
      ];

      const aiResp = await runLLM(this.env, messages);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: aiResp.response || 'Sorry, I could not generate a response.',
        timestamp: new Date().toISOString(),
      };
      this.history.push(assistantMsg);
      await this.state.storage.put('history', this.history);

      return Response.json({ message: assistantMsg.content, timestamp: assistantMsg.timestamp });
    }

    if (request.method === 'GET' && url.pathname === '/history') {
      return Response.json({ history: this.history });
    }

    if (request.method === 'POST' && url.pathname === '/injectBriefing') {
      const { text } = await request.json();
      const briefingMsg: ChatMessage = {
        role: 'assistant',
        content: `📊 Morning Briefing: ${text}`,
        timestamp: new Date().toISOString(),
      };
      this.history.push(briefingMsg);
      await this.state.storage.put('history', this.history);
      return Response.json({ ok: true });
    }

    return new Response('Not found', { status: 404 });
  }
}
