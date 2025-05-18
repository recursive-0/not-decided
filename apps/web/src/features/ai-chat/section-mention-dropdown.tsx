import { extractSectionsFromEditor } from "@/lib/misc-editor-helpers";
import { FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const SectionMentionDropdown = ({ 
    editorView,
    isVisible, 
    onSelect, 
    onClose, 
  }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const dropdownRef = useRef(null);

    console.log("inside section dropdown")
    
    // Extract sections only when dropdown is visible
    const sections = isVisible ? extractSectionsFromEditor(editorView) : [];
  
    useEffect(() => {
      if (isVisible) {
        setSelectedIndex(0);
      }
    }, [isVisible]);
  
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (!isVisible) return;
  
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, sections.length - 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
            break;
          case 'Enter':
            e.preventDefault();
            if (sections[selectedIndex]) {
              onSelect(sections[selectedIndex]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            onClose();
            break;
        }
      };
  
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, selectedIndex, sections, onSelect, onClose]);
  
    if (!isVisible) return null;
  
    return (
      <div
        ref={dropdownRef}
        className="absolute z-50 w-80 max-h-64 overflow-y-auto rounded-lg shadow-lg border"
        style={{
          top: '0',
          left: '0',
          transform: 'translateY(-100%) translateY(-8px)',
          backgroundColor: "var(--color-palette-beige-1)",
          borderColor: "var(--color-palette-gold-dark)"
        }}
      >
        <div className="p-2">
          <div 
            className="text-xs font-medium mb-2 px-2"
            style={{
              color: "var(--color-palette-dark)"
            }}
          >
            Select a section to mention
          </div>
          {sections.length > 0 ? (
            sections.map((section, index) => (
              <div
                key={section.id}
                className="flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-all duration-150"
                style={{
                  backgroundColor: index === selectedIndex 
                    ? "var(--color-palette-gold-light)" 
                    : "transparent",
                }}
                onClick={() => onSelect(section)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: section.level === 1 
                          ? "var(--color-palette-gold-light)" 
                          : section.level === 2 
                          ? "var(--color-palette-beige-2)" 
                          : "var(--color-palette-light-cream)",
                        color: "var(--color-palette-dark)"
                      }}
                    >
                      H{section.level}
                    </span>
                    <span 
                      className="text-sm font-medium truncate"
                      style={{
                        color: "var(--color-palette-dark)"
                      }}
                    >
                      {section.text}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div 
              className="p-4 text-center text-sm"
              style={{
                color: "var(--color-palette-dark)"
              }}
            >
              <FileText 
                className="h-8 w-8 mx-auto mb-2 opacity-50" 
                style={{
                  color: "var(--color-palette-light-gray)"
                }}
              />
              No sections found. Add some headings to your document.
            </div>
          )}
        </div>
      </div>
    );
  };