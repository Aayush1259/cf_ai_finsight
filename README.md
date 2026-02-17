# 🏦 cf_ai_finsight - Context-Aware Financial Literacy Coach

A full-stack AI application built on Cloudflare's developer platform that provides personalized financial literacy coaching for students. The application leverages Cloudflare Workers AI, Durable Objects, and Workflows to deliver an intelligent, stateful, and proactive financial advisory experience.

## 📋 Project Overview

**cf_ai_finsight** (Financial Insight) is a web application that combines:

- **AI-Powered Chat**: Real-time conversations with an AI financial literacy coach
- **Persistent User State**: Long-term storage of chat history and financial profiles
- **Proactive Advice**: Automated daily briefings based on simulated financial news

### Key Features

- 💬 **Interactive Chat Interface** - Ask questions about budgeting, saving, investing, student loans
- 📊 **Financial Profile Management** - Store income, debt, goals for personalized advice
- 📰 **Daily Financial Briefings** - Automated workflow that generates relevant financial news summaries
- 🔒 **Persistent State** - All data stored securely in Cloudflare Durable Objects
- ⚡ **Edge Computing** - Fast responses from Cloudflare's global network

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌─────────────────────────────────────┐   │
│  │   React SPA      │    │         Cloudflare Worker           │   │
│  │   (Pages/Vite)   │───▶│         (Hono Router)               │   │
│  │                  │    │                                      │   │
│  │  • Chat UI       │    │  Routes:                            │   │
│  │  • Profile Modal │    │  • POST /api/chat                   │   │
│  │  • Briefing Btn  │    │  • GET  /api/history                │   │
│  └──────────────────┘    │  • POST /api/profile                │   │
│                          │  • POST /api/trigger-briefing       │   │
│                          └─────────────┬───────────────────────┘   │
│                                        │                            │
│                    ┌───────────────────┴───────────────────┐       │
│                    │                                        │       │
│                    ▼                                        ▼       │
│  ┌─────────────────────────────┐    ┌──────────────────────────┐  │
│  │     Durable Object          │    │   Cloudflare Workflow     │  │
│  │     (UserSession)           │    │   (BriefingWorkflow)      │  │
│  │                             │    │                           │  │
│  │  • Chat History Storage     │◀───│  Step 1: Fetch News       │  │
│  │  • Financial Profile        │    │  Step 2: AI Summarize     │  │
│  │  • AI Conversation Handler  │    │  Step 3: Inject Briefing  │  │
│  └──────────────┬──────────────┘    └──────────────────────────┘  │
│                 │                                                   │
│                 ▼                                                   │
│  ┌─────────────────────────────┐                                   │
│  │    Cloudflare Workers AI    │                                   │
│  │                             │                                   │
│  │  @cf/meta/llama-3.3-70b-   │                                   │
│  │  instruct-fp8-fast          │                                   │
│  └─────────────────────────────┘                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React + Vite + Tailwind | User interface for chat and profile management |
| **API Router** | Cloudflare Worker + Hono | Routes requests to appropriate handlers |
| **State Management** | Durable Objects | Persistent storage for user data and chat history |
| **AI Engine** | Workers AI (Llama 3.3 70B) | Generates contextual financial advice |
| **Automation** | Cloudflare Workflows | Orchestrates daily briefing generation |

---

## 📁 Project Structure

```
cf_ai_finsight/
├── wrangler.toml              # Cloudflare Worker configuration
├── package.json               # Backend dependencies
├── tsconfig.json              # TypeScript configuration
├── README.md                  # This file
├── PROMPTS.md                 # AI prompt documentation
│
├── src/                       # Backend source code
│   ├── index.ts               # Main Worker entry point (Hono router)
│   ├── UserSession.ts         # Durable Object for user state
│   └── BriefingWorkflow.ts    # Workflow for daily briefings
│
├── frontend/                  # React SPA
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── index.html             # HTML entry point
│   └── src/
│       ├── main.tsx           # React entry point
│       ├── App.tsx            # Main App component
│       ├── index.css          # Global styles
│       └── components/
│           ├── Chat.tsx       # Chat interface component
│           └── ProfileModal.tsx # Profile editor component
│
└── public/                    # Built frontend assets (generated)
```

---

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js
- **Wrangler CLI** (v3.0.0 or higher) - Cloudflare's CLI tool

```bash
# Install Wrangler globally (if not already installed)
npm install -g wrangler

# Verify installations
node --version    # Should be v18+
npm --version     # Should be v9+
wrangler --version # Should be v3+
```

### Cloudflare Account Setup

1. Create a free [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Authenticate Wrangler with your account:
   ```bash
   wrangler login
   ```

---

## 💻 Local Development

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd cf_ai_finsight

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Run Development Servers

You'll need two terminal windows/tabs:

**Terminal 1 - Backend (Cloudflare Worker)**
```bash
npm run dev
```
This starts the Wrangler dev server at `http://localhost:8787`

**Terminal 2 - Frontend (Vite)**
```bash
cd frontend
npm run dev
```
This starts the Vite dev server at `http://localhost:5173`

### 3. Access the Application

Open your browser and navigate to:
- **Frontend**: `http://localhost:5173` (recommended for development)
- **API Only**: `http://localhost:8787`

The Vite dev server automatically proxies API requests to the Wrangler backend.

---

## 🌐 Deployment

### 1. Build the Frontend

```bash
# From the project root
npm run build:frontend

# On Unix/Linux/Mac, use:
npm run build:frontend:unix
```

This builds the React app and copies it to the `public/` directory.

### 2. Deploy to Cloudflare

```bash
# Deploy to development environment
npm run deploy

# Deploy to production environment
npm run deploy:production
```

### 3. Verify Deployment

After deployment, Wrangler will output your Worker URL:
```
Published cf_ai_finsight (X.XX sec)
  https://cf_ai_finsight.<your-subdomain>.workers.dev
```

---

## 🔧 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a message to the AI coach |
| `GET` | `/api/history` | Retrieve chat history |
| `POST` | `/api/profile` | Update financial profile |
| `GET` | `/api/profile` | Get financial profile |
| `POST` | `/api/trigger-briefing` | Manually trigger daily briefing |
| `POST` | `/api/clear` | Clear chat history |
| `GET` | `/api/health` | Health check endpoint |

### Example Requests

**Send a Chat Message**
```bash
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I create a student budget?"}'
```

**Update Financial Profile**
```bash
curl -X POST http://localhost:8787/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyIncome": 1500,
    "totalDebt": 25000,
    "savingsGoal": 200,
    "financialGoals": ["Build emergency fund", "Pay off credit card"]
  }'
```

**Trigger Daily Briefing**
```bash
curl -X POST http://localhost:8787/api/trigger-briefing
```

---

## 🔐 Environment Variables

The following variables are configured in `wrangler.toml`:

| Variable | Description |
|----------|-------------|
| `ENVIRONMENT` | Current environment (development/production) |

### Bindings (Automatic via wrangler.toml)

| Binding | Type | Description |
|---------|------|-------------|
| `AI` | Workers AI | Access to Llama 3.3 model |
| `USER_SESSION` | Durable Object | User state management |
| `BRIEFING_WORKFLOW` | Workflow | Daily briefing orchestration |

---

## 📚 Cloudflare-Specific Concepts

### Durable Objects

Durable Objects provide strongly consistent, stateful storage that's globally distributed. In this app:

- Each user gets their own Durable Object instance
- Chat history and financial profile are stored per-user
- State persists across Worker restarts and redeployments

### Workflows

Cloudflare Workflows enable multi-step, durable execution:

- Steps are automatically retried on failure
- State persists between steps
- Long-running operations without timeout concerns

### Workers AI

Cloudflare Workers AI provides access to ML models at the edge:

- No external API keys needed
- Low latency from Cloudflare's global network
- Uses Llama 3.3 70B for high-quality responses

---

## 🧪 Testing

### Manual Testing

1. Start the development servers (see Local Development)
2. Open the frontend in your browser
3. Try these test scenarios:
   - Send various financial questions
   - Update your financial profile
   - Trigger a daily briefing
   - Clear chat history and start fresh

### API Testing with curl

```bash
# Test health endpoint
curl http://localhost:8787/api/health

# Test chat
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is compound interest?"}'

# Get history
curl http://localhost:8787/api/history
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "AI binding not found"**
- Ensure you're logged into Wrangler: `wrangler login`
- Workers AI requires a Cloudflare account with AI access

**2. "Durable Object not found"**
- Run `wrangler deploy` to create the Durable Object namespace
- Check that migrations are defined in `wrangler.toml`

**3. "Workflow failed to start"**
- Verify the workflow class is exported from `src/index.ts`
- Check Cloudflare dashboard for workflow logs

**4. Frontend not connecting to API**
- Ensure Wrangler is running on port 8787
- Check Vite proxy configuration in `vite.config.ts`

### Viewing Logs

```bash
# Stream live logs from deployed Worker
npm run tail
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
