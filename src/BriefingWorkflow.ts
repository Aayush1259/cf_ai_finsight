/**
 * BriefingWorkflow - Daily Financial Briefing Generator
 * ============================================================================
 * This Cloudflare Workflow coordinates the generation of daily financial
 * advice for users. Workflows provide:
 * 
 * - Durable execution that survives Worker restarts
 * - Step-by-step execution with automatic retries
 * - Long-running operations without timeout concerns
 * - State persistence between steps
 * 
 * In production, this would be triggered by a cron schedule (e.g., every morning).
 * For demo purposes, it can be manually triggered via the API.
 * ============================================================================
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

// Environment bindings
interface Env {
  AI: Ai;
  USER_SESSION: DurableObjectNamespace;
  BRIEFING_WORKFLOW: Workflow;
}

// Workflow input parameters
interface BriefingParams {
  userId: string;
  timestamp: string;
}

// Mock financial news data structure
interface FinancialNews {
  headline: string;
  summary: string;
  category: string;
  relevanceToStudents: string;
}

/**
 * BriefingWorkflow Class
 * Extends WorkflowEntrypoint to define a multi-step workflow
 */
export class BriefingWorkflow extends WorkflowEntrypoint<Env, BriefingParams> {
  /**
   * Main workflow execution method
   * Called when the workflow is triggered
   */
  async run(event: WorkflowEvent<BriefingParams>, step: WorkflowStep): Promise<string> {
    const { userId, timestamp } = event.payload;

    console.log(`Starting daily briefing workflow for user: ${userId} at ${timestamp}`);

    // ========================================================================
    // Step 1: Fetch Mock Financial News
    // In production, this would call real financial news APIs
    // ========================================================================
    const financialNews = await step.do('fetch-financial-news', async () => {
      // Simulate fetching financial news relevant to students
      // In a real app, you'd call APIs like:
      // - Alpha Vantage for market data
      // - NewsAPI for financial headlines
      // - Federal Reserve API for interest rates
      
      const mockNews: FinancialNews[] = [
        {
          headline: 'Federal Reserve Holds Interest Rates Steady',
          summary: 'The Federal Reserve announced it will maintain current interest rates, citing stable inflation and employment figures.',
          category: 'Interest Rates',
          relevanceToStudents: 'This affects student loan interest rates and savings account yields.',
        },
        {
          headline: 'Entry-Level Job Market Shows Strong Growth',
          summary: 'The Bureau of Labor Statistics reports a 5% increase in entry-level positions, particularly in technology and healthcare sectors.',
          category: 'Employment',
          relevanceToStudents: 'Good news for graduating students entering the workforce.',
        },
        {
          headline: 'Average Rent Prices Stabilize in College Towns',
          summary: 'After two years of increases, rental prices in major college towns have plateaued, according to a new housing report.',
          category: 'Housing',
          relevanceToStudents: 'Rent costs are a major expense for students living off-campus.',
        },
        {
          headline: 'New Student Loan Forgiveness Program Announced',
          summary: 'The Department of Education unveiled a new income-driven repayment plan that could reduce monthly payments for recent graduates.',
          category: 'Student Loans',
          relevanceToStudents: 'Directly impacts students with federal student loans.',
        },
      ];

      // Randomly select 2-3 news items to make briefings varied
      const shuffled = mockNews.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
    });

    console.log(`Fetched ${financialNews.length} financial news items`);

    // ========================================================================
    // Step 2: Generate AI Summary for Students
    // Use Llama 3.3 to create personalized advice based on the news
    // ========================================================================
    const studentSummary = await step.do('generate-student-summary', async () => {
      // Format news for the AI prompt
      const newsContext = financialNews
        .map((news, i) => `${i + 1}. **${news.headline}**\n   ${news.summary}\n   Student Relevance: ${news.relevanceToStudents}`)
        .join('\n\n');

      const prompt = `You are a friendly financial literacy coach for students. Based on today's financial news, provide a brief, encouraging morning briefing.

Today's Financial News:
${newsContext}

Instructions:
1. Summarize how each piece of news might affect students specifically
2. Provide 2-3 actionable tips based on the news
3. Keep the tone positive and encouraging
4. Use simple language that college students would understand
5. Keep the total response under 300 words

Start with a friendly greeting appropriate for a morning briefing.`;

      // Call Cloudflare Workers AI
      // step.do ensures this is retried if it fails
      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          {
            role: 'system',
            content: 'You are FinSight, a helpful and encouraging financial literacy coach for students. You explain complex financial topics in simple terms.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 512,
        temperature: 0.7,
      });

      // Extract response text
      const summaryText = 'response' in response 
        ? response.response 
        : 'Unable to generate summary. Please check back later for your daily financial briefing.';

      return summaryText || 'No summary generated';
    });

    console.log('Generated student-focused financial summary');

    // ========================================================================
    // Step 3: Inject Briefing into User's Chat History
    // Connect to the Durable Object and add the briefing message
    // ========================================================================
    const injectionResult = await step.do('inject-briefing-to-chat', async () => {
      // Get the user's Durable Object stub
      const doId = this.env.USER_SESSION.idFromName(userId);
      const stub = this.env.USER_SESSION.get(doId);

      // Call the inject-briefing endpoint on the Durable Object
      const response = await stub.fetch(
        new Request('http://internal/inject-briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefing: studentSummary }),
        })
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to inject briefing: ${errorText}`);
      }

      const result = await response.json() as { success: boolean; message: string };
      return result;
    });

    console.log('Briefing injection result:', injectionResult);

    // ========================================================================
    // Workflow Complete
    // Return a summary of what was accomplished
    // ========================================================================
    const completionMessage = `Daily briefing workflow completed successfully.
- User: ${userId}
- News items processed: ${financialNews.length}
- Briefing injected: ${injectionResult.success ? 'Yes' : 'No'}
- Timestamp: ${new Date().toISOString()}`;

    console.log(completionMessage);

    return completionMessage;
  }
}
