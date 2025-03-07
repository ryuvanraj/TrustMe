import React, { ReactNode } from 'react';
import { Search, Bell, User, Settings, LogOut, Menu, X, Briefcase, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui-components/Button';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              className="mr-4 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <div className="relative">
                  <TrendingUp className="h-4 w-4 text-primary-foreground absolute" />
                  <Briefcase className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <span className="hidden text-xl font-bold sm:inline-block">Trust me</span>
            </div>
          </div>
          
          {/* Search */}
          <div className="hidden flex-1 items-center px-8 lg:flex">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search markets, stocks, insights..."
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-0"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Bell className="h-5 w-5" />
            </button>
            
            <button className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Settings className="h-5 w-5" />
            </button>
            
            <div className="ml-2 flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          ></div>
          <div className="absolute left-0 top-16 h-[calc(100vh-4rem)] w-3/4 max-w-sm overflow-y-auto rounded-r-lg border-r border-t bg-background p-6 shadow-lg animate-slide-in-right">
            <nav className="flex flex-col space-y-6">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Dashboard</h4>
                <div className="space-y-1">
                  <button className="flex w-full items-center rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    Overview
                  </button>
                  <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    Markets
                  </button>
                  <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="8 12 12 16 16 12"></polyline>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                    </svg>
                    Investments
                  </button>
                  <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    AI Assistant
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Account</h4>
                <div className="space-y-1">
                  <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </button>
                  <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </button>
                  <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Trust me. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default DashboardLayout;
