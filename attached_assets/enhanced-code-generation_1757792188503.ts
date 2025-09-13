// server/src/services/enhanced-code-generation.ts
import { Cerebras } from "@cerebras/cerebras_cloud_sdk";
import { EventEmitter } from "events";
import { GenerationRequest, CodeGenerationResult } from "../../../shared/types.js";
import { createCodeGenerationAgents } from "../agents/index.js";
import { createCodeGenerationTasks } from "../tasks/index.js";
import { createCodeGenerationCrew } from "../crews/index.js";
import { 
  validateGenerationRequest, 
  sanitizeInput, 
  estimateGenerationTime,
  compileCodeFiles,
  logWithTimestamp,
  createErrorResponse,
  createSuccessResponse
} from "../utils/index.js";

export class EnhancedCodeGenerationService extends EventEmitter {
  private cerebras: Cerebras | null = null;
  private activeJobs: Map<string, any> = new Map();

  constructor() {
    super();
    
    // Initialize Cerebras client
    if (process.env.CEREBRAS_API_KEY) {
      this.cerebras = new Cerebras({
        apiKey: process.env.CEREBRAS_API_KEY,
      });
      logWithTimestamp('info', "✅ Cerebras client initialized");
    } else {
      logWithTimestamp('warn', "⚠️ CEREBRAS_API_KEY not found - using simulation mode");
    }
  }

  async startGeneration(request: GenerationRequest): Promise<void> {
    const { jobId } = request;
    
    try {
      // Validate request
      const validationErrors = validateGenerationRequest(request);
      if (validationErrors.length > 0) {
        this.emit("generation_failed", {
          jobId,
          error: `Validation failed: ${validationErrors.join(', ')}`
        });
        return;
      }

      // Sanitize inputs
      const sanitizedRequest: GenerationRequest = {
        ...request,
        requirements: sanitizeInput(request.requirements),
        framework: sanitizeInput(request.framework),
        language: sanitizeInput(request.language)
      };

      // Store job info
      this.activeJobs.set(jobId, {
        request: sanitizedRequest,
        startTime: new Date(),
        status: 'running'
      });

      // Estimate completion time
      const estimatedTime = estimateGenerationTime(
        sanitizedRequest.requirements,
        sanitizedRequest.framework,
        sanitizedRequest.language
      );

      // Emit generation started event
      this.emit("generation_started", {
        jobId,
        estimatedTime,
        agentCount: 4,
        request: sanitizedRequest
      });

      logWithTimestamp('info', `🚀 Starting code generation for job: ${jobId}`);

      // Create agents
      const agents = createCodeGenerationAgents(this.cerebras || undefined);
      logWithTimestamp('info', `👥 Created ${agents.length} agents`);

      // Create task output callback
      const onTaskOutput = (taskId: string, agentRole: string, output: string) => {
        this.emit("agent_completed", {
          jobId,
          taskId,
          agentId: taskId,
          role: agentRole,
          content: output,
          timestamp: new Date().toISOString()
        });
      };

      // Create tasks
      const tasks = createCodeGenerationTasks(agents, sanitizedRequest, onTaskOutput);
      logWithTimestamp('info', `📝 Created ${tasks.length} tasks`);

      // Create crew
      const crew = createCodeGenerationCrew(agents, tasks, (output) => {
        // This callback is called for each task completion
        logWithTimestamp('info', `📤 Task output received (${output.length} characters)`);
      });

      // Execute crew workflow
      logWithTimestamp('info', `🔄 Starting crew execution`);
      const crewResults = await crew.kickoff();

      if (crewResults.success) {
        // Compile final code files
        const agentOutputs = crew.getResults()
          .filter(result => result.output)
          .map(result => ({
            role: result.agentRole,
            content: result.output!
          }));

        const compiledCode = compileCodeFiles(agentOutputs, sanitizedRequest);

        // Update job status
        const jobInfo = this.activeJobs.get(jobId);
        if (jobInfo) {
          jobInfo.status = 'completed';
          jobInfo.endTime = new Date();
          jobInfo.duration = jobInfo.endTime.getTime() - jobInfo.startTime.getTime();
        }

        // Emit completion event
        this.emit("generation_completed", {
          jobId,
          code: compiledCode,
          agents: agentOutputs,
          duration: jobInfo?.duration || 0,
          timestamp: new Date().toISOString()
        });

        logWithTimestamp('info', `✅ Code generation completed for job: ${jobId}`);
      } else {
        throw new Error(crewResults.error || 'Crew execution failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update job status
      const jobInfo = this.activeJobs.get(jobId);
      if (jobInfo) {
        jobInfo.status = 'failed';
        jobInfo.error = errorMessage;
        jobInfo.endTime = new Date();
      }

      logWithTimestamp('error', `❌ Code generation failed for job: ${jobId}`, error);
      
      this.emit("generation_failed", {
        jobId,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      // Clean up job after some time
      setTimeout(() => {
        this.activeJobs.delete(jobId);
      }, 300000); // 5 minutes
    }
  }

  // Get job status
  getJobStatus(jobId: string): any {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      return createErrorResponse('Job not found');
    }

    return createSuccessResponse({
      jobId,
      status: job.status,
      startTime: job.startTime,
      endTime: job.endTime,
      duration: job.duration,
      error: job.error
    });
  }

  // Get all active jobs
  getActiveJobs(): any {
    const jobs = Array.from(this.activeJobs.entries()).map(([jobId, job]) => ({
      jobId,
      status: job.status,
      startTime: job.startTime,
      framework: job.request.framework,
      language: job.request.language
    }));

    return createSuccessResponse(jobs);
  }

  // Cancel a job
  cancelJob(jobId: string): any {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      return createErrorResponse('Job not found');
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return createErrorResponse('Job already finished');
    }

    job.status = 'cancelled';
    job.endTime = new Date();

    this.emit("generation_failed", {
      jobId,
      error: 'Job cancelled by user',
      timestamp: new Date().toISOString()
    });

    logWithTimestamp('info', `🛑 Job cancelled: ${jobId}`);
    
    return createSuccessResponse({ jobId, status: 'cancelled' });
  }

  // Get service statistics
  getStatistics(): any {
    const totalJobs = this.activeJobs.size;
    const runningJobs = Array.from(this.activeJobs.values()).filter(job => job.status === 'running').length;
    const completedJobs = Array.from(this.activeJobs.values()).filter(job => job.status === 'completed').length;
    const failedJobs = Array.from(this.activeJobs.values()).filter(job => job.status === 'failed').length;

    return createSuccessResponse({
      totalJobs,
      runningJobs,
      completedJobs,
      failedJobs,
      cerebrasEnabled: !!this.cerebras,
      uptime: process.uptime()
    });
  }
}

// Create singleton instance
export const enhancedCodeGenerationService = new EnhancedCodeGenerationService();

