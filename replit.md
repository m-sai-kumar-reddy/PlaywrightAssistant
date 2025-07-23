# E2E Testing Platform with Playwright

## Overview

This is a full-stack web application for creating, managing, and executing end-to-end tests using Playwright. The platform provides a user-friendly interface for defining test scenarios through JSON configuration and automatically generates Playwright test code. It features real-time execution monitoring, manual intervention handling, and project management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server responsibilities:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket server for live execution updates
- **Test Execution**: Custom Playwright executor service

## Key Components

### Database Layer
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema**: Shared schema definitions in `/shared/schema.ts`
- **Tables**: Users, Projects, and Execution Sessions
- **Migration Strategy**: Drizzle Kit for schema migrations

### Project Management
- JSON-based test scenario definitions
- Automatic Playwright code generation
- Project versioning with last modified timestamps
- Base URL configuration for test environments

### Test Execution Engine
- Real-time execution status tracking
- Manual intervention support for human verification challenges
- Step-by-step progress monitoring
- WebSocket-based live updates to the frontend

### UI Components
- Comprehensive shadcn/ui component library integration
- Custom execution logger component
- Verification modal for manual interventions
- Theme provider with light/dark mode support
- Responsive design with mobile considerations

## Data Flow

1. **Project Creation**: Users create projects with base URLs and JSON test definitions
2. **Code Generation**: The system automatically generates Playwright test code from JSON scenarios
3. **Test Execution**: Users initiate test runs through the web interface
4. **Real-time Updates**: WebSocket connection provides live execution status and logs
5. **Manual Intervention**: System pauses for human verification when needed
6. **Results Storage**: Execution sessions and logs are persisted in the database

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@playwright/test**: Browser automation and testing
- **ws**: WebSocket server implementation
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling
- **PostCSS**: CSS processing

### Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Development tooling integration

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with hot module replacement
- Express server with TypeScript compilation via `tsx`
- WebSocket server integrated with HTTP server
- Environment variable based configuration

### Production Build
- Frontend built to static assets via Vite
- Backend bundled with esbuild for Node.js deployment
- Single server deployment serving both API and static files
- Database migrations managed through Drizzle Kit

### Environment Configuration
- Database URL required via `DATABASE_URL` environment variable
- Development/production mode detection
- Replit-specific development features when `REPL_ID` is present

The application is designed as a monorepo with shared TypeScript definitions, making it easy to maintain type safety across the full stack while providing a seamless development experience.