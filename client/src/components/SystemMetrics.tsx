import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Activity, CheckCircle, Rocket, Cpu, HardDrive } from 'lucide-react';
import { SystemMetrics as SystemMetricsType } from '../../../shared/types';
import { useQuery } from '@tanstack/react-query';

function MetricCard({ 
  icon: IconComponent, 
  title, 
  value, 
  subtitle, 
  progress, 
  progressLabel, 
  colorFrom, 
  colorTo,
  textColor 
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle: string;
  progress?: number;
  progressLabel?: string;
  colorFrom: string;
  colorTo: string;
  textColor: string;
}) {
  return (
    <div className={`bg-gradient-to-r ${colorFrom} ${colorTo} border border-opacity-20 rounded-xl p-6`} data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${colorFrom.replace('/10', '/20')} ${colorTo.replace('/10', '/20')} rounded-xl flex items-center justify-center`}>
          <IconComponent className={textColor} size={24} />
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${textColor}`} data-testid={`value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </div>
          <div className="text-sm text-white/70">{subtitle}</div>
        </div>
      </div>
      {progress !== undefined && (
        <div className="text-xs text-white/60">
          <div className="flex justify-between mb-1">
            <span>{progressLabel}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}

function ActivityGraph() {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    // Generate random activity data
    const generateBars = () => {
      return Array.from({ length: 12 }, () => Math.random() * 100);
    };

    setBars(generateBars());

    // Update bars every 3 seconds to simulate real-time data
    const interval = setInterval(() => {
      setBars(generateBars());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getBarColor = (height: number) => {
    if (height > 80) return 'from-pink-500/50 to-pink-500/20';
    if (height > 60) return 'from-yellow-500/50 to-yellow-500/20';
    if (height > 40) return 'from-green-500/50 to-green-500/20';
    if (height > 20) return 'from-blue-500/50 to-blue-500/20';
    return 'from-purple-500/50 to-purple-500/20';
  };

  return (
    <div className="h-32 flex items-end justify-between space-x-1" data-testid="activity-graph">
      {bars.map((height, index) => (
        <div
          key={index}
          className={`bg-gradient-to-t ${getBarColor(height)} rounded-t w-4 transition-all duration-1000 ${
            height > 70 ? 'animate-pulse' : ''
          }`}
          style={{ height: `${Math.max(height, 10)}%` }}
          data-testid={`activity-bar-${index}`}
        />
      ))}
    </div>
  );
}

export default function SystemMetrics() {
  const { data: metrics } = useQuery<SystemMetricsType & { connectedClients: number }>({
    queryKey: ['/api/metrics'],
    refetchInterval: 5000, // Refetch every 5 seconds
    initialData: {
      activeJobs: 0,
      totalGenerations: 1247,
      successRate: 98.3,
      averageResponseTime: '47ms',
      cpuUsage: 67,
      memoryUsage: 45,
      connectedClients: 0,
    }
  });

  return (
    <Card className="glassmorphism border-white/10">
      <CardHeader className="border-b border-white/10">
        <div className="mb-6">
          <CardTitle className="text-2xl font-bold text-white mb-2 flex items-center">
            <TrendingUp className="text-cyan-400 mr-3" size={24} />
            System Metrics
          </CardTitle>
          <p className="text-white/70">Real-time platform performance and statistics</p>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Jobs */}
          <MetricCard
            icon={Activity}
            title="Active Jobs"
            value={metrics?.activeJobs || 0}
            subtitle="Running Now"
            progress={metrics?.cpuUsage}
            progressLabel="CPU Usage"
            colorFrom="from-blue-500/10"
            colorTo="to-purple-500/10"
            textColor="text-blue-400"
          />

          {/* Response Time */}
          <MetricCard
            icon={TrendingUp}
            title="Response Time"
            value={metrics?.averageResponseTime || '47ms'}
            subtitle="Avg Response"
            progress={95}
            progressLabel="Performance"
            colorFrom="from-green-500/10"
            colorTo="to-emerald-500/10"
            textColor="text-green-400"
          />

          {/* Success Rate */}
          <MetricCard
            icon={CheckCircle}
            title="Success Rate"
            value={`${metrics?.successRate || 98.3}%`}
            subtitle="Quality Score"
            progress={metrics?.successRate}
            progressLabel="Quality A+"
            colorFrom="from-purple-500/10"
            colorTo="to-pink-500/10"
            textColor="text-purple-400"
          />

          {/* Total Generations */}
          <MetricCard
            icon={Rocket}
            title="Total Generated"
            value={metrics?.totalGenerations || 1247}
            subtitle="Projects Created"
            progress={85}
            progressLabel="This Month +23%"
            colorFrom="from-yellow-500/10"
            colorTo="to-orange-500/10"
            textColor="text-yellow-400"
          />
        </div>

        {/* Real-time Activity Graph */}
        <div className="bg-black/30 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Real-time Activity</h3>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                Live
              </Badge>
              <div className="text-sm text-white/60">
                {metrics?.connectedClients || 0} clients connected
              </div>
            </div>
          </div>
          <ActivityGraph />
        </div>

        {/* System Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-black/20 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="text-blue-400" size={20} />
                <span className="font-semibold text-white">CPU Usage</span>
              </div>
              <span className="text-blue-400 font-bold" data-testid="cpu-usage">
                {metrics?.cpuUsage || 67}%
              </span>
            </div>
            <Progress value={metrics?.cpuUsage || 67} className="h-2" />
          </div>

          <div className="bg-black/20 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <HardDrive className="text-green-400" size={20} />
                <span className="font-semibold text-white">Memory Usage</span>
              </div>
              <span className="text-green-400 font-bold" data-testid="memory-usage">
                {metrics?.memoryUsage || 45}%
              </span>
            </div>
            <Progress value={metrics?.memoryUsage || 45} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
