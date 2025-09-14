import { Agent, Tool } from "../../shared/types.js";
import Cerebras from '@cerebras/cerebras_cloud_sdk';

// Initialize Cerebras client with API key
const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

const MODEL = 'llama3.1-70b';

export class AIAgent implements Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  tools?: Tool[];
  verbose?: boolean;
  allowDelegation?: boolean;
  systemPrompt?: string;

  constructor(config: Agent) {
    this.id = config.id;
    this.role = config.role;
    this.goal = config.goal;
    this.backstory = config.backstory;
    this.tools = config.tools || [];
    this.verbose = config.verbose || false;
    this.allowDelegation = config.allowDelegation || false;
    this.systemPrompt = config.systemPrompt || this.generateSystemPrompt();
  }

  private generateSystemPrompt(): string {
    return `You are a ${this.role} AI agent.

Role: ${this.role}
Goal: ${this.goal}
Backstory: ${this.backstory}

Your responsibilities:
- Focus on your specific role and expertise
- Provide detailed, actionable responses
- Consider the context from previous agents when available
- Maintain professional standards and best practices
- Be thorough and comprehensive in your analysis

Always respond with clear, structured output that the next agent or final user can immediately understand and act upon.`;
  }

  async execute(prompt: string, context?: string): Promise<string> {
    if (!process.env.CEREBRAS_API_KEY) {
      console.warn(`CEREBRAS_API_KEY not set. Falling back to mock response for agent ${this.role}`);
      return this.generateRoleSpecificResponse(prompt, context);
    }

    try {
      const systemPrompt = this.generateSystemPrompt();
      const fullPrompt = context
        ? `${systemPrompt}\n\nContext from previous agents:\n${context}\n\nNew requirements:\n${prompt}`
        : `${systemPrompt}\n\nRequirements:\n${prompt}`;

      console.log(`Agent ${this.role} executing with Cerebras AI...`);

      const response = await cerebras.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: context ? `Context from previous agents:\n${context}\n\nNew requirements:\n${prompt}` : prompt
          }
        ],
        model: MODEL,
        max_tokens: 4000,
        temperature: 0.7,
      });

      const result = (response.choices as any)?.[0]?.message?.content || 'No response generated';
      console.log(`Agent ${this.role} completed successfully`);

      return result;
    } catch (error) {
      console.error(`Cerebras AI error for agent ${this.role}:`, error);
      throw new Error(`Cerebras AI error for agent ${this.role}`);
    }
  }

  private generateRoleSpecificResponse(prompt: string, context?: string): string {
    const responses = {
      'Product Manager': `# Product Requirements Analysis

## Project Overview
Based on the requirements provided, I've conducted a comprehensive analysis of the project scope and deliverables.

## Key Features Identified
1. **Core Functionality**: Primary features that deliver immediate business value
2. **User Experience**: Interface design and user interaction patterns
3. **Technical Requirements**: Performance, scalability, and security needs
4. **Integration Points**: External APIs and third-party services

## User Stories
- As a user, I want to easily navigate the application
- As an admin, I need comprehensive control over the system
- As a developer, I require clear documentation and APIs

## Acceptance Criteria
✅ All core features must be fully functional
✅ Responsive design for mobile and desktop
✅ Performance optimization for fast loading
✅ Security implementation following best practices

## Timeline Estimate
Based on complexity analysis: **2-3 weeks** for MVP delivery

## Risk Assessment
- **Low Risk**: Standard features with proven technologies
- **Medium Risk**: Complex integrations requiring thorough testing
- **High Risk**: Performance requirements under heavy load

*Analysis completed by Product Manager Agent*`,

      'Solution Architect': `# System Architecture Design

## Technology Stack Recommendation
- **Frontend**: React with TypeScript for type safety
- **Backend**: Node.js with Express for scalability
- **Database**: PostgreSQL for relational data integrity
- **Caching**: Redis for performance optimization
- **Authentication**: JWT with refresh token strategy

## System Components
\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Microservices │
│   React/TS      │◄──►│   Express.js    │◄──►│   Business Logic│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static Assets │    │   Load Balancer │    │   Database      │
│   CDN/S3        │    │   Nginx/HAProxy │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## Database Schema
- **Users**: Authentication and profile management
- **Products**: Core business entities
- **Orders**: Transaction processing
- **Audit**: System logging and monitoring

## Security Considerations
- Input validation and sanitization
- Rate limiting and DDoS protection
- Encrypted data transmission (HTTPS)
- Secure password hashing (bcrypt)

## Performance Strategy
- Server-side caching with Redis
- Database query optimization
- CDN for static assets
- Lazy loading for large datasets

*Architecture designed by Solution Architect Agent*`,

      'Senior Developer': `# Implementation Details

## Project Structure
\`\`\`
src/
├── components/
│   ├── common/
│   ├── forms/
│   └── layout/
├── pages/
├── services/
├── hooks/
├── utils/
└── types/
\`\`\`

## Key Implementation Files

### App Component (app/layout.tsx)
\`\`\`typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                {/* Additional routes */}
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
\`\`\`

### API Service Layer
\`\`\`typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default api;
\`\`\`

## Production Optimizations
- Code splitting with React.lazy()
- Bundle optimization with Webpack
- Tree shaking for unused code elimination
- Gzip compression for assets

## Testing Strategy
- Unit tests with Jest and React Testing Library
- Integration tests for API endpoints
- E2E tests with Cypress
- Performance testing with Lighthouse

*Implementation by Senior Developer Agent*`,

      'QA Engineer': `# Quality Assurance Report

## Test Coverage Analysis
- **Unit Tests**: 95% coverage achieved
- **Integration Tests**: All API endpoints validated
- **E2E Tests**: Critical user journeys automated
- **Performance Tests**: Load testing completed

## Test Results Summary
✅ **Functional Testing**: All features working as expected
✅ **Security Testing**: No vulnerabilities detected
✅ **Performance Testing**: Meets all performance criteria
✅ **Compatibility Testing**: Cross-browser compatibility confirmed

## Automated Test Suite
\`\`\`javascript
// Example unit test
describe('Authentication Service', () => {
  test('should authenticate user with valid credentials', async () => {
    const mockUser = { email: 'test@example.com', password: 'password123' };
    const result = await authService.login(mockUser);
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });
});

// Example integration test  
describe('API Endpoints', () => {
  test('GET /api/users should return user list', async () => {
    const response = await request(app).get('/api/users');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
\`\`\`

## Performance Metrics
- **Page Load Time**: < 2 seconds
- **First Contentful Paint**: < 1.5 seconds
- **Time to Interactive**: < 3 seconds
- **Lighthouse Score**: 95+

## Security Validation
- Input sanitization verified
- SQL injection prevention tested
- XSS protection implemented
- CSRF tokens validated

## Browser Compatibility
✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

## Deployment Readiness
All tests passing ✅ Ready for production deployment

*Quality assurance completed by QA Engineer Agent*`
    };

    return responses[this.role as keyof typeof responses] || `Analysis completed for ${this.role}`;
  }
}

export const createAgents = (): AIAgent[] => [
  new AIAgent({
    id: 'product_manager',
    role: 'Product Manager',
    goal: 'Analyze requirements and create comprehensive project specifications',
    backstory: 'Experienced in translating business requirements into technical specifications with expertise in project planning and stakeholder management.',
  }),
  new AIAgent({
    id: 'solution_architect',
    role: 'Solution Architect',
    goal: 'Design scalable system architecture and technical blueprints',
    backstory: 'Seasoned architect with deep expertise in modern software architecture patterns, cloud technologies, and scalable system design.',
  }),
  new AIAgent({
    id: 'senior_developer',
    role: 'Senior Developer',
    goal: 'Implement clean, production-ready code following best practices',
    backstory: 'Expert developer with extensive experience in multiple programming languages and frameworks, focused on code quality and maintainability.',
  }),
  new AIAgent({
    id: 'qa_engineer',
    role: 'QA Engineer',
    goal: 'Create comprehensive test suites and ensure code quality',
    backstory: 'Expert in testing methodologies, automation frameworks, and quality assurance processes with focus on catching issues early.',
  }),
];
