import CodeDisplay from "@/components/CodeDisplay";
import RequirementsInput from "@/components/RequirementsInput";
import SystemMetrics from "@/components/SystemMetrics";
import EnhancedWorkflowVisualizer from "@/components/EnhancedWorkflowVisualizer";
import EnhancedAgentConversationLog from "@/components/EnhancedAgentConversationLog";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedWebSocket } from "@/hooks/useEnhancedWebSocket";
import {
  Bot,
  Code2,
  Eye,
  MessageSquare,
  Monitor,
  Play,
  Settings,
  Smartphone,
  Sparkles,
  Tablet,
  Zap,
  Brain,
  Activity,
  Network,
  Cpu,
  Database,
  Shield,
  Rocket
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";

interface WorkflowTask {
  id: string;
  taskName: string;
  agentType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  createdAt?: string;
  updatedAt?: string;
  output?: string;
  duration?: number;
}

interface AgentMessage {
  id: string;
  agentType: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'error';
  taskId?: string;
  content?: string;
}

interface CodeGenerationJob {
  id: string;
  title: string;
  requirements: string;
  framework: string;
  language: string;
  status: string;
  progress: number;
  generatedCode: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export default function EnhancedHome() {
  const { toast } = useToast();
  const [currentJob, setCurrentJob] = useState<CodeGenerationJob | null>(null);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [generatedCode, setGeneratedCode] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>("main.py");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "code" | "preview">("chat");
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showAgents, setShowAgents] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  // Enhanced WebSocket handlers
  const handleGenerationStarted = useCallback((data: any) => {
    console.log('Generation started:', data);
    setIsGenerating(true);
    setEstimatedTime(data.estimatedTime || 60);
    
    // Initialize tasks based on agent count
    const agentTypes = ['product_manager', 'solution_architect', 'senior_developer', 'qa_engineer'];
    const initialTasks: WorkflowTask[] = agentTypes.map((agentType, index) => ({
      id: `task_${index + 1}`,
      taskName: getTaskName(agentType),
      agentType,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    setTasks(initialTasks);
    
    toast({
      title: "🚀 Generation Started",
      description: `AI agents are collaborating to build your ${data.request?.framework} application`,
    });
  }, [toast]);

  const handleAgentStarted = useCallback((data: any) => {
    console.log('Agent started:', data);
    
    // Update task status
    setTasks(prev => prev.map(task => 
      task.agentType === data.agentId || task.id === data.taskId
        ? { ...task, status: 'in_progress', progress: 0 }
        : task
    ));

    // Add message
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      agentType: data.agentId || 'system',
      message: `${data.role} has started working on the project`,
      timestamp: new Date(),
      type: 'info',
      taskId: data.taskId
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const handleAgentCompleted = useCallback((data: any) => {
    console.log('Agent completed:', data);
    
    // Update task status
    setTasks(prev => prev.map(task => 
      task.agentType === data.agentId || task.id === data.taskId
        ? { 
            ...task, 
            status: 'completed', 
            progress: 100,
            output: data.content,
            updatedAt: new Date().toISOString()
          }
        : task
    ));

    // Add message
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      agentType: data.agentId || 'system',
      message: `${data.role} has completed their task`,
      timestamp: new Date(),
      type: 'success',
      taskId: data.taskId,
      content: data.content
    };
    setMessages(prev => [...prev, message]);

    toast({
      title: `✅ ${data.role} Completed`,
      description: "Task finished successfully",
    });
  }, [toast]);

  const handleGenerationCompleted = useCallback((data: any) => {
    console.log('Generation completed:', data);
    setIsGenerating(false);
    
    // Update all tasks to completed
    setTasks(prev => prev.map(task => ({ 
      ...task, 
      status: 'completed', 
      progress: 100,
      updatedAt: new Date().toISOString()
    })));

    // Set generated code
    if (data.code) {
      setGeneratedCode(data.code);
      const files = Object.keys(data.code);
      if (files.length > 0) {
        setActiveFile(files[0]);
      }
    }

    // Add completion message
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      agentType: 'system',
      message: `🎉 Code generation completed successfully! Generated ${Object.keys(data.code || {}).length} files.`,
      timestamp: new Date(),
      type: 'success'
    };
    setMessages(prev => [...prev, message]);

    toast({
      title: "🎉 Generation Complete!",
      description: `Your ${currentJob?.framework} application is ready!`,
    });
  }, [currentJob]);

  const handleGenerationFailed = useCallback((data: any) => {
    console.log('Generation failed:', data);
    setIsGenerating(false);
    
    // Update tasks to failed
    setTasks(prev => prev.map(task => ({ 
      ...task, 
      status: 'failed',
      updatedAt: new Date().toISOString()
    })));

    // Add error message
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      agentType: 'system',
      message: `❌ Generation failed: ${data.error}`,
      timestamp: new Date(),
      type: 'error'
    };
    setMessages(prev => [...prev, message]);

    toast({
      title: "❌ Generation Failed",
      description: data.error || "An error occurred during code generation",
      variant: "destructive",
    });
  }, [toast]);

  const onConnect = useCallback(() => {
    toast({
      title: "🔗 Connected",
      description: "Real-time connection established",
    });
  }, [toast]);

  const onDisconnect = useCallback(() => {
    toast({
      title: "⚠️ Disconnected",
      description: "Connection lost. Attempting to reconnect...",
      variant: "destructive",
    });
  }, [toast]);

  // Enhanced WebSocket connection
  const { connectionStatus, isConnected, clientId } = useEnhancedWebSocket({
    onGenerationStarted: handleGenerationStarted,
    onAgentStarted: handleAgentStarted,
    onAgentCompleted: handleAgentCompleted,
    onGenerationCompleted: handleGenerationCompleted,
    onGenerationFailed: handleGenerationFailed,
    onConnect,
    onDisconnect
  });

  const getTaskName = (agentType: string): string => {
    const taskNames: Record<string, string> = {
      product_manager: "Requirements Analysis",
      solution_architect: "System Architecture",
      senior_developer: "Code Implementation", 
      qa_engineer: "Quality Assurance"
    };
    return taskNames[agentType] || agentType.replace('_', ' ');
  };

  const handleStartGeneration = async (
    requirements: string,
    framework: string,
    language: string
  ) => {
    try {
      setIsGenerating(true);
      setTasks([]);
      setMessages([]);
      setGeneratedCode({});

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirements,
          framework,
          language,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Create job for UI
        setCurrentJob({
          id: result.jobId,
          title: `${framework} ${language} Application`,
          requirements,
          framework,
          language,
          status: "running",
          progress: 0,
          generatedCode: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        toast({
          title: "🚀 Generation Started",
          description: "AI agents are beginning collaboration...",
        });
      } else {
        throw new Error(result.error || "Failed to start generation");
      }
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to start code generation",
        variant: "destructive",
      });
    }
  };

  const clearMessages = () => {
    setMessages([]);
    toast({
      title: "🧹 Messages Cleared",
      description: "Conversation log has been cleared",
    });
  };

  const overallProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
    : 0;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-foreground ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Elite Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Brain className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    CrewCodeGen Elite
                  </h1>
                  <p className="text-sm text-purple-300/70">
                    Multi-Agent AI Development Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border backdrop-blur-sm ${
                isConnected
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>

              {/* AI Status */}
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isGenerating ? "Generating" : "AI Ready"}
                </span>
              </div>

              {/* Client ID */}
              {clientId && (
                <div className="text-xs text-white/50 font-mono bg-black/20 px-2 py-1 rounded">
                  ID: {clientId.slice(-8)}
                </div>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Requirements Input */}
        <div className="mb-8">
          <RequirementsInput
            onStartGeneration={handleStartGeneration}
            isGenerating={isGenerating}
          />
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Enhanced Workflow */}
          <div className="lg:col-span-1 xl:col-span-1">
            <EnhancedWorkflowVisualizer
              tasks={tasks}
              overallProgress={overallProgress}
              isGenerating={isGenerating}
              estimatedTime={estimatedTime}
              currentJobId={currentJob?.id}
            />
          </div>

          {/* Center Panel - Enhanced Chat & Code */}
          <div className="lg:col-span-1 xl:col-span-2 space-y-6">
            {/* View Toggle */}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-black/20 backdrop-blur-xl rounded-xl p-1 sm:p-2 border border-white/10 overflow-x-auto">
              <button
                onClick={() => setActiveView("chat")}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
                  activeView === "chat"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-white/60 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Agents</span>
              </button>
              <button
                onClick={() => setActiveView("code")}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
                  activeView === "code"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-white/60 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span className="hidden sm:inline">Code</span>
              </button>
              <button
                onClick={() => setActiveView("preview")}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
                  activeView === "preview"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-white/60 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>

            {/* Dynamic Content Area */}
            <div className="h-full">
              {activeView === "chat" && (
                <EnhancedAgentConversationLog
                  messages={messages}
                  isGenerating={isGenerating}
                  onClearMessages={clearMessages}
                />
              )}
              {activeView === "code" && (
                <CodeDisplay
                  generatedCode={generatedCode}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                />
              )}
              {activeView === "preview" && (
                <div className="h-full bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <div className="text-center py-12 text-white/60">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <p className="text-lg font-medium mb-2">Live Preview</p>
                    <p className="text-sm">Preview will be available once code generation is complete</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - System Metrics */}
          <div className="lg:col-span-1 xl:col-span-1">
            <SystemMetrics />
          </div>
        </div>
      </div>
    </div>
  );
}

