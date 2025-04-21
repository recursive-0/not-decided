import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChatHandler } from "@/hooks/use-chat-handler";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import "./lock-feedback.css";

export const LockFeedbackOverlay = () => {
//   const { isStreaming } = useChatHandler();
    const isStreaming = false
  const [showLockFeedback, setShowLockFeedback] = useState(false);
  const feedbackTimeoutRef = useRef<Timer | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const preventScroll = useCallback(
    (event: WheelEvent | TouchEvent) => {
      event.stopImmediatePropagation();

      if (isStreaming) {
        event.preventDefault();
      }
    },
    [isStreaming]
  );

  useEffect(() => {
    const element = overlayRef.current;
    if (element && isStreaming) {
      element.addEventListener("wheel", preventScroll, { passive: false });
      element.addEventListener("touchmove", preventScroll, { passive: false });
      return () => {
        element.removeEventListener("wheel", preventScroll);
        element.removeEventListener("touchmove", preventScroll);
      };
    }
  }, [isStreaming, preventScroll]);

  const triggerFeedback = useCallback(
    (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
      if (isStreaming) {
        setShowLockFeedback(true);
        if (feedbackTimeoutRef.current)
          clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => {
          setShowLockFeedback(false);
          feedbackTimeoutRef.current = null;
        }, 1500);
      }
    },
    [isStreaming]
  );

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isStreaming && showLockFeedback) setShowLockFeedback(false);
  }, [isStreaming, showLockFeedback]);

  if (!isStreaming) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className={cn(
        "absolute inset-0 z-[100] cursor-not-allowed",
        "bg-light-mushroom/10 backdrop-blur-[1px]",
        "transition-opacity duration-200 ease-in-out"
      )}
      onClick={(e) => triggerFeedback(e)}
      onTouchStart={(e) => triggerFeedback(e)}
      onKeyDown={(e) => triggerFeedback(e)}
      tabIndex={-1}
      aria-label="Editor interactions locked during AI generation"
      role="presentation"
    >
      {}
      {showLockFeedback && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center z-[110]",
            "pointer-events-none",
            "transition-opacity duration-300 ease-in-out",
            showLockFeedback ? "opacity-100" : "opacity-0"
          )}
          aria-live="polite"
        >
          <div className="bg-palette-beige-1 text-white py-2 px-4 rounded-[10px] flex items-center space-x-2.5">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-[3px] bg-forest-teal/20 opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-[3px] bg-forest-teal"></span>
            </span>
            <span className="text-sm font-medium text-forest-teal/60">
              Hold on! Wrisor is writing
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
