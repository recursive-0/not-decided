import { Edit, MessageSquare, PenTool } from 'lucide-react';

export const ComposerModeEmptyContent = () => {
  return (
    <div className="flex flex-col h-full bg-[var(--color-palette-beige-2)] text-[#073642]">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col space-y-4">
          {/* Welcome Header */}
          <div className="text-2xl font-medium mb-2 text-[#073642] flex items-center gap-2">
            <Edit className="w-6 h-6 text-[var(--color-palette-salmon)]" />
            Composer Mode
          </div>
          
          <p className="text-sm text-[var(--color-palette-dark)] mb-4">
            Composer edits your document directly and knows its current content. Ask it to write, edit, or summarize sections of your document.
          </p>
          
          {/* Main Feature Card */}
          <div className="bg-[var(--color-palette-beige-1)] border border-[var(--color-palette-gold-light)] rounded-lg p-5 mb-4">
            <div className="flex items-start space-x-3">
              <PenTool className="w-5 h-5 text-[var(--color-palette-salmon)] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-[#073642] mb-2">Direct Document Editing</h3>
                <p className="text-sm text-[var(--color-palette-dark)]">
                  Wrisor can directly edit your document based on your instructions. Simply tell Wrisor what you want to add, change, or improve.
                </p>
              </div>
            </div>
          </div>
          
          {/* Mode Comparison */}
          <div className="bg-[var(--color-palette-beige-1)] border border-[var(--color-palette-gold-light)] rounded-lg p-4">
            <h3 className="font-medium text-[#073642] mb-3">Chat Mode vs. Composer Mode</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-palette-cream)] p-3 rounded-md border border-[var(--color-palette-gold-light)] opacity-80">
                <div className="flex items-center mb-2">
                  <MessageSquare className="w-4 h-4 mr-2 text-[var(--color-palette-gold)]" />
                  <span className="text-sm font-medium">Chat Mode</span>
                </div>
                <p className="text-xs text-[var(--color-palette-dark)]">
                  • Document read-only access<br />
                  • Ask questions about content<br />
                  • Get explanations and analysis<br />
                  • General knowledge assistance
                </p>
              </div>
              <div className="bg-[var(--color-palette-cream)] p-3 rounded-md border border-[var(--color-palette-gold-light)]">
                <div className="flex items-center mb-2">
                  <Edit className="w-4 h-4 mr-2 text-[var(--color-palette-salmon)]" />
                  <span className="text-sm font-medium">Composer Mode</span>
                </div>
                <p className="text-xs text-[var(--color-palette-dark)]">
                  • Direct document editing<br />
                  • Content generation<br />
                  • Formatting and restructuring<br />
                  • Real-time writing assistance
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-[var(--color-palette-dark)] italic">
              Ask the Composer to edit your document using natural language instructions below.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};