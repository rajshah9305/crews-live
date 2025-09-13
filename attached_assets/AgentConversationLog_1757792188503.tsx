import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentMessage } from "@shared/schema";
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AgentConversationLogProps {
  messages: AgentMessage[];
  isGenerating: boolean;
}

const agentIcons = {
  project_manager: User,
  solution_architect: Code,
  backend_developer: Code,
  frontend_developer: Palette,
  qa_engineer: Bug,
  devops_engineer: Server,
  system: Clock,
};

const agentColors = {
  project_manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  solution_architect: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  backend_developer: "bg-green-500/20 text-green-400 border-green-500/30",
  frontend_developer: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  qa_engineer: "bg-red-500/20 text-red-400 border-red-500/30",
  devops_engineer: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  system: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const agentDescriptions = {
  project_manager: "Project Manager",
  solution_architect: "Solution Architect",
  backend_developer: "Backend Developer",
  frontend_developer: "Frontend Developer",
  qa_engineer: "QA Engineer",
  devops_engineer: "DevOps Engineer",
  system: "System",
};

export default function AgentConversationLog({
  messages,
  isGenerating,
}: AgentConversationLogProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

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
      hour12: true,
    });
  };

  const getMessageTypeIcon = (message: AgentMessage) => {
    if (
      message.message.includes("completed") ||
      message.message.includes("finished")
    ) {
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    }
    if (
      message.message.includes("error") ||
      message.message.includes("failed")
    ) {
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    }
    if (
      message.message.includes("working") ||
      message.message.includes("implementing")
    ) {
      return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
    }
    return <Zap className="h-3 w-3 text-primary" />;
  };

  return (
    <Card className="h-full flex flex-col border border-white/10 bg-black/20 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center text-white">
              <MessageCircle className="text-purple-400 mr-3 h-6 w-6" />
              Agent Conversations
            </h2>
            <p className="text-sm text-purple-300/70">
              Real-time AI agent communications
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant="outline"
              className="text-xs bg-purple-500/20 border-purple-500/30 text-purple-300"
            >
              {messages.length} messages
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className="text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              {isAutoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden bg-gradient-to-b from-black/10 to-transparent">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {messages.length === 0 && !isGenerating ? (
              <div className="text-center py-12 text-white/60">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-lg font-medium mb-2">Ready to collaborate</p>
                <p className="text-sm">
                  Start code generation to see AI agents in action
                </p>
              </div>
            ) : (
              <>
                {isGenerating && messages.length === 0 && (
                  <div className="flex justify-center p-6">
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 animate-pulse px-4 py-2">
                      <Clock className="w-4 h-4 mr-2" />
                      AI agents are initializing...
                    </Badge>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    data-testid={`message-${message.id}`}
                    className="flex items-start space-x-4 animate-in fade-in duration-500"
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
                      <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-2xl p-6 max-w-[90%] border border-white/10 hover:bg-white/15 transition-all duration-300 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-base flex items-center space-x-3 text-white">
                            {formatAgentName(message.agentType)}
                            {getMessageTypeIcon(message)}
                          </div>
                          <div className="text-xs text-white/60 bg-black/20 px-2 py-1 rounded-full">
                            {message.timestamp && formatTime(message.timestamp)}
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-white/90">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse border-2 border-purple-500/30 shadow-lg">
                      <Code className="h-5 w-5 text-purple-400" />
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

      {/* Chat Input */}
      <div className="p-6 border-t border-white/10 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
        <div className="flex space-x-3">
          <Input
            data-testid="input-chat"
            type="text"
            placeholder="Send a message to AI agents..."
            className="flex-1 bg-black/30 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all rounded-xl"
            disabled
          />
          <Button
            data-testid="button-send-chat"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all rounded-xl px-6 shadow-lg shadow-purple-500/25"
            disabled
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-purple-300/70 mt-3 text-center">
          Interactive chat with AI agents coming soon
        </p>
      </div>
    </Card>
  );
}
