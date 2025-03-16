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
  Command
} from 'lucide-react';
import { useSSEStream } from '@/hooks/use-sse-stream';

// Define formatting options
const formatOptions = [
  { id: 'bold', icon: Bold, label: 'Bold', shortcut: '⌘B' },
  { id: 'italic', icon: Italic, label: 'Italic', shortcut: '⌘I' },
  { id: 'underline', icon: Underline, label: 'Underline', shortcut: '⌘U' },
  { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', shortcut: '⌘⇧X' },
];

// Define alignment options
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
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

const FormatButton = ({ 
  icon: Icon, 
  label, 
  shortcut, 
  active, 
  onClick,
  onMouseEnter,
  onMouseLeave
}: FormatButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "rounded-md p-3 transition-colors",
            active 
              ? "bg-slate-200 text-slate-900" 
              : "text-slate-700 hover:bg-slate-100"
          )}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <Icon className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut && (
          <span className="flex items-center rounded border px-1 text-xs font-semibold">
            {shortcut}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

const Toolbar = () => {
  const [activeFormats, setActiveFormats] = useState<string[]>(['italic']);
  const [selectedFormat, setSelectedFormat] = useState<string | null>('italic');
  const [showFloatingTooltip, setShowFloatingTooltip] = useState(true);
  const { startStreaming } = useSSEStream()

  const toggleFormat = (format: string) => {
    setActiveFormats(prev => 
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleMouseEnter = (format: string) => {
    setSelectedFormat(format);
    setShowFloatingTooltip(true);
  };

  const handleMouseLeave = () => {
    // Keep the tooltip visible for italic by default
    setSelectedFormat('italic');
  };

  // Find the format option based on selected format
  const selectedFormatOption = [...formatOptions, ...alignmentOptions].find(
    option => option.id === selectedFormat
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative w-full flex justify-center">

        <div className="flex items-center bg-white rounded-lg shadow-md border border-slate-200 mt-4 p-1 px-2 gap-2 overflow-hidden">
          {/* Text formatting options */}
          <div className="flex bg-white">
            {formatOptions.map((option) => (
              <FormatButton
                key={option.id}
                icon={option.icon}
                label={option.label}
                shortcut={option.shortcut}
                active={activeFormats.includes(option.id)}
                onClick={() => toggleFormat(option.id)}
                onMouseEnter={() => handleMouseEnter(option.id)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
          </div>

          <div className="w-px h-8 mx-1 bg-slate-200" />

          {/* Alignment Options */}
          <div className="flex">
            {alignmentOptions.map((option) => (
              <FormatButton
                key={option.id}
                icon={option.icon}
                label={option.label}
                shortcut={option.shortcut}
                active={activeFormats.includes(option.id)}
                onClick={() => toggleFormat(option.id)}
                onMouseEnter={() => handleMouseEnter(option.id)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
          </div>

          <div className="w-px h-8 mx-1 bg-slate-200" />

          {/* Add Link Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-1 rounded-md px-3 py-2 transition-colors text-slate-700 hover:bg-slate-100">
                <Link className="h-5 w-5" />
                <span className="text-sm font-medium">Add Link</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Add Link</span>
              <span className="ml-2 flex items-center rounded border px-1 text-xs font-semibold">⌘K</span>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-8 mx-1 bg-slate-200" />

          {/* Ask AI Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => startStreaming("hey there")} className="flex items-center gap-1 rounded-md px-3 py-2 transition-colors text-purple-600 hover:bg-purple-50">
                <div className="text-lg">✨</div>
                <span className="text-sm font-medium">Ask AI</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Generate text with AI</span>
              <span className="ml-2 flex items-center rounded border px-1 text-xs font-semibold">⌘/</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Toolbar;