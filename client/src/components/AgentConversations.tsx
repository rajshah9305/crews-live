import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Trash2, Send, Settings, User, Compass, Code, Bug } from 'lucide-react';
import { AgentMessage } from '../../../shared/types';
import { formatDistanceToNow } from 'date-fns';

interface AgentConversationsProps {
  messages: AgentMessage[];
  onClearMessages: () => void;
  onSendMessage?: (message: string) => void;
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
  'System': 'from-gray-500/20 to-gray-600/20 border-gray-500/30 text-gray-400',
};

function MessageBubble({ message }: { message: AgentMessage }) {
  const IconComponent = agentIcons[message.role as keyof typeof agentIcons] || Settings;
  const colorClasses = agentColors[message.role as keyof typeof agentColors] || agentColors.System;

  const getMessageIcon = () => {
    if (message.type === 'system') return '🚀';
    if (message.role === 'Product Manager') return '✅';
    if (message.role === 'Solution Architect') return '🏗️';
    if (message.role === 'Senior Developer') return '💻';
    if (message.role === 'QA Engineer') return '🧪';
    return '🤖';
  };

  return (
    <div className="flex items-start space-x-3" data-testid={`message-${message.id}`}>
      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${colorClasses.split(' ').slice(0, 2).join(' ')} flex items-center justify-center border ${colorClasses.split(' ').slice(2, 3).join(' ')}`}>
        <IconComponent size={16} className={colorClasses.split(' ').slice(3).join(' ')} />
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className={`font-semibold text-sm ${colorClasses.split(' ').slice(3).join(' ')}`}>
            {message.role}
          </span>
          <span className="text-xs text-white/50" data-testid={`message-time-${message.id}`}>
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </div>
        <div className={`bg-gradient-to-r ${colorClasses.split(' ').slice(0, 2).join(' ')} border ${colorClasses.split(' ').slice(2, 3).join(' ')} rounded-lg p-3 text-sm text-white/80`}>
          <span className="mr-2">{getMessageIcon()}</span>
          {message.content}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ agentRole }: { agentRole: string }) {
  const IconComponent = agentIcons[agentRole as keyof typeof agentIcons] || Settings;
  const colorClasses = agentColors[agentRole as keyof typeof agentColors] || agentColors.System;

  return (
    <div className="flex items-start space-x-3 opacity-70" data-testid="typing-indicator">
      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${colorClasses.split(' ').slice(0, 2).join(' ')} flex items-center justify-center border ${colorClasses.split(' ').slice(2, 3).join(' ')} animate-pulse`}>
        <IconComponent size={16} className={colorClasses.split(' ').slice(3).join(' ')} />
      </div>
      <div className="flex-1">
        <div className={`bg-gradient-to-r ${colorClasses.split(' ').slice(0, 2).join(' ')} border ${colorClasses.split(' ').slice(2, 3).join(' ')} rounded-lg p-3`}>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 ${colorClasses.split(' ').slice(3).join(' ')} rounded-full animate-bounce`}></div>
            <div className={`w-2 h-2 ${colorClasses.split(' ').slice(3).join(' ')} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
            <div className={`w-2 h-2 ${colorClasses.split(' ').slice(3).join(' ')} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentConversations({ messages, onClearMessages, onSendMessage }: AgentConversationsProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulate typing indicator for active agents
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.type === 'agent') {
      setIsTyping('QA Engineer'); // Example: show QA Engineer as typing next
      const timeout = setTimeout(() => setIsTyping(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="glassmorphism border-white/10 h-full flex flex-col">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center text-white">
              <MessageCircle className="text-purple-400 mr-3" size={24} />
              Agent Conversations
            </CardTitle>
            <p className="text-sm text-purple-300/70">Real-time AI collaboration</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearMessages}
            className="text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-clear-messages"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardHeader>

      {/* Messages Container */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-6" ref={scrollAreaRef} data-testid="messages-container">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto text-white/30 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-white/60 mb-2">No Messages Yet</h3>
                <p className="text-sm text-white/40">Agent conversations will appear here during code generation</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            
            {isTyping && <TypingIndicator agentRole={isTyping} />}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center space-x-3">
          <Input
            type="text"
            placeholder="Send message to agents..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-black/30 border-white/20 text-white placeholder-white/50 focus:border-purple-500/50 focus:ring-purple-500/20"
            data-testid="input-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            data-testid="button-send-message"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
