# Overview

This is a full-stack web application called "CrewCodeGen" that provides AI-powered code generation using multi-agent workflows. The application leverages Cerebras AI to orchestrate different AI agents (Product Manager, Solution Architect, Senior Developer, QA Engineer) that collaborate to generate complete applications based on user requirements. Users can specify their requirements, choose a framework and programming language, and watch as AI agents work together in real-time to produce structured code files.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with Tailwind CSS for styling using the "new-york" design system
- **State Management**: React Query (TanStack Query) for server state management and local React state for UI state
- **Real-time Communication**: WebSocket connection for live updates from AI agents
- **Design System**: Shadcn/ui component library with custom theming and CSS variables

## Backend Architecture  
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for broadcasting AI agent updates to connected clients
- **AI Integration**: Cerebras Cloud SDK for LLM interactions with fallback simulation mode
- **Agent System**: Multi-agent architecture with specialized AI agents for different development roles
- **API Design**: RESTful endpoints for code generation requests with WebSocket for real-time updates

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for managed database hosting
- **Schema**: User management system with extensible schema design
- **Migrations**: Drizzle Kit for database schema migrations and version control

## Authentication and Authorization
- **Session Management**: Basic user system with username/password authentication
- **Storage**: In-memory storage with plans for database persistence
- **Security**: Helmet.js for security headers and CORS configuration

## External Dependencies
- **AI Provider**: Cerebras Cloud SDK for high-performance language model inference
- **Database Provider**: Neon Database for managed PostgreSQL hosting
- **UI Framework**: Radix UI for accessible component primitives
- **Development Tools**: Vite for frontend tooling, TSX for TypeScript execution
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **Real-time**: Native WebSocket implementation for agent communication updates