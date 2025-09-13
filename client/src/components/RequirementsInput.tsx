import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Brain, Activity, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RequirementsInputProps {
  onGenerationStarted: (jobId: string) => void;
  isGenerating: boolean;
}

export default function RequirementsInput({ onGenerationStarted, isGenerating }: RequirementsInputProps) {
  const [requirements, setRequirements] = useState('');
  const [framework, setFramework] = useState('');
  const [language, setLanguage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!requirements.trim() || !framework || !language) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest('POST', '/api/generate', {
        requirements: requirements.trim(),
        framework,
        language,
      });

      const data = await response.json();
      
      if (data.success) {
        onGenerationStarted(data.jobId);
        toast({
          title: "Generation Started!",
          description: `Job ID: ${data.jobId}. Estimated time: ${data.estimatedTime}`,
        });
      }
    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to start code generation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glassmorphism border-white/10">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Brain className="text-white" size={20} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white flex items-center">
              <Rocket className="text-purple-400 mr-3" size={24} />
              Project Requirements
            </CardTitle>
            <p className="text-white/70 text-sm">Describe your project and let our AI agents build it for you</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Project Requirements *
              </label>
              <Textarea
                placeholder="Describe your project in detail. What features do you need? What should it accomplish? Be as specific as possible..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="h-32 bg-black/30 border-white/20 text-white placeholder-white/50 focus:border-purple-500/50 focus:ring-purple-500/20 resize-none"
                data-testid="input-requirements"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Framework *
              </label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white focus:border-purple-500/50 focus:ring-purple-500/20" data-testid="select-framework">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="vue">Vue.js</SelectItem>
                  <SelectItem value="angular">Angular</SelectItem>
                  <SelectItem value="nextjs">Next.js</SelectItem>
                  <SelectItem value="svelte">Svelte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Language *
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white focus:border-purple-500/50 focus:ring-purple-500/20" data-testid="select-language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isSubmitting || isGenerating}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              data-testid="button-generate"
            >
              <Rocket className="mr-2" size={16} />
              {isSubmitting ? 'Starting...' : isGenerating ? 'Generating...' : 'Generate Code'}
            </Button>
          </div>
        </div>

        {/* Generation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400" data-testid="stat-total-generations">1,247</div>
            <div className="text-sm text-white/60">Projects Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400" data-testid="stat-active-agents">4</div>
            <div className="text-sm text-white/60">AI Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400" data-testid="stat-avg-time">47s</div>
            <div className="text-sm text-white/60">Avg. Generation Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-400" data-testid="stat-success-rate">98.3%</div>
            <div className="text-sm text-white/60">Success Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
