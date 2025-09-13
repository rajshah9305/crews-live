import AgentConversationLog from "@/components/AgentConversationLog";
import CodeDisplay from "@/components/CodeDisplay";
import RequirementsInput from "@/components/RequirementsInput";
import SystemMetrics from "@/components/SystemMetrics";
import WorkflowVisualizer from "@/components/WorkflowVisualizer";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import type {
  AgentMessage,
  CodeGenerationJob,
  WebSocketMessage,
  WorkflowTask,
} from "@shared/schema";
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
} from "lucide-react";
import { useCallback, useState } from "react";

export default function Home() {
  const { toast } = useToast();
  const [currentJob, setCurrentJob] = useState<CodeGenerationJob | null>(null);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [generatedCode, setGeneratedCode] = useState<Record<string, string>>(
    {}
  );
  const [activeFile, setActiveFile] = useState<string>("main.py");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "code" | "preview">(
    "chat"
  );
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [showAgents, setShowAgents] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case "task_update":
          setTasks(prev =>
            prev.map(task =>
              task.id === message.data.taskId
                ? {
                    ...task,
                    status: message.data.status,
                    progress: message.data.progress,
                  }
                : task
            )
          );
          break;

        case "agent_message":
          setMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}`,
              jobId: currentJob?.id || "",
              taskId: null,
              agentType: message.data.agentType,
              messageType: message.data.messageType || "info",
              message: message.data.message,
              metadata: message.data.metadata || null,
              isInternal: false,
              timestamp: new Date(message.data.timestamp),
            },
          ]);
          break;

        case "job_status":
          if (currentJob && currentJob.id === message.data.jobId) {
            setCurrentJob((prev: any) =>
              prev
                ? {
                    ...prev,
                    status: message.data.status,
                    progress: message.data.progress,
                  }
                : null
            );

            if (message.data.status === "completed") {
              setIsGenerating(false);
              toast({
                title: "Generation Complete",
                description: "Your code has been successfully generated!",
              });
            } else if (message.data.status === "failed") {
              setIsGenerating(false);
              toast({
                title: "Generation Failed",
                description: "There was an error generating your code.",
                variant: "destructive",
              });
            }
          }
          break;

        case "code_update":
          setGeneratedCode(prev => ({
            ...prev,
            [message.data.filename]: message.data.content,
          }));
          if (!activeFile || !generatedCode[activeFile]) {
            setActiveFile(message.data.filename);
          }
          break;

        case "connection_status":
          console.log("Connection status:", message.data);
          break;
      }
    },
    [currentJob, activeFile, generatedCode, toast]
  );

  const onConnect = useCallback(() => {
    toast({
      title: "Connected",
      description: "WebSocket connection established",
    });
  }, [toast]);

  const onDisconnect = useCallback(() => {
    toast({
      title: "Disconnected",
      description: "WebSocket connection lost. Attempting to reconnect...",
      variant: "destructive",
    });
  }, [toast]);

  const { connectionStatus, lastMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect,
    onDisconnect,
    reconnectInterval: 5000, // Increase from 3s to 5s
    maxReconnectAttempts: 3, // Reduce from 5 to 3
  });

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
        // Create mock job for UI
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

        // Initialize mock tasks
        const mockTasks: WorkflowTask[] = [
          {
            id: "1",
            jobId: result.jobId,
            agentType: "project_manager",
            taskName: "Project Planning",
            status: "pending",
            progress: 0,
            errorMessage: null,
            retryCount: 0,
            maxRetries: 3,
            estimatedDuration: null,
            actualDuration: null,
            dependencies: null,
            startedAt: null,
            completedAt: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "2",
            jobId: result.jobId,
            agentType: "solution_architect",
            taskName: "System Architecture",
            status: "pending",
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "3",
            jobId: result.jobId,
            agentType: "backend_developer",
            taskName: "Backend Development",
            status: "pending",
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "4",
            jobId: result.jobId,
            agentType: "frontend_developer",
            taskName: "Frontend Development",
            status: "pending",
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "5",
            jobId: result.jobId,
            agentType: "devops_engineer",
            taskName: "DevOps & Deployment",
            status: "pending",
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        setTasks(mockTasks);

        toast({
          title: "Generation Started",
          description:
            "Your code generation has begun. Watch the live progress!",
        });
      } else {
        throw new Error(result.error || "Failed to start generation");
      }
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to start code generation",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-foreground ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Elite Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Bot className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    CrewCodeGen Elite
                  </h1>
                  <p className="text-sm text-purple-300/70">
                    AI-Powered Development Suite
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border backdrop-blur-sm ${
                  connectionStatus === "connected"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {connectionStatus === "connected" ? "Live" : "Offline"}
                </span>
              </div>

              {/* AI Status */}
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI Ready</span>
              </div>

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
        {/* Requirements Input - Enhanced */}
        <div className="mb-8">
          <RequirementsInput
            onStartGeneration={handleStartGeneration}
            isGenerating={isGenerating}
          />
        </div>

        {/* Main Elite Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Agents & Workflow */}
          <div className="lg:col-span-1 xl:col-span-1 space-y-6">
            {/* Agent Status Panel */}
            <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-purple-400" />
                  AI Agents
                </h2>
                <button
                  onClick={() => setShowAgents(!showAgents)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>

              {showAgents && (
                <div className="space-y-3">
                  {[
                    { name: "Project Manager", status: "ready", color: "blue" },
                    {
                      name: "Solution Architect",
                      status: "ready",
                      color: "purple",
                    },
                    {
                      name: "Backend Developer",
                      status: "ready",
                      color: "green",
                    },
                    {
                      name: "Frontend Developer",
                      status: "ready",
                      color: "yellow",
                    },
                    {
                      name: "DevOps Engineer",
                      status: "ready",
                      color: "indigo",
                    },
                  ].map((agent, index) => (
                    <div
                      key={agent.name}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-${agent.color}-400 animate-pulse`}
                      ></div>
                      <span className="text-sm text-white/80">
                        {agent.name}
                      </span>
                      <div className="ml-auto">
                        <Play className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workflow Visualizer */}
            <WorkflowVisualizer
              tasks={tasks}
              overallProgress={currentJob?.progress || 0}
            />
          </div>

          {/* Center Panel - Chat & Code */}
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
                <span className="hidden sm:inline">Chat</span>
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
                <AgentConversationLog
                  messages={messages}
                  isGenerating={isGenerating}
                />
              )}
              {activeView === "code" && (
                <CodeDisplay
                  generatedCode={generatedCode}
                  active
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)