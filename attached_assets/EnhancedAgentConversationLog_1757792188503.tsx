import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Clock,
  Code,
  Loader2,
  MessageCircle,
  Palette,
  Send,
  Server,
  User,
  Zap,
  Brain,
  Copy,
  Download,
  Eye,
  EyeOff,
  Filter,
  Search
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AgentMessage {
  id: string;
  agentType: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'error';
  taskId?: string;
  content?: string;
}

interface EnhancedAgentConversationLogProps {
  messages: AgentMessage[];
  isGenerating: boolean;
  onClearMessages?: () => void;
}

const agentIcons = {
  product_manager: User,
  solution_architect: Code,
  senior_developer: Code,
  qa_engineer: Bug,
  backend_developer: Server,
  frontend_developer: Palette,
  devops_engineer: Server,
  system: Clock,
};

const agentColors = {
  product_manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  solution_architect: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  senior_developer: "bg-green-500/20 text-green-400 border-green-500/30",
  qa_engineer: "bg-red-500/20 text-red-400 border-red-500/30",
  backend_developer: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  frontend_developer: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  devops_engineer: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  system: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const agentDescriptions = {
  product_manager: "Product Manager",
  solution_architect: "Solution Architect",
  senior_developer: "Senior Developer",
  qa_engineer: "QA Engineer",
  backend_developer: "Backend Developer",
  frontend_developer: "Frontend Developer",
  devops_engineer: "DevOps Engineer",
  system: "System",
};

const messageTypeColors = {
  info: "bg-blue-500/10 border-blue-500/20 text-blue-300",
  success: "bg-green-500/10 border-green-500/20 text-green-300",
  warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
  error: "bg-red-500/10 border-red-500/20 text-red-300",
};

export default function EnhancedAgentConversationLog({
  messages,
  isGenerating,
  onClearMessages
}: EnhancedAgentConversationLogProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const scrollToBottom = () => {
    if (isAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAutoScroll]);

  const getAgentIcon = (agentType: string) => {
    const IconComponent =
      agentIcons[agentType as keyof typeof agentIcons] || Code;
    return <IconComponent className="h-4 w-4" />;
  };

  const formatAgentName = (agentType: string) => {
    return (
      agentDescriptions[agentType as keyof typeof agentDescriptions] ||
      agentType
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const getMessageTypeIcon = (message: AgentMessage) => {
    if (message.type === 'success' || message.message.includes("completed") || message.message.includes("finished")) {
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    }
    if (message.type === 'error' || message.message.includes("error") || message.message.includes("failed")) {
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    }
    if (message.type === 'warning' || message.message.includes("warning")) {
      return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    }
    if (message.message.includes("working") || message.message.includes("implementing") || message.message.includes("processing")) {
      return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
    }
    return <Zap className="h-3 w-3 text-purple-400" />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportMessages = () => {
    const exportData = messages.map(msg => ({
      timestamp: msg.timestamp,
      agent: formatAgentName(msg.agentType),
      message: msg.message,
      content: msg.content
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-conversation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter messages
  const filteredMessages = messages.filter(message => {
    const matchesAgent = filterAgent === 'all' || message.agentType === filterAgent;
    const matchesSearch = searchTerm === '' || 
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatAgentName(message.agentType).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAgent && matchesSearch;
  });

  const uniqueAgents = Array.from(new Set(messages.map(m => m.agentType)));

  return (
    <Card className="h-full flex flex-col border border-white/10 bg-black/20 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center text-white">
              <Brain className="text-purple-400 mr-3 h-6 w-6" />
              Agent Communications
            </h2>
            <p className="text-sm text-purple-300/70">
              Real-time AI agent collaboration logs
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="text-xs bg-purple-500/20 border-purple-500/30 text-purple-300"
            >
              {filteredMessages.length}/{messages.length} messages
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              {showDetails ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showDetails ? "Hide" : "Show"} Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportMessages}
              className="text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10"
              disabled={messages.length === 0}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 mt-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-white/60" />
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="bg-black/30 border border-white/20 text-white text-xs rounded px-2 py-1"
            >
              <option value="all">All Agents</option>
              {uniqueAgents.map(agent => (
                <option key={agent} value={agent}>
                  {formatAgentName(agent)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2 flex-1 max-w-xs">
            <Search className="h-4 w-4 text-white/60" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/30 border border-white/20 text-white text-xs rounded px-2 py-1 flex-1 placeholder:text-white/50"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className="text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10"
          >
            Auto-scroll {isAutoScroll ? "ON" : "OFF"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden bg-gradient-to-b from-black/10 to-transparent">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {filteredMessages.length === 0 && !isGenerating ? (
              <div className="text-center py-12 text-white/60">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-lg font-medium mb-2">Ready to collaborate</p>
                <p className="text-sm">
                  {messages.length === 0 
                    ? "Start code generation to see AI agents in action"
                    : "No messages match your current filters"
                  }
                </p>
              </div>
            ) : (
              <>
                {isGenerating && filteredMessages.length === 0 && (
                  <div className="flex justify-center p-6">
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 animate-pulse px-4 py-2">
                      <Clock className="w-4 h-4 mr-2" />
                      AI agents are initializing...
                    </Badge>
                  </div>
                )}

                {filteredMessages.map((message, index) => (
                  <div
                    key={message.id}
                    data-testid={`message-${message.id}`}
                    className="flex items-start space-x-4 animate-in fade-in duration-500 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 shadow-lg ${
                        agentColors[
                          message.agentType as keyof typeof agentColors
                        ] || agentColors.system
                      }`}
                    >
                      {getAgentIcon(message.agentType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`rounded-2xl p-6 max-w-[90%] border hover:bg-white/15 transition-all duration-300 shadow-lg ${
                        message.type ? messageTypeColors[message.type] : 'bg-gradient-to-r from-white/5 to-white/10 border-white/10'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-base flex items-center space-x-3 text-white">
                            {formatAgentName(message.agentType)}
                            {getMessageTypeIcon(message)}
                            {message.taskId && showDetails && (
                              <Badge variant="outline" className="text-xs bg-black/20 border-white/20 text-white/70">
                                Task: {message.taskId}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-white/60 bg-black/20 px-2 py-1 rounded-full">
                              {message.timestamp && formatTime(message.timestamp)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content || message.message)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-white/90">
                          {message.message}
                        </p>
                        
                        {message.content && showDetails && message.content !== message.message && (
                          <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/10">
                            <div className="text-xs text-white/60 mb-2 flex items-center">
                              <Code className="h-3 w-3 mr-1" />
                              Generated Content ({message.content.length} characters)
                            </div>
                            <pre className="text-xs text-white/80 whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {message.content.substring(0, 500)}
                              {message.content.length > 500 && '...'}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse border-2 border-purple-500/30 shadow-lg">
                      <Brain className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-2xl p-6 max-w-[90%] border border-white/10 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-3 h-3 bg-pink-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <span className="text-sm text-white/80 ml-3 font-medium">
                          AI agents are collaborating...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Action Bar */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
        <div className="flex items-center justify-between">
          <div className="text-xs text-purple-300/70">
            {isGenerating ? 'AI agents are actively collaborating' : 'Ready for next generation'}
          </div>
          <div className="flex space-x-2">
            {onClearMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearMessages}
                className="text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10"
                disabled={messages.length === 0}
              >
                Clear Messages
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

