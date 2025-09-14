import { Crew, Task, GenerationRequest, JobStatus, CodeGenerationResult, CodeFile } from "../../shared/types.js";
import { AIAgent, createAgents } from "./agents.js";
import { broadcastToClients } from "./websocket.js";

export class CrewService {
  private activeJobs = new Map<string, JobStatus>();
  private agents: AIAgent[] = [];

  constructor() {
    this.agents = createAgents();
  }

  async startGeneration(request: GenerationRequest): Promise<void> {
    const jobStatus: JobStatus = {
      jobId: request.jobId,
      status: 'in_progress',
      progress: 0,
      startTime: new Date(),
      tasks: this.createTasks(request),
    };

    this.activeJobs.set(request.jobId, jobStatus);

    // Broadcast generation started
    broadcastToClients({
      type: 'generation_started',
      data: { jobId: request.jobId, request },
      timestamp: new Date().toISOString(),
      jobId: request.jobId,
    });

    try {
      await this.executeTasks(request, jobStatus);
      await this.completeGeneration(request.jobId);
    } catch (error) {
      await this.failGeneration(request.jobId, error);
    }
  }

  private createTasks(request: GenerationRequest): Task[] {
    return this.agents.map((agent, index) => ({
      id: `${request.jobId}_task_${index}`,
      description: this.getTaskDescription(agent.role, request),
      expectedOutput: this.getExpectedOutput(agent.role),
      agent,
      status: 'pending',
      progress: 0,
    }));
  }

  private getTaskDescription(role: string, request: GenerationRequest): string {
    const descriptions = {
      'Product Manager': `Analyze the following project requirements and create comprehensive specifications: "${request.requirements}". Framework: ${request.framework}, Language: ${request.language}`,
      'Solution Architect': `Based on the requirements analysis, design a scalable system architecture for a ${request.framework} application using ${request.language}`,
      'Senior Developer': `Implement the system architecture as production-ready code using ${request.framework} and ${request.language}`,
      'QA Engineer': `Create comprehensive test suites and quality assurance documentation for the implemented solution`,
    };
    return descriptions[role] || `Complete task for ${role}`;
  }

  private getExpectedOutput(role: string): string {
    const outputs = {
      'Product Manager': 'Detailed project specification with requirements, user stories, and acceptance criteria',
      'Solution Architect': 'System architecture diagram, technology stack recommendations, and technical blueprint',
      'Senior Developer': 'Complete, production-ready code implementation with proper structure and documentation',
      'QA Engineer': 'Comprehensive test suite, quality metrics, and deployment readiness assessment',
    };
    return outputs[role] || `Output for ${role}`;
  }

  private async executeTasks(request: GenerationRequest, jobStatus: JobStatus): Promise<void> {
    let context = '';
    
    for (let i = 0; i < jobStatus.tasks.length; i++) {
      const task = jobStatus.tasks[i];
      const agent = this.agents.find(a => a.id === task.agent.id);
      
      if (!agent) continue;

      // Update task status
      task.status = 'in_progress';
      task.startTime = new Date();
      jobStatus.currentAgent = agent.role;
      jobStatus.progress = (i / jobStatus.tasks.length) * 100;

      // Broadcast agent started
      broadcastToClients({
        type: 'agent_started',
        data: { 
          jobId: request.jobId, 
          agent: agent.role, 
          task: task.description 
        },
        timestamp: new Date().toISOString(),
        jobId: request.jobId,
      });

      // Execute agent task
      try {
        const output = await agent.execute(task.description, context);
        
        task.output = output;
        task.status = 'completed';
        task.endTime = new Date();
        context += `\n\n${agent.role} Output:\n${output}`;

        // Broadcast agent completed
        broadcastToClients({
          type: 'agent_completed',
          data: { 
            jobId: request.jobId, 
            agent: agent.role, 
            output,
            duration: task.endTime.getTime() - (task.startTime?.getTime() || 0)
          },
          timestamp: new Date().toISOString(),
          jobId: request.jobId,
        });

        // Simulate progress updates
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          broadcastToClients({
            type: 'agent_progress',
            data: { 
              jobId: request.jobId, 
              agent: agent.role, 
              progress 
            },
            timestamp: new Date().toISOString(),
            jobId: request.jobId,
          });
        }

      } catch (error) {
        task.status = 'failed';
        task.endTime = new Date();
        throw error;
      }
    }
  }

  private async completeGeneration(jobId: string): Promise<void> {
    const jobStatus = this.activeJobs.get(jobId);
    if (!jobStatus) return;

    jobStatus.status = 'completed';
    jobStatus.progress = 100;

    const result: CodeGenerationResult = {
      jobId,
      files: this.generateCodeFiles(jobStatus),
      agents: jobStatus.tasks.map(task => ({
        role: task.agent.role,
        content: task.output || '',
      })),
      status: 'completed',
      timestamp: new Date(),
    };

    broadcastToClients({
      type: 'generation_completed',
      data: result,
      timestamp: new Date().toISOString(),
      jobId,
    });

    // Keep job in memory for a while before cleanup
    setTimeout(() => {
      this.activeJobs.delete(jobId);
    }, 300000); // 5 minutes
  }

  private async failGeneration(jobId: string, error: any): Promise<void> {
    const jobStatus = this.activeJobs.get(jobId);
    if (!jobStatus) return;

    jobStatus.status = 'failed';

    broadcastToClients({
      type: 'generation_failed',
      data: { 
        jobId, 
        error: error.message || 'Generation failed',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      jobId,
    });
  }

  private generateCodeFiles(jobStatus: JobStatus): CodeFile[] {
    const seniorDeveloperTask = jobStatus.tasks.find(
      (task) => task.agent.role === 'Senior Developer'
    );

    if (!seniorDeveloperTask || !seniorDeveloperTask.output) {
      return [];
    }

    const files: CodeFile[] = [];
    const codeBlockRegex = /```(\w+)\s*([\s\S]*?)```/g;
    const lines = seniorDeveloperTask.output.split('\n');
    let match;
    let fileIndex = 0;

    while ((match = codeBlockRegex.exec(seniorDeveloperTask.output)) !== null) {
      const language = match[1];
      const content = match[2].trim();

      // Try to find a file path in the lines preceding the code block
      const codeBlockStartIndex = seniorDeveloperTask.output.indexOf(match[0]);
      const precedingText = seniorDeveloperTask.output.substring(0, codeBlockStartIndex);
      const precedingLines = precedingText.split('\n').slice(-5); // Look in the last 5 lines

      const pathLine = precedingLines.reverse().find(line =>
        line.includes('/') || line.includes('.')
      );

      let path = `generated_file_${fileIndex++}.${language}`;
      if (pathLine) {
        const extractedPath = pathLine.match(/([a-zA-Z0-9_./-]+)/);
        if (extractedPath) {
          path = extractedPath[0];
        }
      }

      files.push({
        path,
        language,
        content,
      });
    }

    return files;
  }

  getJobStatus(jobId: string): JobStatus | undefined {
    return this.activeJobs.get(jobId);
  }

  getAllActiveJobs(): JobStatus[] {
    return Array.from(this.activeJobs.values());
  }

  getSystemMetrics() {
    const activeJobs = this.activeJobs.size;
    const allJobs = Array.from(this.activeJobs.values());
    const completedJobs = allJobs.filter(job => job.status === 'completed');
    const totalCompleted = completedJobs.length;

    const successRate = totalCompleted > 0
      ? (completedJobs.filter(job => job.status === 'completed').length / totalCompleted) * 100
      : 100;

    const averageResponseTime = totalCompleted > 0
      ? completedJobs.reduce((acc, job) => {
          if (job.startTime && job.endTime) {
            return acc + (job.endTime.getTime() - job.startTime.getTime());
          }
          return acc;
        }, 0) / totalCompleted
      : 0;

    const memoryUsage = process.memoryUsage();
    
    return {
      activeJobs,
      totalGenerations: allJobs.length,
      successRate: parseFloat(successRate.toFixed(1)),
      averageResponseTime: `${Math.round(averageResponseTime)}ms`,
      cpuUsage: 0, // Placeholder, as cpuUsage is more complex to calculate
      memoryUsage: Math.round(memoryUsage.rss / 1024 / 1024), // in MB
    };
  }
}

export const crewService = new CrewService();
