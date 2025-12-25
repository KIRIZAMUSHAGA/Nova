# Replit.md - Nova AI Chat Application

## Overview

Nova is a full-stack AI chat application built with a React frontend and Express backend. It provides a conversational interface where users can interact with an AI assistant powered by OpenAI's API. The application supports multiple conversation threads, message persistence, and real-time streaming responses. The AI assistant "Nova" is designed to be a versatile, multilingual (French/English) generalist assistant.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme using CSS variables
- **Animations**: Framer Motion for message transitions
- **Markdown**: react-markdown for rendering AI responses

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **Development**: Hot module replacement via Vite middleware in development
- **Static Serving**: Built files served from `dist/public` in production

### API Design
- RESTful API with typed routes defined in `shared/routes.ts`
- Endpoints organized around threads (conversations) and messages
- OpenAI integration for chat completions with custom system prompt

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains table definitions
- **Tables**: `threads` (conversations) and `messages` (chat messages)
- **Migrations**: Managed via `drizzle-kit push` command

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including Shadcn
    pages/        # Route pages (HomePage, ThreadPage)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Database connection
  replit_integrations/  # AI service integrations
shared/           # Shared types and schemas
  schema.ts       # Drizzle table definitions
  routes.ts       # API route type definitions
```

### Build System
- Development: `npm run dev` runs tsx with Vite middleware
- Production: `npm run build` bundles client with Vite and server with esbuild
- Database: `npm run db:push` syncs schema to database

## External Dependencies

### AI Services
- **OpenAI API**: Chat completions via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
- **Image Generation**: GPT-image-1 model for image generation endpoints

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage (available but not currently in active use)

### Key npm Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migration tooling
- `@tanstack/react-query`: Server state management
- `openai`: OpenAI API client
- `zod` / `drizzle-zod`: Schema validation
- Radix UI primitives: Accessible component foundations
- `framer-motion`: Animation library
- `react-markdown`: Markdown rendering