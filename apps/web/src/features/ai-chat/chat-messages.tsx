import React from "react";
import type { Message } from "@/types/messages";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessagesProps {
  messages: Message[];
}

// Component for user messages
const UserMessage = ({ content }: { content: string }) => {
  return (
    <div className="flex items-start justify-end">
      <div className="flex-shrink-0 mr-3">
        <div className="w-6 h-6 rounded-full p-0 bg-primary/40 flex items-center justify-center text-[10px] font-medium">
          Me
        </div>
      </div>
      <div className="bg-background shadow-sm py-2 px-4 rounded-sm text-sm max-w-[95%]">
        {content}
      </div>
    </div>
  );
};

// Component for AI/LLM messages
const AIMessage = ({ content }: { content: string }) => {
  return (
    <div className="flex flex-col justify-start gap-2">
      <div className="flex items-center px-2">
        <div className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
          Wrisor
        </div>
      </div>
      <div className="bg-[var(--color-palette-beige-3)] px-4 text-sm max-w-[95%] rounded-lg">
        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <div className="overflow-x-auto my-4">
                    <SyntaxHighlighter
                      language={match[1]}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.25rem",
                        fontSize: "0.875rem",
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code
                    className="bg-[var(--color-palette-beige-4)] px-1 py-0.5 rounded text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              p({ children, ...props }) {
                return (
                  <p
                    className="mb-4 whitespace-pre-line overflow-wrap-break-word"
                    {...props}
                  >
                    {children}
                  </p>
                );
              },
              h1({ children, ...props }) {
                return (
                  <h1 className="text-xl font-bold mt-6 mb-4" {...props}>
                    {children}
                  </h1>
                );
              },
              h2({ children, ...props }) {
                return (
                  <h2 className="text-lg font-bold mt-5 mb-3" {...props}>
                    {children}
                  </h2>
                );
              },
              h3({ children, ...props }) {
                return (
                  <h3 className="text-base font-bold mt-4 mb-2" {...props}>
                    {children}
                  </h3>
                );
              },
              ul({ children, ...props }) {
                return (
                  <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
                    {children}
                  </ul>
                );
              },
              ol({ children, ...props }) {
                return (
                  <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
                    {children}
                  </ol>
                );
              },
              li({ children, ...props }) {
                return (
                  <li className="mb-1" {...props}>
                    {children}
                  </li>
                );
              },
              blockquote({ children, ...props }) {
                return (
                  <blockquote
                    className="border-l-2 border-[var(--color-palette-gold-dark)] pl-4 my-4 italic"
                    {...props}
                  >
                    {children}
                  </blockquote>
                );
              },
              a({ children, href, ...props }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              strong({ children, ...props }) {
                return (
                  <strong className="font-bold" {...props}>
                    {children}
                  </strong>
                );
              },
              em({ children, ...props }) {
                return (
                  <em className="italic" {...props}>
                    {children}
                  </em>
                );
              },
              table({ children, ...props }) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table
                      className="min-w-full divide-y divide-gray-300 border border-gray-300"
                      {...props}
                    >
                      {children}
                    </table>
                  </div>
                );
              },
              pre({ children, ...props }) {
                return (
                  <pre
                    className="overflow-x-auto min-w-full w-[300px]"
                    {...props}
                  >
                    {children}
                  </pre>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  if (messages.length === 0) {
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
    <div className="space-y-6 py-4">
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.role === "user" ? (
            <UserMessage content={msg.content} />
          ) : (
            <AIMessage content={msg.content} />
          )}
        </div>
      ))}
    </div>
  );
};
