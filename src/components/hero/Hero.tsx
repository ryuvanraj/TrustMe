import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui-components/Button';
import { ArrowRight, LineChart, TrendingUp, Briefcase } from 'lucide-react';
import Portfolio from '@/pages/Portfolio';

interface HeroProps {
  className?: string;
}

const Hero: React.FC<HeroProps> = ({ className }) => {
  const navigate = useNavigate();

  const handlePortfolioClick = () => {
    navigate('/Portfolio');
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 sm:py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
              <span className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Powered by advanced AI
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Trust me<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Financial & Business AI
              </span>
            </h1>
            
            <p className="text-lg text-gray-300 max-w-xl">
              Get real-time market insights, AI-powered investment recommendations, and personalized business guidance—all in one elegant dashboard.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handlePortfolioClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center font-medium"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                Your Portfolio
              </Button>
              
              <Button className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-6 py-3 rounded-lg flex items-center font-medium">
                Learn More
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            {/* Abstract data visualization */}
            <div className="aspect-w-4 aspect-h-3 bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <LineChart className="w-16 h-16 text-blue-500 opacity-50" />
              </div>
              
              {Array.from({ length: 7 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-70"
                  style={{
                    top: `${30 + i * 10}%`,
                    left: '10%',
                    right: '10%',
                    transform: `translateY(${Math.sin(i) * 10}px)`
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;