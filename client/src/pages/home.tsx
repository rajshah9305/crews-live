import React, { useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import RequirementsInput from '@/components/RequirementsInput';
import WorkflowVisualizer from '@/components/WorkflowVisualizer';
import AgentConversations from '@/components/AgentConversations';
import CodeDisplay from '@/components/CodeDisplay';
import SystemMetrics from '@/components/SystemMetrics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, History, Download, Plus, Brain, Activity } from 'lucide-react';
import { WebSocketEvent, JobStatus, AgentMessage, CodeFile } from '../../../shared/types';
import { nanoid } from 'nanoid';

export default function Home() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<CodeFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleWebSocketMessage = useCallback((event: WebSocketEvent) => {
    console.log('WebSocket event received:', event);

    switch (event.type) {
      case 'generation_started':
        setIsGenerating(true);
        setCurrentJobId(event.data.jobId);
        // Create initial job status
        setJobStatus({
          jobId: event.data.jobId,
          status: 'in_progress',
          progress: 0,
          startTime: new Date(),
          tasks: [],
        });
        addMessage({
          id: nanoid(),
          agentId: 'system',
          role: 'System',
          content: `🚀 Generation started: AI agents are collaborating to build your ${event.data.request.framework} application`,
          timestamp: new Date(),
          type: 'system',
        });
        break;

      case 'agent_started':
        addMessage({
          id: nanoid(),
          agentId: event.data.agent.toLowerCase().replace(/\s+/g, '_'),
          role: event.data.agent,
          content: `Starting work on: ${event.data.task}`,
          timestamp: new Date(),
          type: 'agent',
        });
        break;

      case 'agent_completed':
        const completionMessage = getAgentCompletionMessage(event.data.agent, event.data.duration);
        addMessage({
          id: nanoid(),
          agentId: event.data.agent.toLowerCase().replace(/\s+/g, '_'),
          role: event.data.agent,
          content: completionMessage,
          timestamp: new Date(),
          type: 'agent',
        });
        break;

      case 'generation_completed':
        setIsGenerating(false);
        setJobStatus(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
        setGeneratedFiles(event.data.files || []);
        addMessage({
          id: nanoid(),
          agentId: 'system',
          role: 'System',
          content: `✅ Code generation completed successfully! Generated ${event.data.files?.length || 0} files.`,
          timestamp: new Date(),
          type: 'system',
        });
        toast({
          title: "Generation Complete!",
          description: `Your code is ready. Generated ${event.data.files?.length || 0} files.`,
        });
        break;

      case 'generation_failed':
        setIsGenerating(false);
        setJobStatus(prev => prev ? { ...prev, status: 'failed' } : null);
        addMessage({
          id: nanoid(),
          agentId: 'system',
          role: 'System',
          content: `❌ Generation failed: ${event.data.error}`,
          timestamp: new Date(),
          type: 'system',
        });
        toast({
          title: "Generation Failed",
          description: event.data.error,
          variant: "destructive",
        });
        break;

      case 'agent_progress':
        // Update job progress
        setJobStatus(prev => {
          if (!prev) return null;
          const updatedTasks = prev.tasks.map(task => 
            task.agent.role === event.data.agent 
              ? { ...task, progress: event.data.progress }
              : task
          );
          return { ...prev, tasks: updatedTasks };
        });
        break;
    }
  }, [toast]);

  const { connectionStatus, clientId, isConnected } = useWebSocket({
    onConnect: () => {
      toast({
        title: "Connected",
        description: "Connected to AI agent system",
      });
    },
    onDisconnect: () => {
      toast({
        title: "Disconnected",
        description: "Lost connection to AI system",
        variant: "destructive",
      });
    },
    onMessage: handleWebSocketMessage,
  });

  const addMessage = (message: AgentMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const getAgentCompletionMessage = (agentRole: string, duration?: number) => {
    const durationText = duration ? ` in ${Math.round(duration / 1000)}s` : '';
    
    const messages = {
      'Product Manager': `✅ Completed requirements analysis${durationText}. Identified key features, prioritized MVP components, and created comprehensive project specifications with user stories and acceptance criteria.`,
      'Solution Architect': `🏗️ System architecture designed${durationText}. Created scalable architecture with modern tech stack recommendations, database schema design, and performance optimization strategies.`,
      'Senior Developer': `💻 Code implementation completed${durationText}! Generated production-ready components, API endpoints, database models, and comprehensive documentation following best practices.`,
      'QA Engineer': `🧪 Quality assurance completed${durationText}. Created comprehensive test suites, validated all functionality, and confirmed deployment readiness with performance metrics.`,
    };
    
    return messages[agentRole] || `✅ ${agentRole} completed their work${durationText}`;
  };

  const handleGenerationStarted = (jobId: string) => {
    setCurrentJobId(jobId);
    setIsGenerating(true);
    setMessages([]);
    setGeneratedFiles([]);
    setJobStatus(null);
  };

  const handleClearMessages = () => {
    setMessages([]);
    toast({
      title: "Messages Cleared",
      description: "Conversation history has been cleared",
    });
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'connecting': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'error': return 'bg-red-500/10 border-red-500/30 text-red-400';
      default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>;
      case 'connecting': return <div className="w-2 h-2 rounded-full bg-yellow-400 animate-spin"></div>;
      case 'error': return <div className="w-2 h-2 rounded-full bg-red-400"></div>;
      default: return <div className="w-2 h-2 rounded-full bg-gray-400"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Brain className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    CrewCodeGen Live
                  </h1>
                  <p className="text-sm text-purple-300/70">
                    Multi-Agent AI Development Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <Badge className={`px-4 py-2 rounded-full ${getConnectionStatusColor()} backdrop-blur-sm`} data-testid="connection-status">
                {getConnectionStatusIcon()}
                <span className="ml-2 text-sm font-medium capitalize">{connectionStatus}</span>
              </Badge>

              {/* AI Status */}
              <Badge className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 backdrop-blur-sm" data-testid="ai-status">
                <Activity className="mr-2" size={16} />
                <span className="text-sm font-medium">AI Ready</span>
              </Badge>

              {/* Client ID */}
              {clientId && (
                <div className="text-xs text-white/50 font-mono bg-black/20 px-2 py-1 rounded" data-testid="client-id">
                  ID: {clientId.slice(-8)}
                </div>
              )}

              {/* Settings */}
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                <Settings size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Requirements Input Section */}
        <div className="mb-8">
          <RequirementsInput 
            onGenerationStarted={handleGenerationStarted}
            isGenerating={isGenerating}
          />
        </div>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Panel: Workflow Visualizer */}
          <div className="xl:col-span-1">
            <WorkflowVisualizer 
              jobStatus={jobStatus}
              isGenerating={isGenerating}
            />
          </div>

          {/* Center Panel: Agent Conversations */}
          <div className="xl:col-span-1">
            <AgentConversations 
              messages={messages}
              onClearMessages={handleClearMessages}
            />
          </div>

          {/* Right Panel: Code Display */}
          <div className="xl:col-span-1">
            <CodeDisplay 
              files={generatedFiles}
              isGenerating={isGenerating}
            />
          </div>
        </div>

        {/* System Metrics Dashboard */}
        <div className="mt-8">
          <SystemMetrics />
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4 z-50">
        <Button 
          size="lg" 
          className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-110" 
          title="New Generation"
          data-testid="fab-new-generation"
        >
          <Plus size={20} />
        </Button>
        <Button 
          size="lg" 
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-110" 
          title="View History"
          data-testid="fab-history"
        >
          <History size={20} />
        </Button>
        <Button 
          size="lg" 
          className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-lg shadow-green-500/25 transition-all duration-300 transform hover:scale-110" 
          title="Export Code"
          data-testid="fab-export"
        >
          <Download size={20} />
        </Button>
      </div>
    </div>
  );
}
