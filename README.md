# ChaiGPT Streaming App

A production-grade, highly polished chat interface cloned from ChatGPT with advanced features like **AI Tool Invocations (Web Search)** and **Conversation Path Branching**.

- **Live URL**: [https://clone-gpt-theta.vercel.app/](https://clone-gpt-theta.vercel.app/)
- **Demo Video URL**: [Google Drive Link](https://drive.google.com/file/d/1EHuFmOR6WHEO8IY_kIfy7KYZEzxIUJpn/view?usp=sharing)

---

## Key Features

### 1. AI Tools (Web Search)
- **Tavily AI Search**: Instantly searches the web for queries requiring real-time facts and latest news.
- **Collapsible Tool UI**: Streams execution status cards ("Searching...", "Complete", "Error") with details including queries, answers, sources, and links.
- **In-Memory Caching**: Implements a 5-minute TTL cache on search queries to save Tavily quota and resolve duplicate searches instantly.

### 2. Chat Branching
- **Message Editing**: Hover over any user message to edit and branch the chat lineage.
- **Path Divergence**: Fully structures sibling paths using self-referential model keys (`Message.parentId` relation), preserving separate sub-threads.
- **ChatGPT-Style Pagination**: Seamlessly toggles sibling branches (`< N of M >`) inside the message toolbar.
- **Auto-Trigger Generation**: Redirects leaf nodes safely and auto-resumes LLM stream reply on unanswered branch threads.
- **Alt + Arrow Navigation**: Allows switching between branch sibling alternatives using **`Alt + ArrowLeft`** and **`Alt + ArrowRight`** shortcuts.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Auth**: Clerk (Next.js Middleware Proxy)
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma Client (with Custom generated client path support)
- **Query Management**: TanStack React Query v5
- **AI Integrations**: Vercel AI SDK, OpenRouter API (`google/gemini-2.5-flash`), Tavily AI Search SDK
- **Styling**: Tailwind CSS & Radix UI

---

## Environment Variables

Create a `.env.local` file in the root folder and add the following keys:

```env
# Database Configuration (Neon/PostgreSQL)
DATABASE_URL="your-postgresql-connection-string"

# Clerk Authentication Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk Route Settings
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/

# AI Provider Configuration (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Search Tool Integration (Tavily AI)
TAVILY_API_KEY=your_tavily_api_key
```

---

## Setup Instructions

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd ChaiGPT-Streaming-App
npm install
```

### 2. Configure Database Schema
Pushes schema models to your Neon database instance and builds client types:
```bash
npx prisma db push
npx prisma generate
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application locally.

### 4. Build for Production
Compiles types, styles, and assets:
```bash
npx next build
```
