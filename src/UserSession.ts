/**
 * UserSession Durable Object
 * ============================================================================
 * This Durable Object manages persistent user state including:
 * - Chat history between the user and the AI financial coach
 * - User's financial profile (income, debt, goals)
 * 
 * Cloudflare Durable Objects provide:
 * - Strongly consistent storage tied to a unique ID
 * - In-memory state that persists across requests
 * - Automatic geographic distribution
 * ============================================================================
 */

import { DurableObject } from 'cloudflare:workers';

// Type definitions for the application
export interface Env {
  AI: Ai;
  USER_SESSION: DurableObjectNamespace<UserSession>;
  BRIEFING_WORKFLOW: Workflow;
}

// Message structure for chat history
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// User's financial profile structure
export interface FinancialProfile {
  monthlyIncome?: number;
  totalDebt?: number;
  savingsGoal?: number;
  emergencyFund?: number;
  financialGoals?: string[];
  lastUpdated?: string;
}

// System prompt for the financial literacy coach
const SYSTEM_PROMPT = `You are FinSight, a friendly and knowledgeable financial literacy coach designed specifically for students. Your role is to:

1. Help students understand personal finance concepts in simple terms
2. Provide actionable advice tailored to a student's limited budget
3. Encourage healthy financial habits like budgeting, saving, and avoiding unnecessary debt
4. Explain complex topics like credit scores, student loans, and compound interest
5. Be supportive and non-judgmental about financial mistakes

Always be encouraging, use relatable examples, and break down complex concepts. Remember that students often have limited income and are just starting their financial journey.

When the user shares financial information, acknowledge it and provide relevant advice. Keep responses concise but helpful.`;

export class UserSession extends DurableObject {
  // In-memory cache for faster access (automatically persisted via storage)
  private chatHistory: ChatMessage[] = [];
  private financialProfile: FinancialProfile = {};
  private initialized = false;

  constructor(ctx: DurableObjectState, env: Env) {
    // Call parent constructor - required for Durable Objects
    super(ctx, env);
  }

  /**
   * Initialize state from storage on first access
   * Durable Objects can wake up on any request, so we need to reload state
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // ctx.storage provides key-value storage tied to this Durable Object instance
    const storedHistory = await this.ctx.storage.get<ChatMessage[]>('chatHistory');
    const storedProfile = await this.ctx.storage.get<FinancialProfile>('financialProfile');

    this.chatHistory = storedHistory || [];
    this.financialProfile = storedProfile || {};
    this.initialized = true;
  }

  /**
   * Save current state to durable storage
   */
  private async saveState(): Promise<void> {
    // Use storage.put to persist data - it survives Worker restarts
    await this.ctx.storage.put('chatHistory', this.chatHistory);
    await this.ctx.storage.put('financialProfile', this.financialProfile);
  }

  /**
   * Main fetch handler - routes requests to appropriate methods
   * Durable Objects receive requests via fetch() just like Workers
   */
  async fetch(request: Request): Promise<Response> {
    await this.initialize();

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Route: POST /chat - Handle user messages
      if (method === 'POST' && path === '/chat') {
        return await this.handleChat(request);
      }

      // Route: GET /history - Retrieve chat history
      if (method === 'GET' && path === '/history') {
        return await this.getHistory();
      }

      // Route: POST /profile - Update financial profile
      if (method === 'POST' && path === '/profile') {
        return await this.updateProfile(request);
      }

      // Route: GET /profile - Get financial profile
      if (method === 'GET' && path === '/profile') {
        return await this.getProfile();
      }

      // Route: POST /inject-briefing - Inject daily briefing (used by Workflow)
      if (method === 'POST' && path === '/inject-briefing') {
        return await this.injectBriefing(request);
      }

      // Route: POST /clear - Clear chat history
      if (method === 'POST' && path === '/clear') {
        return await this.clearHistory();
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('UserSession error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  /**
   * Handle incoming chat messages
   * This is the main interaction point with the AI
   */
  private async handleChat(request: Request): Promise<Response> {
    const body = await request.json() as { message: string };
    const userMessage = body.message?.trim();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add user message to history
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    this.chatHistory.push(userChatMessage);

    // Build context for AI including financial profile if available
    let contextualSystemPrompt = SYSTEM_PROMPT;
    if (Object.keys(this.financialProfile).length > 0) {
      contextualSystemPrompt += `\n\nUser's Financial Profile:
- Monthly Income: ${this.financialProfile.monthlyIncome ? `$${this.financialProfile.monthlyIncome}` : 'Not set'}
- Total Debt: ${this.financialProfile.totalDebt ? `$${this.financialProfile.totalDebt}` : 'Not set'}
- Savings Goal: ${this.financialProfile.savingsGoal ? `$${this.financialProfile.savingsGoal}` : 'Not set'}
- Emergency Fund: ${this.financialProfile.emergencyFund ? `$${this.financialProfile.emergencyFund}` : 'Not set'}
- Financial Goals: ${this.financialProfile.financialGoals?.join(', ') || 'Not set'}`;
    }

    // Prepare messages for AI - include recent history for context
    // Limit to last 20 messages to avoid token limits
    const recentHistory = this.chatHistory.slice(-20);
    const messages = [
      { role: 'system' as const, content: contextualSystemPrompt },
      ...recentHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Call Cloudflare Workers AI with Llama 3.3 70B model
    // env.AI is bound via wrangler.toml [ai] configuration
    const aiResponse = await (this.env as Env).AI.run(
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      {
        messages,
        max_tokens: 1024,
        temperature: 0.7, // Balanced creativity and consistency
      }
    );

    // Extract response text from AI result
    const assistantContent = 'response' in aiResponse 
      ? aiResponse.response 
      : 'I apologize, but I encountered an issue generating a response. Please try again.';

    // Add assistant response to history
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: assistantContent || 'No response generated',
      timestamp: new Date().toISOString(),
    };
    this.chatHistory.push(assistantMessage);

    // Persist updated chat history
    await this.saveState();

    return new Response(
      JSON.stringify({
        message: assistantMessage.content,
        timestamp: assistantMessage.timestamp,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * Retrieve full chat history
   */
  private async getHistory(): Promise<Response> {
    return new Response(
      JSON.stringify({ history: this.chatHistory }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Update user's financial profile
   */
  private async updateProfile(request: Request): Promise<Response> {
    const updates = await request.json() as Partial<FinancialProfile>;

    // Merge updates into existing profile
    this.financialProfile = {
      ...this.financialProfile,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    await this.saveState();

    return new Response(
      JSON.stringify({ profile: this.financialProfile, success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Get current financial profile
   */
  private async getProfile(): Promise<Response> {
    return new Response(
      JSON.stringify({ profile: this.financialProfile }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Inject a daily briefing message into chat history
   * This is called by the BriefingWorkflow to add proactive advice
   */
  private async injectBriefing(request: Request): Promise<Response> {
    const body = await request.json() as { briefing: string };
    const briefingContent = body.briefing;

    if (!briefingContent) {
      return new Response(
        JSON.stringify({ error: 'Briefing content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add briefing as an assistant message with special formatting
    const briefingMessage: ChatMessage = {
      role: 'assistant',
      content: `📊 **Daily Financial Briefing**\n\n${briefingContent}`,
      timestamp: new Date().toISOString(),
    };
    this.chatHistory.push(briefingMessage);

    await this.saveState();

    return new Response(
      JSON.stringify({ success: true, message: 'Briefing injected successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Clear chat history (useful for testing/demo)
   */
  private async clearHistory(): Promise<Response> {
    this.chatHistory = [];
    await this.saveState();

    return new Response(
      JSON.stringify({ success: true, message: 'History cleared' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
