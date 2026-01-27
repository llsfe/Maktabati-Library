# Maktabati (مكتبتي) - Arabic PDF Library Organizer

## Overview

Maktabati is a digital library management application designed for Arabic-speaking users to organize and track their PDF book collection. The application provides a clean, RTL-friendly interface for cataloging books by reading status (reading, completed, planned), searching, filtering by category, and managing book metadata. Built as a full-stack TypeScript application with a React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives
- **Animations**: Framer Motion for smooth page transitions and card interactions
- **Typography**: Cairo font for Arabic text support with RTL layout

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components including shadcn/ui
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utilities and query client
│       └── pages/        # Route page components
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod
└── migrations/       # Drizzle database migrations
```

### Key Design Patterns
- **Shared Schema**: Database schema and Zod validation schemas defined once in `shared/` and used by both frontend and backend
- **Type-safe API**: Route definitions include input/output schemas for compile-time type checking
- **Storage Interface**: `IStorage` interface abstracts database operations for testability
- **Component Composition**: shadcn/ui pattern of composable, customizable components

### Build System
- **Development**: Vite dev server with HMR, proxying API requests to Express
- **Production**: esbuild bundles the server, Vite builds the client to `dist/public`
- **Database**: `npm run db:push` uses Drizzle Kit to sync schema to database

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, requires `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and query building
- **connect-pg-simple**: Session storage (if authentication is added)

### Frontend Libraries
- **@tanstack/react-query**: Data fetching and caching
- **@radix-ui/***: Accessible UI primitives (dialog, dropdown, tabs, etc.)
- **framer-motion**: Animation library
- **react-hook-form** + **@hookform/resolvers**: Form handling with Zod validation
- **wouter**: Minimal React router
- **date-fns**: Date formatting utilities

### Development Tools
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **drizzle-kit**: Database migration tooling
- **TypeScript**: Full-stack type safety

### Replit-specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator