import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCode, Download, Copy, Check, Folder, Server, Database } from 'lucide-react';
import { CodeFile } from '../../../shared/types';
import { useToast } from '@/hooks/use-toast';

interface CodeDisplayProps {
  files: CodeFile[];
  isGenerating: boolean;
}

const languageIcons = {
  typescript: FileCode,
  javascript: FileCode,
  python: FileCode,
  java: FileCode,
  go: FileCode,
  json: FileCode,
  css: FileCode,
  html: FileCode,
  sql: Database,
};

const languageColors = {
  typescript: 'text-blue-400',
  javascript: 'text-yellow-400',
  python: 'text-green-400',
  java: 'text-red-400',
  go: 'text-cyan-400',
  json: 'text-orange-400',
  css: 'text-purple-400',
  html: 'text-pink-400',
  sql: 'text-emerald-400',
};

function CodeViewer({ file }: { file: CodeFile }) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copied!",
        description: `${file.path} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadFile = () => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: `${file.path} has been downloaded`,
    });
  };

  const getLineNumbers = () => {
    const lines = file.content.split('\n');
    return lines.map((_, index) => (
      <div key={index} className="text-right pr-4 text-white/30 select-none">
        {index + 1}
      </div>
    ));
  };

  const highlightCode = (code: string, language: string) => {
    // Simple syntax highlighting - in production, use a proper syntax highlighter
    let highlighted = code;
    
    if (language === 'typescript' || language === 'javascript') {
      highlighted = highlighted
        .replace(/\b(import|export|from|const|let|var|function|class|interface|type)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/\b(React|useState|useEffect|return)\b/g, '<span class="text-blue-400">$1</span>')
        .replace(/'([^']*)'/g, '<span class="text-green-400">\'$1\'</span>')
        .replace(/"([^"]*)"/g, '<span class="text-green-400">"$1"</span>')
        .replace(/\/\*[\s\S]*?\*\//g, '<span class="text-white/50">$&</span>')
        .replace(/\/\/.*$/gm, '<span class="text-white/50">$&</span>');
    }
    
    return highlighted;
  };

  return (
    <div className="h-full bg-black/30 rounded-b-2xl overflow-hidden">
      <div className="h-full font-mono text-sm overflow-hidden">
        <div className="flex h-full">
          {/* Line Numbers */}
          <div className="bg-black/20 border-r border-white/10 p-4 min-w-[3rem]">
            {getLineNumbers()}
          </div>
          
          {/* Code Content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              <pre className="text-white/90 whitespace-pre-wrap break-words">
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(file.content, file.language)
                  }}
                />
              </pre>
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* Code Actions */}
      <div className="border-t border-white/10 p-4 bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-white/60">
            {React.createElement(languageIcons[file.language as keyof typeof languageIcons] || FileCode, {
              size: 16,
              className: languageColors[file.language as keyof typeof languageColors] || 'text-white'
            })}
            <span>{file.language}</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ready</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
              data-testid={`button-copy-${file.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
            >
              {isCopied ? <Check size={16} /> : <Copy size={16} />}
              {isCopied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadFile}
              className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
              data-testid={`button-download-${file.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
            >
              <Download size={16} />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CodeDisplay({ files, isGenerating }: CodeDisplayProps) {
  const [activeTab, setActiveTab] = useState(files[0]?.path || '');
  const { toast } = useToast();

  React.useEffect(() => {
    if (files.length > 0 && !activeTab) {
      setActiveTab(files[0].path);
    }
  }, [files, activeTab]);

  const downloadAllFiles = () => {
    // Create a zip-like structure by downloading files individually
    files.forEach((file, index) => {
      setTimeout(() => {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.path.split('/').pop() || `file${index}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, index * 100);
    });
    
    toast({
      title: "Download Started",
      description: `Downloading ${files.length} files...`,
    });
  };

  const copyAllCode = async () => {
    const allCode = files.map(file => `// ${file.path}\n${file.content}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(allCode);
      toast({
        title: "All Code Copied!",
        description: `${files.length} files copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy all code to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glassmorphism border-white/10 h-full flex flex-col">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center text-white">
              <FileCode className="text-green-400 mr-3" size={24} />
              Generated Code
            </CardTitle>
            <p className="text-sm text-green-300/70">Production-ready files</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadAllFiles}
              disabled={files.length === 0}
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-download-all"
            >
              <Download size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAllCode}
              disabled={files.length === 0}
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-copy-all"
            >
              <Copy size={16} />
            </Button>
          </div>
        </div>

        {/* File Tabs */}
        {files.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-black/20 border-white/10 overflow-x-auto">
              {files.map((file) => {
                const IconComponent = languageIcons[file.language as keyof typeof languageIcons] || FileCode;
                const fileName = file.path.split('/').pop() || file.path;
                const isComponent = file.path.includes('components/');
                const isAPI = file.path.includes('api/') || file.path.includes('server');
                const isConfig = file.path.includes('package.json') || file.path.includes('config');
                
                return (
                  <TabsTrigger
                    key={file.path}
                    value={file.path}
                    className="flex items-center space-x-2 whitespace-nowrap data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
                    data-testid={`tab-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`}
                  >
                    {isAPI ? <Server size={16} /> : isComponent ? <Folder size={16} /> : <IconComponent size={16} />}
                    <span>{fileName}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {files.map((file) => (
              <TabsContent key={file.path} value={file.path} className="h-full mt-0">
                <CodeViewer file={file} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardHeader>

      {files.length === 0 && (
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {isGenerating ? (
              <>
                <FileCode className="mx-auto text-white/30 mb-4 animate-pulse" size={48} />
                <h3 className="text-lg font-semibold text-white/60 mb-2">Generating Code...</h3>
                <p className="text-sm text-white/40">AI agents are working on your project</p>
              </>
            ) : (
              <>
                <FileCode className="mx-auto text-white/30 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-white/60 mb-2">No Code Generated</h3>
                <p className="text-sm text-white/40">Start a generation to see your code here</p>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
