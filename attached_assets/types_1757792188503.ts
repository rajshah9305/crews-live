// shared/types.ts
// Shared types and interfaces for the CrewCodeGen application

export interface Tool {
  name: string;
  description: string;
  execute: (...args: any[]) => Promise<any>;
}

export interface Agent {
  id: string;             // Unique identifier for the agent (e.g., 'product_manager', 'developer')
  role: string;           // Human-readable role (e.g., 'Product Manager', 'Senior Developer')
  goal: string;           // The primary objective of the agent
  backstory: string;      // A brief narrative describing the agent's expertise and context
  llm?: any;              // The LLM instance (e.g., Cerebras client) the agent uses
  tools?: Tool[];         // Optional list of tools the agent can use
  verbose?: boolean;      // Whether the agent's internal thoughts/actions should be logged
  allowDelegation?: boolean; // Whether this agent can delegate tasks to other agents
  systemPrompt?: string;  // System prompt for the agent
}

export interface Task {
  id: string;             // Unique identifier for the task
  description: string;    // Detailed description of what the task entails
  expectedOutput: string; // What is expected as the output of this task
  agent: Agent;           // The agent responsible for executing this task
  context?: Task[];       // Optional: an array of previous tasks whose outputs serve as context
  outputFile?: string;    // Optional: path to a file where the task's output should be saved
  asyncExecution?: boolean; // Optional: if true, task can run asynchronously (default: false)
  callback?: (output: string) => void; // Optional: callback function to handle task output
  output?: string;        // The actual output of the task after execution
}

export interface Crew {
  id: string;             // Unique identifier for the crew
  name: string;           // Human-readable name for the crew
  description: string;    // Description of the crew's overall purpose
  agents: Agent[];        // List of agents participating in this crew
  tasks: Task[];          // List of tasks to be executed by the crew
  manager?: Agent;        // Optional: a dedicated manager agent for complex orchestrations
  process: 'sequential' | 'hierarchical'; // How tasks are processed (sequential or hierarchical)
  verbose?: boolean;      // Whether the crew's overall progress should be logged
  onTaskOutput?: (output: string) => void; // Callback for real-time task output streaming
}

export interface GenerationRequest {
  jobId: string;
  requirements: string;
  framework: string;
  language: string;
}

export interface AgentResponse {
  agentId: string;
  role: string;
  content: string;
  timestamp: Date;
}

export interface SocketEvent {
  type: 'generation_started' | 'agent_started' | 'agent_completed' | 'generation_completed' | 'generation_failed';
  data: any;
  timestamp: string;
}

export interface CodeGenerationResult {
  jobId: string;
  code: Record<string, string>;
  agents: Array<{
    role: string;
    content: string;
  }>;
}

