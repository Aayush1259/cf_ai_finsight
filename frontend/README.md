# Frontend Structure

- `src/main.tsx`: React entry point.
- `src/App.tsx`: Main layout and routing.
- `src/components/Chat.tsx`: Chat UI.
- `src/components/ProfileModal.tsx`: Profile management UI.
- `src/index.css`: Tailwind and custom styles.

## Workflow

- Polls backend for chat history and briefings.
- Sends user messages to `/api/chat`.
- Triggers workflow via `/api/trigger-briefing`.

This structure keeps UI logic modular and easy to extend.
