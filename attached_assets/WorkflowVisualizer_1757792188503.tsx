import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WorkflowTask } from "@shared/schema";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Clock,
  Code,
  Loader2,
  Palette,
  Server,
  Timer,
  User,
  Zap,
} from "lucide-react";

interface WorkflowVisualizerProps {
  tasks: WorkflowTask[];
  overallProgress: number;
}

const agentIcons = {
  project_manager: User,
  solution_architect: Code,
  backend_developer: Code,
  frontend_developer: Palette,
  qa_engineer: Bug,
  devops_engineer: Server,
};

const statusColors = {
  pending: "bg-muted/50 text-muted-foreground border-muted-foreground/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusIcons = {
  pending: Clock,
  in_progress: Loader2,
  completed: CheckCircle2,
  failed: AlertCircle,
};

const agentDescriptions = {
  project_manager: "Project Manager",
  solution_architect: "Solution Architect",
  backend_developer: "Backend Developer",
  frontend_developer: "Frontend Developer",
  qa_engineer: "QA Engineer",
  devops_engineer: "DevOps Engineer",
};

export default function WorkflowVisualizer({
  tasks,
  overallProgress,
}: WorkflowVisualizerProps) {
  const getAgentIcon = (agentType: string) => {
    const IconComponent =
      agentIcons[agentType as keyof typeof agentIcons] || Code;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    const IconComponent =
      statusIcons[status as keyof typeof statusIcons] || Clock;
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

  const activeAgents = tasks.filter(task => task.status === "in_progress");
  const completedAgents = tasks.filter(task => task.status === "completed");
  const pendingAgents = tasks.filter(task => task.status === "pending");
  const failedAgents = tasks.filter(task => task.status === "failed");

  const getTaskDuration = (task: WorkflowTask) => {
    if (task.createdAt && task.updatedAt) {
      const duration =
        new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
      return Math.round(duration / 1000);
    }
    return 0;
  };

  return (
    <Card className="h-full flex flex-col border border-white/10 bg-black/20 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center text-white">
              <Code className="text-blue-400 mr-3 h-6 w-6" />
              Workflow Pipeline
            </h2>
            <p className="text-sm text-blue-300/70">
              Real-time AI agent progression
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant="outline"
              className="text-xs bg-green-500/20 border-green-500/30 text-green-300"
            >
              {completedAgents.length}/{tasks.length} completed
            </Badge>
            {activeAgents.length > 0 && (
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 text-xs animate-pulse px-3 py-1">
                {activeAgents.length} active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden bg-gradient-to-b from-black/10 to-transparent">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-8">
            {/* Progress Overview */}
            <div className="space-y-6">
              <div className="flex justify-between text-lg">
                <span className="text-white/80 font-semibold">
                  Overall Progress
                </span>
                <span
                  data-testid="text-progress"
                  className="text-blue-400 font-bold text-xl"
                >
                  {overallProgress}%
                </span>
              </div>
              <div className="relative">
                <Progress value={overallProgress} className="h-4 bg-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"></div>
              </div>
              <div className="flex justify-between text-sm text-white/60">
                <span>Started</span>
                <span>In Progress</span>
                <span>Completed</span>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <Clock className="h-8 w-8 text-blue-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">Ready to start</p>
                  <p className="text-sm">
                    Begin code generation to see AI agents in action
                  </p>
                </div>
              ) : (
                tasks.map((task, index) => (
                  <div
                    key={task.id}
                    data-testid={`task-${task.id}`}
                    className={`group p-6 rounded-2xl border-2 transition-all duration-500 hover:scale-[1.02] cursor-pointer shadow-lg ${
                      task.status === "in_progress"
                        ? "border-blue-500/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-blue-500/20"
                        : task.status === "completed"
                        ? "border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10 shadow-green-500/20"
                        : task.status === "failed"
                        ? "border-red-500/50 bg-gradient-to-r from-red-500/10 to-pink-500/10 shadow-red-500/20"
                        : "border-white/20 hover:border-purple-500/30 bg-white/5 hover:bg-white/10"
                    }`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                            task.status === "in_progress"
                              ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 animate-pulse border-2 border-blue-500/30"
                              : task.status === "completed"
                              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-2 border-green-500/30"
                              : task.status === "failed"
                              ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border-2 border-red-500/30"
                              : "bg-white/10 text-white/60 border-2 border-white/20"
                          }`}
                        >
                          {getStatusIcon(task.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-white">
                            {task.taskName}
                          </h3>
                          <div className="text-sm text-white/70 flex items-center space-x-2">
                            {getAgentIcon(task.agentType)}
                            <span>{formatAgentName(task.agentType)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {task.status === "in_progress" && (
                          <div className="flex items-center space-x-2 text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                            <Timer className="h-4 w-4" />
                            <span className="font-medium">
                              {getTaskDuration(task)}s
                            </span>
                          </div>
                        )}
                        <Badge
                          className={`text-sm px-4 py-2 border-2 font-semibold ${
                            statusColors[
                              task.status as keyof typeof statusColors
                            ]
                          }`}
                        >
                          {task.status === "in_progress"
                            ? "In Progress"
                            : task.status === "completed"
                            ? "Completed"
                            : task.status === "failed"
                            ? "Failed"
                            : "Pending"}
                        </Badge>
                      </div>
                    </div>

                    {task.status === "in_progress" && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-white/80">
                          <span className="font-medium">Progress</span>
                          <span className="font-bold text-blue-400">
                            {task.progress}%
                          </span>
                        </div>
                        <div className="relative">
                          <Progress
                            value={task.progress}
                            className="h-3 bg-black/30"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"></div>
                        </div>
                      </div>
                    )}

                    {task.status === "completed" && (
                      <div className="flex items-center space-x-3 text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">
                          Completed in {getTaskDuration(task)}s
                        </span>
                      </div>
                    )}

                    {task.status === "failed" && (
                      <div className="flex items-center space-x-3 text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-full">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">
                          Failed after {getTaskDuration(task)}s
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Agent Status Summary */}
            {tasks.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-4 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Agent Status
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {activeAgents.length > 0 && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-400">
                          Active
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeAgents
                          .map(task => formatAgentName(task.agentType))
                          .join(", ")}
                      </div>
                    </div>
                  )}

                  {completedAgents.length > 0 && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-400">
                          Completed
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {completedAgents.length} agents finished
                      </div>
                    </div>
                  )}

                  {pendingAgents.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Pending
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pendingAgents.length} agents waiting
                      </div>
                    </div>
                  )}

                  {failedAgents.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-400">
                          Failed
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {failedAgents.length} agents failed
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
