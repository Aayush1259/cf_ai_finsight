# Backend Structure

- `src/index.ts`: Main Worker entry point, API routing.
- `src/objects/UserSession.ts`: Durable Object for user state.
- `src/workflows/BriefingWorkflow.ts`: Workflow for daily briefings.
- `src/utils/`: Shared utility functions (future-proofing for scaling).

## Workflow

1. **User interacts** with the React frontend.
2. **API routes** requests to the correct Durable Object (UserSession).
3. **UserSession** stores/retrieves chat and financial state.
4. **BriefingWorkflow** runs daily (or on demand), fetches user state, generates a briefing with LLM, and injects it into the chat history.

This separation ensures maintainability and scalability for future features (e.g., more workflows, more objects, more utils).
