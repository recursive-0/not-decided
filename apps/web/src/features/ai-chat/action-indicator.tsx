import React from "react";
import { cn } from "@/lib/utils";
import "./action-indicator.css"; 
import { Mode } from "@/types/stream";

interface ActionIndicatorProps {
  action: Mode;
  className?: string;
}


const actionConfig = {
  [Mode.thought]: {
    text: "Wrisor is thinking",
    
    dotColorVar: "var(--olive-green-1)",
    textColorVar: "var(--palette-gold)",
  },
  [Mode.normal]: {
    
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