import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, User, Compass, Code, Bug, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { JobStatus, Task } from '../../../shared/types';

interface WorkflowVisualizerProps {
  jobStatus: JobStatus | null;
  isGenerating: boolean;
}

const agentIcons = {
  'Product Manager': User,
  'Solution Architect': Compass,
  'Senior Developer': Code,
  'QA Engineer': Bug,
};

const agentColors = {
  'Product Manager': 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
  'Solution Architect': 'from-blue-500/20 to-purple-500/20 border-blue-500/30 text-blue-400',
  'Senior Developer': 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
  'QA Engineer': 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400',
};

function TaskCard({ task, isActive }: { task: Task; isActive: boolean }) {
  const IconComponent = agentIcons[task.agent.role as keyof typeof agentIcons];
  const colorClasses = agentColors[task.agent.role as keyof typeof agentColors];
  
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'in_progress':
        return <Loader2 size={16} className="text-blue-400 animate-spin" />;
      case 'failed':
        return <div className="w-4 h-4 bg-red-500 rounded-full" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
            <Loader2 size={12} className="mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            Pending
          </Badge>
        );
    }
  };

  const getDuration = () => {
    if (task.startTime && task.endTime) {
      const duration = task.endTime.getTime() - task.startTime.getTime();
      return `${Math.round(duration / 1000)}s`;
    }
    if (task.startTime && task.status === 'in_progress') {
      const duration = Date.now() - task.startTime.getTime();
      return `${Math.round(duration / 1000)}s`;
    }
    return null;
  };

  return (
    <div className={`group p-6 rounded-2xl border-2 transition-all duration-500 ${
      task.status === 'completed' 
        ? 'border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10 shadow-green-500/20'
        : task.status === 'in_progress'
        ? 'border-blue-500/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-blue-500/20'
        : 'border-white/20 bg-gradient-to-r from-white/5 to-white/10'
    }`} data-testid={`task-card-${task.agent.role.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-r ${colorClasses.split(' ').slice(0, 2).join(' ')} border-2 transition-all duration-300 ${
            isActive ? 'animate-pulse scale-110' : ''
          }`}>
            {IconComponent && <IconComponent size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">{task.description.split(':')[0]}</h3>
            <div className="text-sm text-white/70 flex items-center space-x-2">
              {IconComponent && <IconComponent size={16} className={colorClasses.split(' ').slice(2, 3).join(' ')} />}
              <span>{task.agent.role}</span>
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>
      
      {task.status === 'in_progress' && typeof task.progress === 'number' && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-white/80">
            <span className="font-medium">Progress</span>
            <span className="font-bold text-blue-400">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-3" />
        </div>
      )}
      
      {task.status === 'completed' && getDuration() && (
        <div className="flex items-center space-x-3 text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-full">
          <CheckCircle size={16} />
          <span className="font-medium">Completed in {getDuration()}</span>
        </div>
      )}
      
      {task.status === 'in_progress' && getDuration() && (
        <div className="flex items-center space-x-3 text-sm text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full">
          <Clock size={16} />
          <span className="font-medium">Running for {getDuration()}</span>
        </div>
      )}
    </div>
  );
}

export default function WorkflowVisualizer({ jobStatus, isGenerating }: WorkflowVisualizerProps) {
  const completedTasks = jobStatus?.tasks.filter(task => task.status === 'completed').length || 0;
  const totalTasks = jobStatus?.tasks.length || 4;
  const overallProgress = jobStatus?.progress || 0;

  return (
    <Card className="glassmorphism border-white/10 h-full flex flex-col">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center text-white">
              <Brain className="text-blue-400 mr-3" size={24} />
              AI Workflow Pipeline
            </CardTitle>
            <p className="text-sm text-blue-300/70">Multi-agent code generation system</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs bg-blue-500/20 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full font-mono" data-testid="job-id">
            {jobStatus ? `Job: ${jobStatus.jobId.slice(-8)}` : 'No Active Job'}
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-500/20 border-green-500/30 text-green-300" data-testid="completed-tasks">
              {completedTasks}/{totalTasks} completed
            </Badge>
            {isGenerating && (
              <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-300 animate-pulse" data-testid="active-indicator">
                <Brain className="mr-1" size={12} />
                1 active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Progress Overview */}
      <div className="p-6 border-b border-white/10">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-lg mb-2">
              <span className="text-white/80 font-semibold">Overall Progress</span>
              <span className="text-blue-400 font-bold text-xl" data-testid="overall-progress">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-4" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/70">
              <span>Status:</span>
              <span className="font-medium text-blue-400" data-testid="job-status">
                {jobStatus?.status === 'in_progress' ? 'Generating' : 
                 jobStatus?.status === 'completed' ? 'Completed' : 
                 jobStatus?.status === 'failed' ? 'Failed' : 'Ready'}
              </span>
            </div>
            <div className="flex justify-between text-sm text-white/70">
              <span>Current:</span>
              <span className="font-medium text-purple-400" data-testid="current-agent">
                {jobStatus?.currentAgent || 'Waiting'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Tasks */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto code-scroll">
        {jobStatus?.tasks.map((task, index) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            isActive={task.status === 'in_progress'} 
          />
        )) || (
          // Default empty state
          <div className="text-center py-8">
            <Brain className="mx-auto text-white/30 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-white/60 mb-2">No Active Generation</h3>
            <p className="text-sm text-white/40">Start a code generation to see the workflow in action</p>
          </div>
        )}
      </div>
    </Card>
  );
}
