# Replit.md - Nova AI Chat Application

## Overview

Nova is a full-stack AI chat application with **user authentication** built with a React frontend and Express backend. It provides a conversational interface where users can interact with an AI assistant powered by OpenAI's API. The application supports multiple conversation threads, message persistence, real-time streaming responses, and secure user accounts. The AI assistant "Nova" is designed to be a versatile, multilingual (French/English) generalist assistant.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Authentication**: JWT tokens stored in localStorage, sent in Authorization headers
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme using CSS variables
- **Animations**: Framer Motion for message transitions
- **Markdown**: react-markdown for rendering AI responses

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **Development**: Hot module replacement via Vite middleware in development
- **Static Serving**: Built files served from `dist/public` in production
- **Security**: JWT authentication middleware on protected routes

### API Design
- RESTful API with typed routes defined in `shared/routes.ts`
- Endpoints organized around threads (conversations), messages, and authentication
- OpenAI integration for chat completions with custom system prompt
- All threads/messages endpoints require JWT authentication

### Data Storage
- **Database**: MongoDB Atlas (external connection)
- **Collections**: 
  - `users` - User accounts with email, passwordHash, plan, quotaUsed
  - `threads` - Conversations (with userId for ownership)
  - `messages` - Chat messages
- **Authentication**: bcryptjs for password hashing, jsonwebtoken for JWT tokens

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including Shadcn
    pages/        # Route pages (HomePage, ThreadPage, WelcomePage, SignupPage, LoginPage)
    hooks/        # Custom React hooks (use-threads, use-auth)
    lib/          # Utilities and query client with JWT support
server/           # Express backend
  routes.ts       # API route handlers (auth + protected threads/messages)
  storage.ts      # Database access layer (MongoDB operations)
  auth.ts         # JWT utilities (sign, verify, hash)
  auth-middleware.ts # JWT verification middleware
  mongodb.ts      # MongoDB connection and schemas (User, Thread, Message)
  replit_integrations/  # AI service integrations
shared/           # Shared types and schemas
  auth-schema.ts  # Zod schemas for auth validation
  routes.ts       # API route type definitions
```

### Build System
- Development: `npm run dev` runs tsx with Vite middleware
- Production: `npm run build` bundles client with Vite and server with esbuild
- Database: MongoDB Atlas (no migrations needed)

## External Dependencies

### AI Services
- **OpenAI API**: Chat completions via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
- **Image Generation**: GPT-image-1 model for image generation endpoints

### Database & Authentication
- **MongoDB Atlas**: External NoSQL database (users, threads, messages collections)
- **JWT**: Stateless authentication with Bearer tokens
- **bcryptjs**: Secure password hashing with salts
- **jsonwebtoken**: JWT generation and verification

### Environment Variables Required
```
MONGODB_URI=mongodb+srv://...     # MongoDB Atlas connection
JWT_SECRET=your_secret_key         # For signing JWT tokens
JWT_EXPIRY=7d                      # Token expiration time
AI_INTEGRATIONS_OPENAI_API_KEY=... # OpenAI API key
AI_INTEGRATIONS_OPENAI_BASE_URL=...# OpenAI base URL
```

### Key npm Packages
- `@tanstack/react-query`: Server state management
- `openai`: OpenAI API client
- `zod`: Schema validation
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT creation/verification
- `bcryptjs`: Password hashing
- Radix UI primitives: Accessible component foundations
- `framer-motion`: Animation library
- `react-markdown`: Markdown rendering
- `react-hook-form`: Form handling with validation