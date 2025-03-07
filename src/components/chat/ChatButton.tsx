
import React, { useState } from 'react';
import { Button } from '@/components/ui-components/Button';
import { 
  MessageSquare, 
  X, 
  Send, 
  Image,
  Mic,
  ArrowRight,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui-components/Card';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  className?: string;
}

const ChatButton: React.FC<ChatButtonProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
  }>>([
    {
      id: '1',
      content: 'Hello! I\'m your AI financial assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    
    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const responses = [
        "I recommend diversifying your portfolio with a mix of ETFs and blue-chip stocks based on your risk profile.",
        "Based on current market conditions, you might want to consider allocating more to defensive sectors.",
        "Your investment strategy looks solid. I'd suggest reviewing your asset allocation quarterly to ensure it aligns with your goals.",
        "Market volatility is expected to increase. Consider establishing stop-loss orders to protect your investments.",
        "The recent economic data suggests inflation concerns may be easing, which could be positive for growth stocks."
      ];
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        sender: 'ai' as const,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Quick suggestion prompts
  const suggestions = [
    "How should I diversify my portfolio?",
    "What stocks look promising this week?",
    "Explain crypto market trends",
    "Help me create a savings plan"
  ];
  
  return (
    <>
      <Button
        onClick={toggleChat}
        variant="glass"
        size="lg"
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center rounded-full shadow-lg transition-all duration-300",
          isOpen ? "bg-destructive hover:bg-destructive/90" : "",
          className
        )}
        leftIcon={isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      >
        {isOpen ? "Close" : "AI Assistant"}
      </Button>
      
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 overflow-hidden shadow-xl animate-scale-in">
          <Card variant="glass">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-3">
                <h3 className="font-medium">Financial AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Powered by advanced AI</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleChat}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex h-96 flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={cn(
                      "flex w-max max-w-[80%] rounded-lg px-3 py-2",
                      message.sender === 'user' 
                        ? "ml-auto bg-primary text-primary-foreground" 
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex w-max max-w-[80%] rounded-lg bg-secondary px-3 py-2 text-secondary-foreground">
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                      <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="mb-2 text-xs text-muted-foreground">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-all hover:border-primary hover:text-primary"
                      onClick={() => {
                        setInputValue(suggestion);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <CardFooter>
              <div className="relative flex w-full items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about finance..."
                  className="w-full rounded-full border border-input bg-background px-4 py-2 pr-12 text-sm outline-none focus:border-primary focus:ring-0"
                />
                <div className="absolute right-1 flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-primary/10"
                    disabled={!inputValue.trim() || isTyping}
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>
            </CardFooter>
          </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatButton;
