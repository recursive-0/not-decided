import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Sparkles,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  HighlighterIcon,
  Type,
} from 'lucide-react';
import { useEditor } from '@/providers/editor-context-provider';
import { 
  boldText, 
  italicizeText, 
  strikethroughText, 
  underlineText,
  superscriptText,
  subscriptText,
  setTextColor,
  setHighlightColor,
  applyHeading,
  toggleBlockquote,
  toggleList,
  insertLink
} from '@/lib/prosemirror-tool-handlers';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Expanded types for all formatting options
type TextFormatType = "bold" | "italic" | "underline" | "strikethrough" | "superscript" | "subscript";
type BlockType = "heading1" | "heading2" | "heading3" | "paragraph" | "bulletList" | "orderedList" | "blockquote";

// Format options for basic text styling
const textFormatOptions = [
  { id: 'bold', icon: Bold, label: 'Bold', shortcut: '⌘B' },
  { id: 'italic', icon: Italic, label: 'Italic', shortcut: '⌘I' },
  { id: 'underline', icon: Underline, label: 'Underline', shortcut: '⌘U' },
  { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', shortcut: '⌘⇧X' },
  // { id: 'superscript', icon: Superscript, label: 'Superscript' },
  // { id: 'subscript', icon: Subscript, label: 'Subscript' },
];

// // Alignment options
// const alignmentOptions = [
//   { id: 'alignLeft', icon: AlignLeft, label: 'Align Left', shortcut: '⌘⇧L' },
//   { id: 'alignCenter', icon: AlignCenter, label: 'Align Center', shortcut: '⌘⇧E' },
//   { id: 'alignRight', icon: AlignRight, label: 'Align Right', shortcut: '⌘⇧R' },
//   { id: 'alignJustify', icon: AlignJustify, label: 'Justify', shortcut: '⌘⇧J' },
// ];

// Heading and block options
const blockOptions = [
  { id: 'heading1', icon: Heading1, label: 'Heading 1', shortcut: '⌘⌥1' },
  { id: 'heading2', icon: Heading2, label: 'Heading 2', shortcut: '⌘⌥2' },
  { id: 'heading3', icon: Heading3, label: 'Heading 3', shortcut: '⌘⌥3' },
  { id: 'paragraph', icon: Type, label: 'Normal Text', shortcut: '⌘⌥0' },
  { id: 'bulletList', icon: List, label: 'Bullet List', shortcut: '⌘⇧8' },
  { id: 'orderedList', icon: ListOrdered, label: 'Numbered List', shortcut: '⌘⇧7' },
  { id: 'blockquote', icon: Quote, label: 'Quote', shortcut: '⌘⇧B' },
];

// Color options
const textColorOptions = [
  { color: '#000000', label: 'Black' },
  { color: '#555555', label: 'Dark Gray' },
  { color: '#FF0000', label: 'Red' },
  { color: '#0000FF', label: 'Blue' },
  { color: '#008000', label: 'Green' },
  { color: '#FFA500', label: 'Orange' },
  { color: '#800080', label: 'Purple' },
];

const highlightOptions = [
  { color: '#FFFF00', label: 'Yellow' },
  { color: '#00FFFF', label: 'Cyan' },
  { color: '#FF00FF', label: 'Magenta' },
  { color: '#90EE90', label: 'Light Green' },
  { color: '#FFD700', label: 'Gold' },
  { color: '#F08080', label: 'Light Coral' },
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
              : "text-[#073642] hover:bg-background hover:shadow-md" 
          )}
          onClick={onClick}
          aria-label={label} 
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
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

const ColorButton = ({ 
  icon: Icon, 
  options, 
  onSelect 
}: { 
  icon: React.ElementType; 
  label: string; 
  options: Array<{ color: string; label: string }>; 
  onSelect: (color: string) => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-sm p-1.5 transition-colors text-[#073642] hover:bg-secondary/50">
          <Icon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
       style={{
        backgroundColor: "var(--color-palette-beige-2)"
      }}
      className="w-48">
        <div className="grid grid-cols-4 gap-1 p-0.5">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.color}
              className="flex flex-col items-center justify-center hover:!bg-primary/80 py-1 px-1"
              onClick={() => onSelect(option.color)}
            >
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: option.color, border: '1px solid #ccc' }}
                title={option.label}
              />
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Toolbar = () => {
  const [activeTextFormats, setActiveTextFormats] = useState<TextFormatType[]>([]);
  const [activeBlockType, setActiveBlockType] = useState<BlockType>("paragraph");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const { editorView } = useEditor();

    // Update the handleInsertLink function
    const handleInsertLink = () => {
      setLinkDialogOpen(true);
    };
  
    // Add this function to insert the link into the editor
    const handleAddLink = () => {
      // This function will need to be implemented based on your editor's API
      // For example, it might look something like this:
      insertLink(editorView.current!, linkText, linkUrl);
      
      // Close the dialog and reset fields
      setLinkDialogOpen(false);
      setLinkText("");
      setLinkUrl("");
    };

  // Handler for text formatting options
  const toggleTextFormat = (format: TextFormatType) => {
    const isAlreadySelected = activeTextFormats.includes(format);

    switch(format) {
      case "bold":
        boldText(editorView.current!, !isAlreadySelected);
        break;
      case "italic":
        italicizeText(editorView.current!, !isAlreadySelected);
        break;
      case "underline":
        underlineText(editorView.current!, !isAlreadySelected);
        break;
      case "strikethrough":
        strikethroughText(editorView.current!, !isAlreadySelected);
        break;
      case "superscript":
        superscriptText(editorView.current!, !isAlreadySelected);
        break;
      case "subscript":
        subscriptText(editorView.current!, !isAlreadySelected);
        break;
      default:
        break;
    }
    
    // Update active formats
    setActiveTextFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const renderActiveBlockIcon = () => {
    switch (activeBlockType){
      case "blockquote":
        return <Quote className="h-4 w-4" />
      case "bulletList":
        return <List className='h-4 w-4' />
      case "heading1":
        return <Heading1 className='h-4 w-4' />
      case "heading2":
        return <Heading2 className='h-4 w-4' />
      case "heading3":
        return <Heading3 className='h-4 w-4' />
      case "orderedList":
        return <ListOrdered className='h-4 w-4' />
      case "paragraph":
        return <Type className='h-4 w-4' />
    }
  }

  // Handler for block formatting
  const setBlockFormat = (blockType: BlockType) => {
    if(!editorView.current) return

    switch(blockType) {
      case "heading1":
        applyHeading(editorView.current, 1);
        break;
      case "heading2":
        applyHeading(editorView.current, 2);
        break;
      case "heading3":
        applyHeading(editorView.current, 3);
        break;
      case "paragraph":
        applyHeading(editorView.current, 0); // 0 = paragraph
        break;
      case "bulletList":
        toggleList(editorView.current, 'bullet_list');
        break;
      case "orderedList":
        toggleList(editorView.current, 'ordered_list');
        break;
      case "blockquote":
        toggleBlockquote(editorView.current);
        break;
      default:
        break;
    }
    
    setActiveBlockType(blockType);
    setTimeout(() => {
      editorView.current!.focus()
    }, 200)
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-10 w-full flex items-center justify-center bg-background px-2 py-1.5 gap-1">

        {/* Block formatting section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 rounded-sm px-2 py-1 transition-colors text-[#073642] hover:bg-secondary/50">
              {renderActiveBlockIcon()}
              <span className="text-xs font-medium">{activeBlockType}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
          style={{
            backgroundColor: "var(--color-palette-beige-2)"
          }}
          className='bg-palette-gold-light'>
            {blockOptions.map((option) => (
              <DropdownMenuItem 
              className='hover:!bg-primary/80'
                key={option.id}
                onClick={() => setBlockFormat(option.id as BlockType)}
              >
                <div className="flex items-center gap-2">
                  <option.icon className="h-4 w-4" />
                  <span>{option.label}</span>
                  {option.shortcut && (
                    <span className="ml-auto text-xs text-muted-foreground">{option.shortcut}</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

          {/* Divider */}
          <div className="w-px h-5 mx-1.5 bg-border" />
        {/* Text formatting section */}
        <div className="flex items-center gap-0.5">
          {textFormatOptions.map((option) => (
            <FormatButton
              key={option.id}
              icon={option.icon}
              label={option.label}
              shortcut={option.shortcut}
              active={activeTextFormats.includes(option.id as TextFormatType)}
              onClick={() => toggleTextFormat(option.id as TextFormatType)}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 mx-1.5 bg-border" />
        
        {/* Color options */}
        <div className="flex items-center gap-0.5">
          <ColorButton
            icon={Type}
            label="Text Color"
            options={textColorOptions}
            onSelect={(color) => setTextColor(editorView.current!, color)}
          />
          <ColorButton
            icon={HighlighterIcon}
            label="Highlight Color"
            options={highlightOptions}
            onSelect={(color) => setHighlightColor(editorView.current!, color)}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-5 mx-1.5 bg-border" />

        {/* Divider */}
        {/* <div className="w-px h-5 mx-1.5 bg-border" /> */}
        
        {/* Indentation controls */}
        {/* <div className="flex items-center gap-0.5">
          <FormatButton
            icon={Outdent}
            label="Decrease Indent"
            shortcut="⌘["
            active={false}
            onClick={() => console.log("Decrease indent not implemented")}
          />
          <FormatButton
            icon={Indent}
            label="Increase Indent"
            shortcut="⌘]"
            active={false}
            onClick={() => console.log("Increase indent not implemented")}
          />
        </div> */}

        {/* Divider */}
        {/* <div className="w-px h-5 mx-1.5 bg-border" /> */}
        
        {/* Link section */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
            onClick={handleInsertLink}
            className="flex items-center gap-1 rounded-sm px-2 py-1 transition-colors text-[#073642] hover:bg-secondary/50">
              <Link className="h-4 w-4" />
              <span className="text-xs font-medium">Add Link</span>
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-card text-card-foreground border-border flex items-center gap-2">
             <span>Add Link</span>
             <span className="flex items-center rounded border border-border bg-secondary px-1 text-xs font-semibold text-secondary-foreground">⌘K</span>
          </TooltipContent>
        </Tooltip>

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Link</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                {/* <label htmlFor="linkText" className="text-right text-sm font-medium">
                  Text
                </label> */}
                <Input
                  id="linkText"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="col-span-3 bg-palette-beige-1 border-border"
                  placeholder='Link Text'
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                {/* <label htmlFor="linkUrl" className="text-right text-sm font-medium">
                  URL
                </label> */}
                <Input
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="col-span-3 bg-palette-beige-1 border-border"
                  placeholder="https://link.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleAddLink}>
                Add Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Divider */}
        <div className="w-px h-5 mx-1.5 bg-border" />
        
        {/* AI section - kept as is */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex items-center gap-1 rounded-sm px-2 py-1 transition-colors text-violet-600 hover:bg-violet-500/10" 
            >
              <Sparkles className="h-4 w-4" />
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