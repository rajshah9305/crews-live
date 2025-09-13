// Shared types and interfaces for the CrewCodeGen application

export interface Tool {
  name: string;
  description: string;
  execute: (...args: any[]) => Promise<any>;
}

export interface Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  tools?: Tool[];
  verbose?: boolean;
  allowDelegation?: boolean;
  systemPrompt?: string;
}

export interface Task {
  id: string;
  description: string;
  expectedOutput: string;
  agent: Agent;
  context?: Task[];
  outputFile?: string;
  asyncExecution?: boolean;
  callback?: (output: string) => void;
  output?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  progress?: number;
}

export interface Crew {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  tasks: Task[];
  manager?: Agent;
  process: 'sequential' | 'hierarchical';
  verbose?: boolean;
  onTaskOutput?: (output: string) => void;
}

export interface GenerationRequest {
  jobId: string;
  requirements: string;
  framework: string;
  language: string;
  timestamp: Date;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  role: string;
  content: string;
  timestamp: Date;
  type: 'system' | 'agent' | 'user';
}

export interface WebSocketEvent {
  type: 'connection_established' | 'generation_started' | 'agent_started' | 'agent_progress' | 'agent_completed' | 'generation_completed' | 'generation_failed' | 'message_added';
  data: any;
  timestamp: string;
  jobId?: string;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface CodeGenerationResult {
  jobId: string;
  files: CodeFile[];
  agents: Array<{
    role: string;
    content: string;
  }>;
  status: 'completed' | 'failed';
  timestamp: Date;
}

export interface SystemMetrics {
  activeJobs: number;
  totalGenerations: number;
  successRate: number;
  averageResponseTime: string;
  cpuUsage: number;
  memoryUsage: number;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  currentAgent?: string;
  startTime: Date;
  estimatedCompletion?: Date;
  tasks: Task[];
}
