import { FileText, MessageSquare, Edit} from 'lucide-react';

export const ChatModeEmptyContent = () => {
  return (
    <div className="flex flex-col h-full bg-[var(--color-palette-beige-2)] text-[#073642]">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col space-y-4">
          {/* Welcome Header */}
          <div className="text-2xl font-medium mb-2 text-[#073642] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[var(--color-palette-gold)]" />
            Chat Mode
          </div>
          
          <p className="text-sm text-[var(--color-palette-dark)] mb-4">
            Chat with Wrisor about anything, including your document. In Chat Mode, Wrisor can analyze your document but cannot make edits directly.
          </p>
          
          {/* Main Feature Card */}
          <div className="bg-[var(--color-palette-beige-1)] border border-[var(--color-palette-gold-light)] rounded-lg p-5 mb-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-[var(--color-palette-gold)] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-[#073642] mb-2">Document-Aware Assistance</h3>
                <p className="text-sm text-[var(--color-palette-dark)]">
                  Wrisor has full access to your document's content but in read-only mode. For direct edits, switch to Composer Mode.
                </p>
              </div>
            </div>
          </div>
          </div>
          
          {/* Mode Comparison */}
          <div className="bg-[var(--color-palette-beige-1)] border border-[var(--color-palette-gold-light)] rounded-lg p-4">
            <h3 className="font-medium text-[#073642] mb-3">Chat Mode vs. Composer Mode</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-palette-cream)] p-3 rounded-md border border-[var(--color-palette-gold-light)]">
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
              <div className="bg-[var(--color-palette-cream)] p-3 rounded-md border border-[var(--color-palette-gold-light)] opacity-80">
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
              Switch to Composer Mode using the tabs above when you're ready to edit your document.
            </div>
          </div>
        </div>
      </div>
  );
};