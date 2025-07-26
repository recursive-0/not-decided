import { transformText } from "@/api/transform-text";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/custom-toasts";
import { Textarea } from "@/components/ui/textarea";
import { useChatHandler } from "@/hooks/use-chat-handler";
import { handleTransformSelection } from "@/lib/handle-transform-selection";
import { getContextAroundCursor, lockEditor, unlockEditor } from "@/lib/misc-editor-helpers";
import { useEditor } from "@/providers/editor-context-provider";
import { useUIStore } from "@/store/ui";
import { useWrisorStore } from "@/store/wrisor";
import "@/styles/suggestion-navigation.css";
import { useMutation } from "@tanstack/react-query";
import { CornerDownLeft, SquarePen, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../../styles/suggestion-highlight-plugin.css";
import "./external-dialogs.css";
import "./prosemirror-styles.css";

export const AiTransformDialog = ({ clientX, clientY, onClose }) => {
  const [input, setInput] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef(null);
  const { editorView } = useEditor();

  const { isStreaming, handleSelectionQuery } = useChatHandler();
  const { totalCurrentEdits, setTotalCurrentEdits } = useWrisorStore();
  const { startTransformation, endTransformation } = useUIStore();

  const transformTextMutation = useMutation({
    mutationFn: () => {
      startTransformation();
      lockEditor(editorView.current!);
      const prompt = input.trim();
      return transformText({
        prompt,
        cursorContext: getContextAroundCursor(editorView.current!.state)
      });
    },
    onSuccess: (data) => {
      const { transformedText } = data;
      console.log("transformed text is: ", transformedText);
      const view = editorView.current!;
      handleTransformSelection({
        editorView: view,
        transformedText,
      })
      endTransformation();
      unlockEditor(editorView.current!);
      setTotalCurrentEdits(totalCurrentEdits + 1);
    },
    onError: (error) => {
      console.log("error while transforming text", error);
      toast({
        title: "Failed to transform text",
        description: "Please try again",
        variant: "error",
      });
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        event.target &&
        event.target instanceof Node &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (totalCurrentEdits > 0) {
        toast({
          title: "You have pending changes!",
          description:
            "Please apply or discard your changes before generating a new response.",
          variant: "warning",
        });
        return;
      }
      if (input.trim() && !isStreaming) {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (input.trim() && !isStreaming) {
      if (editorView.current!.state.selection.empty) {
        const { from, to } = editorView.current!.state.selection;
        const selectedText = editorView.current!.state.doc.textBetween(
          from,
          to
        );
        handleSelectionQuery(selectedText, input.trim());
      } else {
        transformTextMutation.mutate();
      }
      setInput("");
      onClose();
    }
  };

  return (
    <div
      ref={dialogRef}
      className="absolute z-50 bg-white rounded-md shadow-lg border border-border"
      style={{
        left: `${clientX}px`,
        top: `${clientY}px`,
        width: "300px",
      }}
    >
      <div className="p-2 px-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-row gap-2 items-center">
            <SquarePen className="w-3 h-3 text-muted" />
            <span className="text-muted-foreground text-sm">Transform Document</span>
          </div>
          <Button
            onClick={onClose}
            variant="default"
            className="!py-1 !px-0 h-fit !w-fit-content bg-transparent shadow-none hover:bg-transparent cursor-pointer"
          >
            <X className="w-2 h-2 text-layer-0 hover:text-layer-10" />
          </Button>
        </div>
        <div className="relative flex flex-col items-start">
          <Textarea
            autoFocus
            ref={textareaRef}
            placeholder="Improve this section, rewrite this, etc."
            className="flex-1 text-sm rounded-md resize-none border border-border
            text-muted-foreground placeholder:text-muted-foreground/80
            pr-8 py-2 min-h-[70px] max-h-[100px] overflow-y-scroll bg-transparent shadow-none
            focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:shadow-md focus-visible:border-border
            "
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={2}
          />
          <div
            className={`absolute right-2 top-2 flex items-center justify-center w-6 h-6 
                ${
                  !input.trim() || isStreaming
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:text-blue-500"
                }`}
            onClick={input.trim() && !isStreaming ? handleSubmit : undefined}
            aria-label="Send command"
          >
            <CornerDownLeft className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
