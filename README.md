# CrewCodeGen

CrewCodeGen is a full-stack web application that provides AI-powered code generation using multi-agent workflows. The application leverages Cerebras AI to orchestrate different AI agents (Product Manager, Solution Architect, Senior Developer, QA Engineer) that collaborate to generate complete applications based on user requirements. Users can specify their requirements, choose a framework and programming language, and watch as AI agents work together in real-time to produce structured code files.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with Tailwind CSS for styling using the "new-york" design system
- **State Management**: React Query (TanStack Query) for server state management and local React state for UI state
- **Real-time Communication**: WebSocket connection for live updates from AI agents
- **Design System**: Shadcn/ui component library with custom theming and CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for broadcasting AI agent updates to connected clients
- **AI Integration**: Cerebras Cloud SDK for LLM interactions with fallback simulation mode
- **Agent System**: Multi-agent architecture with specialized AI agents for different development roles
- **API Design**: RESTful endpoints for code generation requests with WebSocket for real-time updates

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for managed database hosting
- **Schema**: User management system with extensible schema design
- **Migrations**: Drizzle Kit for database schema migrations and version control

### Authentication and Authorization
- **Session Management**: Basic user system with username/password authentication
- **Storage**: In-memory storage with plans for database persistence
- **Security**: Helmet.js for security headers and CORS configuration

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Cerebras API key

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the root of the project and add your Cerebras API key:
    ```
    CEREBRAS_API_KEY="your_actual_api_key_here"
    ```

### Running the Application

1.  Start the development server:
    ```bash
    npm run dev
    ```

2.  Open your browser and navigate to `http://localhost:5000`.

### Building for Production

1.  Build the application:
    ```bash
    npm run build
    ```

2.  Start the production server:
    ```bash
    npm run start
    ```
