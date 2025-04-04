import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Link,
  Sparkles 
} from 'lucide-react';
import { useSSEStream } from '@/hooks/use-sse-stream';


const formatOptions = [
  { id: 'bold', icon: Bold, label: 'Bold', shortcut: '⌘B' },
  { id: 'italic', icon: Italic, label: 'Italic', shortcut: '⌘I' },
  { id: 'underline', icon: Underline, label: 'Underline', shortcut: '⌘U' },
  { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', shortcut: '⌘⇧X' },
];


const alignmentOptions = [
  { id: 'alignLeft', icon: AlignLeft, label: 'Align Left', shortcut: '⌘L' },
  { id: 'alignCenter', icon: AlignCenter, label: 'Align Center', shortcut: '⌘E' },
  { id: 'alignJustify', icon: AlignJustify, label: 'Justify', shortcut: '⌘J' },
];

type FormatButtonProps = {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  active: boolean;
  onClick: () => void;
};


const FormatButton = ({
  icon: Icon,
  label,
  shortcut,
  active,
  onClick,
}: FormatButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "rounded-sm p-1.5 transition-colors", 
            active
              ? "bg-secondary text-[#073642]" 
              : "text-[#073642] hover:bg-secondary/50" 
          )}
          onClick={onClick}
          aria-label={label} 
        >
          <Icon className="h-4 w-4" /> {}
        </button>
      </TooltipTrigger>
      {}
      <TooltipContent className="bg-card text-card-foreground border-border flex items-center gap-2">
        <span>{label}</span>
        {shortcut && (
          <span className="flex items-center rounded border border-border bg-secondary px-1 text-xs font-semibold text-secondary-foreground">
            {shortcut}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

const Toolbar = () => {
  
  const [activeFormats, setActiveFormats] = useState<string[]>(['italic']);
  const { startStreaming } = useSSEStream();

  const toggleFormat = (format: string) => {
    
    setActiveFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
    
  };

  return (
    <TooltipProvider delayDuration={150}> {}
      <div className="h-10 w-full flex items-center justify-start bg-background px-2 py-1.5 gap-1">
        <div className="flex items-center gap-0.5"> {}
          {formatOptions.map((option) => (
            <FormatButton
              key={option.id}
              icon={option.icon}
              label={option.label}
              shortcut={option.shortcut}
              active={activeFormats.includes(option.id)}
              onClick={() => toggleFormat(option.id)}
            />
          ))}
        </div>

        {}
        <div className="w-px h-5 mx-1.5 bg-border" />

        {}
        <div className="flex items-center gap-0.5">
          {alignmentOptions.map((option) => (
            <FormatButton
              key={option.id}
              icon={option.icon}
              label={option.label}
              shortcut={option.shortcut}
              active={activeFormats.includes(option.id)} 
              onClick={() => toggleFormat(option.id)} 
            />
          ))}
        </div>

        {}
        <div className="w-px h-5 mx-1.5 bg-border" />

        {}
        <Tooltip>
          <TooltipTrigger asChild>
            {}
            <button className="flex items-center gap-1 rounded-sm px-2 py-1 transition-colors text-[#073642] hover:bg-secondary/50">
              <Link className="h-4 w-4" />
              <span className="text-xs font-medium">Add Link</span>
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-card text-card-foreground border-border flex items-center gap-2">
             <span>Add Link</span>
             <span className="flex items-center rounded border border-border bg-secondary px-1 text-xs font-semibold text-secondary-foreground">⌘K</span>
          </TooltipContent>
        </Tooltip>

        {}
        <div className="w-px h-5 mx-1.5 bg-border" />

        {}
        <Tooltip>
          <TooltipTrigger asChild>
             {}
            <button
              onClick={() => startStreaming("hey there")} 
              className="flex items-center gap-1 rounded-sm px-2 py-1 transition-colors text-violet-600 hover:bg-violet-500/10" 
            >
              <Sparkles className="h-4 w-4" /> {}
              <span className="text-xs font-medium">Ask AI</span>
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-card text-card-foreground border-border flex items-center gap-2">
            <span>Generate text with AI</span>
             <span className="flex items-center rounded border border-border bg-secondary px-1 text-xs font-semibold text-secondary-foreground">⌘/</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default Toolbar;