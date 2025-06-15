import { transformText } from "@/api/transform-text";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/custom-toasts";
import { Textarea } from "@/components/ui/textarea";
import { useChatHandler } from "@/hooks/use-chat-handler";
import {
  getDocumentContext,
} from "@/lib/doc-helpers";
import { useEditor } from "@/providers/editor-context-provider";
import { useWrisorStore } from "@/store/wrisor";
import "@/styles/suggestion-navigation.css";
import { useMutation } from "@tanstack/react-query";
import { CornerDownLeft, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../../styles/suggestion-highlight-plugin.css";
import "./external-dialogs.css";
import "./prosemirror-styles.css";
import {
  textHighlightPluginKey,
  TextHighlightPluginType,
} from "@/plugins/text-highlight-plugin/text-highlight-plugin";
import { useUIStore } from "@/store/ui";

export const CommandPalette = ({ clientX, clientY, onClose }) => {
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
      const context = getDocumentContext(editorView.current!);
      const { selectedText, surroundingContext, documentContent } = context;
      const prompt = input.trim();
      editorView.current?.setProps({
        editable: () => false,
      });
      return transformText({
        prompt,
        selectedText,
        surroundingContext,
        context: documentContent,
      });
    },
    onSuccess: (data) => {
      const { transformedText } = data;
      console.log("transformed text is: ", transformedText);
      const view = editorView.current!;

      const { from: semanticFrom, to: semanticTo } = editorView.current!.state.selection
      console.log(
        "Semantic selection is: ",
        view.state.doc.textBetween(semanticFrom, semanticTo)
      );
      const originalText = view.state.doc.textBetween(semanticFrom, semanticTo);

      let tr = view.state.tr;
      const textToInsert = transformedText;

      tr = tr.insertText(textToInsert, semanticTo);

      const strikeThroughRange = { from: semanticFrom, to: semanticTo };
      const highlightRange = {
        from: semanticTo,
        to: semanticTo + textToInsert.length,
      };

      const suggestionId =
        Date.now().toString() + Math.random().toString(36).substring(2);

      const metaData: TextHighlightPluginType = {
        action: "show-suggestion",
        strikeThroughRange,
        highlightRange,
        originalText,
        rewrittenText: transformedText,
        suggestionId,
      };

      tr = tr.setMeta(textHighlightPluginKey, metaData);

      // Step 5: Dispatch the coherent, non-contradictory plan.
      view.dispatch(tr);
      endTransformation();
      editorView.current!.setProps({
        editable: () => true,
      });
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
      className="absolute z-50 bg-palette-beige-1 rounded-md shadow-lg border border-neutral-200"
      style={{
        left: `${clientX}px`,
        top: `${clientY}px`,
        width: "300px",
      }}
    >
      <div className="p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-black text-sm">Prompt</span>
          <Button
            onClick={onClose}
            variant="default"
            className="p-0 py-1 px-0 h-fit w-fit "
          >
            <X />
          </Button>
        </div>
        <div className="relative flex flex-col items-start">
          <Textarea
            autoFocus
            ref={textareaRef}
            placeholder="Improve this section, rewrite this, etc."
            className="flex-1 text-sm rounded-md resize-none overflow-scroll border border-neutral-200
                text-palette-dark placeholder:text-neutral-400
                pr-8 py-2 min-h-[38px] max-h-[150px]"
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
