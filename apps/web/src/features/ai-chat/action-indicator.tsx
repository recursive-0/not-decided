import React from "react";
import { cn } from "@/lib/utils";
import { CurrentActionType } from "@/lib/composer-mode-parser"; 
import "./action-indicator.css"; 

interface ActionIndicatorProps {
  action: CurrentActionType;
  className?: string;
}


const actionConfig = {
  [CurrentActionType.THINKING]: {
    text: "Wrisor is thinking",
    
    dotColorVar: "var(--olive-green-1)",
    textColorVar: "var(--palette-gold)",
  },
  [CurrentActionType.ADDING]: {
    text: "Adding content...",
    
    
    
    
    
    dotColorVar: "var(--primary)", 
    textColorVar: "var(--primary)", 
  },
  [CurrentActionType.DELETING]: {
    text: "Removing content",
    
    dotColorVar: "var(--destructive)",
    textColorVar: "var(--destructive)",
  },
  [CurrentActionType.NORMAL]: {
    
    text: "Wrisor is thinking",
    dotColorVar: "var(--olive-green-1)",
    textColorVar: "var(--palette-gold)",
  },
  DEFAULT: {
    text: "Wrisor is processing",
    
    dotColorVar: "var(--palette-gray)",
    textColorVar: "var(--palette-gray)",
  }
};

export const ActionIndicator: React.FC<ActionIndicatorProps> = ({
  action,
  className,
}) => {
  
  
  
  

  const config = actionConfig[action] || actionConfig.DEFAULT;

  return (
    <div className={cn("w-full -mt-1 flex justify-start items-center gap-1", className)}>
      <DotLoader dotColorVar={config.dotColorVar} />
      <span
        className={cn("text-sm font-medium")} 
        style={{ color: config.textColorVar }} 
      >
        {config.text}
      </span>
    </div>
  );
};



interface DotLoaderProps {
  dotColorVar: string; 
}

const DotLoader: React.FC<DotLoaderProps> = ({ dotColorVar }) => {
  
  
  const dotClasses = cn(
    "dot", 
    "w-2 h-2 rounded-full",
    "animate-dot-pulse", 
    "opacity-50" 
  );

  
  const dotStyle = { backgroundColor: dotColorVar };

  return (
    <div className={cn("px-4 flex items-center justify-center gap-1")}>
      {}
      <div
        className={dotClasses}
        style={{ ...dotStyle, animationDelay: "0ms" }}
      ></div>
      <div
        className={dotClasses}
        style={{ ...dotStyle, animationDelay: "150ms" }}
      ></div>
      <div
        className={dotClasses}
        style={{ ...dotStyle, animationDelay: "300ms" }}
      ></div>
    </div>
  );
};