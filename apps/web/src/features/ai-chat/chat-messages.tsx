import React from "react";
import type { Message } from "@/types/messgaes"; // Adjust path as needed
import { cn } from "@/lib/utils"; // Adjust path as needed
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// Choose your desired theme, e.g., vscDarkPlus
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
// Or import another theme like:
// import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessagesProps {
  messages: Message[]; // Ensure your Message type includes an 'id' field
}

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  if (messages.length === 0) {
    // Display placeholder when there are no messages
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-center">
          <p className="mb-1">No messages yet</p>
          <p className="text-xs">Start a conversation to see messages here</p>
        </div>
      </div>
    );
  }

  return (
    // Container for all messages with vertical spacing
    <div className="space-y-6 py-4 w-full">
      {messages.map((message) => (
        <div
          key={message.id} // Use unique message ID as key
          className="flex flex-col space-y-2" // Stack elements vertically
        >
          {/* Individual message bubble */}
          <div
            className={cn(
              "px-4 py-3 rounded-lg text-sm", // Base styling
              // Apply different background and alignment based on role
              message.role === "user"
                ? "bg-[var(--color-palette-gold-light)] ml-auto self-start" // User message aligned right
                : "bg-[var(--color-palette-beige-3)] self-start" // Assistant/echo message aligned left
            )}
            style={{
              maxWidth: "90%", // Limit max width to prevent full screen width
              // width: 'auto' // Allow bubble to size naturally (might not be needed with self-start)
            }}
          >
            {/* Prose container for Tailwind Typography styling, limiting max width */}
            <div className="prose prose-sm dark:prose-invert max-w-none break-words"> {/* Changed max-w-full to max-w-none for prose */}
              <ReactMarkdown
                components={{
                  // Override 'code' element rendering
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");

                    // Determine if it's a code block vs inline code
                    const isCodeBlock =
                      node?.position?.start.line !== node?.position?.end.line || // Multi-line content
                      className?.includes("language-") || // Has language class
                      String(children).includes("\n"); // Contains newline characters explicitly

                    // Render code blocks with SyntaxHighlighter
                    if (isCodeBlock && match?.[1]) { // Ensure match[1] (language) exists
                      return (
                        // Container for code block: isolates from prose, enables scrolling
                        <div className="not-prose max-w-full overflow-x-auto rounded bg-gray-800 my-3"> {/* Using a dark bg for contrast */}
                          <SyntaxHighlighter
                            language={match[1]}
                            style={vscDarkPlus} // Apply chosen theme
                            // Custom styles for the highlighter component
                            customStyle={{
                              margin: 0, // Remove default margins
                              padding: '1rem', // Add internal padding
                              borderRadius: "0.25rem", // Optional: match container rounding
                              fontSize: "0.875rem", // Tailwind 'text-sm' equivalent
                              whiteSpace: "pre", // CRITICAL: Prevent wrapping, enable horizontal scroll
                            }}
                            {...props} // Spread remaining props
                          >
                            {/* Render code content, remove trailing newline */}
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }

                    // Render inline code differently
                    return (
                      <code
                        // Isolate from prose if needed, apply inline styling
                        className="not-prose bg-[var(--color-palette-beige-4)] px-1 py-0.5 rounded text-xs break-words" // Use break-words for inline
                        {...props} // Spread remaining props
                      >
                        {children}
                      </code>
                    );
                  },
                  // Override 'p' (paragraph) elements
                  p({ children }) {
                    // Add bottom margin, remove margin for the last paragraph in a sequence
                    return <p className="mb-3 last:mb-0 break-words">{children}</p>;
                  },
                  // Override 'ul' (unordered list) elements
                  ul({ children }) {
                    // Apply list style, padding, and margins
                    return <ul className="list-disc pl-6 mb-3 last:mb-0">{children}</ul>;
                  },
                  // Override 'ol' (ordered list) elements
                  ol({ children }) {
                    // Apply list style, padding, and margins
                    return <ol className="list-decimal pl-6 mb-3 last:mb-0">{children}</ol>;
                  },
                  // Override 'li' (list item) elements
                  li({ children }) {
                    // Apply bottom margin to list items
                    return <li className="mb-1 last:mb-0">{children}</li>;
                  },
                  // Override 'blockquote' elements
                  blockquote({ children }) {
                    // Apply border, padding, and italic style
                    return (
                      <blockquote className="border-l-2 border-[var(--color-palette-gold-dark)] pl-4 italic my-3"> {/* Added vertical margin */}
                        {children}
                      </blockquote>
                    );
                  },
                  // Override 'a' (anchor/link) elements
                  a({ children, href }) {
                    // Style links, open in new tab safely
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-words" // Style links
                      >
                        {children}
                      </a>
                    );
                  },
                  // Override 'table' elements
                  table({ children }) {
                    // Add scrolling container for tables that might overflow
                    return (
                      <div className="overflow-x-auto max-w-full my-3"> {/* Added vertical margin */}
                        <table className="min-w-fit divide-y divide-[var(--color-palette-beige-4)] border border-[var(--color-palette-beige-4)]">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  // Override 'thead', 'tbody', 'tr', 'th', 'td' if needed for specific table styling
                  // Example:
                  // th({ children }) {
                  //   return <th className="px-4 py-2 text-left font-medium bg-[var(--color-palette-beige-3)]">{children}</th>;
                  // },
                  // td({ children }) {
                  //   return <td className="px-4 py-2">{children}</td>;
                  // }
                }}
              >
                {/* The markdown content from the message */}
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};