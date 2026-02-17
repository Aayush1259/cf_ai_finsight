// LLM utility for calling Cloudflare Workers AI
export async function runLLM(env: any, messages: any[], max_tokens = 512, temperature = 0.7) {
  return await env.AI.run(
    '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    { messages, max_tokens, temperature }
  );
}
