
import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline';
  isHoverable?: boolean;
  isAnimated?: boolean;
}

const Card = ({
  children,
  className,
  variant = 'default',
  isHoverable = false,
  isAnimated = false,
  ...props
}: CardProps) => {
  const baseStyles = "rounded-xl overflow-hidden";
  
  const variantStyles = {
    default: "bg-card text-card-foreground shadow",
    glass: "glass-card",
    outline: "border border-border bg-transparent"
  };
  
  const hoverStyles = isHoverable ? "hover-lift" : "";
  const animationStyles = isAnimated ? "animate-scale-in" : "";
  
  return (
    <div 
      className={cn(
        baseStyles,
        variantStyles[variant],
        hoverStyles,
        animationStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = ({
  className,
  children,
  ...props
}: CardHeaderProps) => {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = ({
  className,
  children,
  ...props
}: CardTitleProps) => {
  return (
    <h3
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
};

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = ({
  className,
  children,
  ...props
}: CardDescriptionProps) => {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
};

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = ({
  className,
  children,
  ...props
}: CardContentProps) => {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = ({
  className,
  children,
  ...props
}: CardFooterProps) => {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
