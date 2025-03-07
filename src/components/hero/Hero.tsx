
import React from 'react';
import { Button } from '@/components/ui-components/Button';
import { ArrowRight, LineChart, TrendingUp, Briefcase } from 'lucide-react';

interface HeroProps {
  className?: string;
}

const Hero: React.FC<HeroProps> = ({ className }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
      
      {/* Animated background elements */}
      <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-primary/5 animate-float" style={{ animationDelay: '0s' }}></div>
      <div className="absolute top-20 right-20 h-32 w-32 rounded-full bg-primary/10 animate-float" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute -bottom-20 left-40 h-48 w-48 rounded-full bg-primary/5 animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <TrendingUp className="mr-1 h-4 w-4" />
            <span>Powered by advanced AI</span>
          </div>
          
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">Trust me</span>
            <span className="block text-gradient">Financial & Business AI</span>
          </h1>
          
          <p className="mb-8 text-balance text-lg text-muted-foreground">
            Get real-time market insights, AI-powered investment recommendations, and personalized business guidance—all in one elegant dashboard.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
              Explore Dashboard
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>
      
      {/* Abstract data visualization */}
      <div className="absolute bottom-0 right-0 hidden w-1/3 animate-fade-in lg:block">
        <div className="flex translate-y-16 flex-col items-end space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div 
              key={i} 
              className="h-1.5 rounded-full bg-primary/80"
              style={{ 
                width: `${Math.random() * 50 + 50}%`,
                opacity: 0.2 + (i * 0.1),
                transform: `scaleX(${1 - (i * 0.05)})`,
                transformOrigin: 'right'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
