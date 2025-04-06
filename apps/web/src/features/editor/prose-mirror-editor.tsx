"use client";

import { useEffect, useRef } from "react";
import { EditorView } from "prosemirror-view";
import { EditorState, TextSelection,} from "prosemirror-state";
import {
  extendedProseMirrorSchema,
  useEditor,
} from "@/providers/editor-context-provider";
import "./prosemirror-styles.css";
import { baseKeymap, chainCommands, deleteSelection, joinBackward, joinTextblockBackward } from "prosemirror-commands"
import { keymap } from "prosemirror-keymap"
import {
  splitListItem, // <--- This command handles Enter
  liftListItem,
  sinkListItem,
} from "prosemirror-schema-list";
import { undo, redo, history } from "prosemirror-history";
import { trailingNode } from 'prosemirror-trailing-node'
import { CodeBlock } from "@/custom-nodes/code-block";
import { InlineCodeNodeView } from "@/custom-nodes/inline-code";

// // // Create an extended schema that includes heading nodes
// // const schema = new Schema({
// //   nodes: addListNodes(basicSchema.spec.nodes, "paragraph block*", "block"),
// //   marks: basicSchema.spec.marks
// // })

// const characterPluginKey = new PluginKey("character-animation");

// // Create our animation plugin
// const characterPlugin = new Plugin({
//   key: characterPluginKey,

//   state: {
//     init() {
//       return {
//         newlyInsertedRanges: [], // Track ranges of inserted content
//       };
//     },

//     apply(tr, value, oldState, newState) {
//       // Reset the tracking if we're not in a transaction chain
//       if (!tr.docChanged) {
//         // Clear animations after they've had time to play
//         if (value.newlyInsertedRanges.length && !tr.getMeta("animating")) {
//           return { newlyInsertedRanges: [] };
//         }
//         return value;
//       }

//       // Track newly inserted content
//       const newRanges = [];
//       tr.mapping.maps.forEach((map) => {
//         map.forEach((oldStart, oldEnd, newStart, newEnd) => {
//           if (newEnd > newStart && oldEnd - oldStart < newEnd - newStart) {
//             // This is an insertion
//             newRanges.push({ from: newStart, to: newEnd });
//           }
//         });
//       });

//       // Map old ranges through the transaction
//       const mappedOldRanges = value.newlyInsertedRanges.map((range) => {
//         return {
//           from: tr.mapping.map(range.from),
//           to: tr.mapping.map(range.to),
//         };
//       });

//       return {
//         newlyInsertedRanges: [...mappedOldRanges, ...newRanges],
//       };
//     },
//   },

//   props: {
//     decorations(state) {
//       const { newlyInsertedRanges } = this.getState(state);
//       if (!newlyInsertedRanges.length) return null;

//       const decorations = [];

//       // For each inserted range, create character-by-character decorations
//       newlyInsertedRanges.forEach((range) => {
//         let charIndex = 0;

//         state.doc.nodesBetween(range.from, range.to, (node, pos) => {
//           if (!node.isText) return true;

//           const startPos = Math.max(range.from, pos);
//           const endPos = Math.min(range.to, pos + node.nodeSize);

//           for (let i = startPos; i < endPos; i++) {
//             if (i >= pos && i < pos + node.text.length) {
//               // Get the actual character
//               const charPos = i - pos;
//               const char = node.text[charPos];

//               // Handle spaces specially
//               const isSpace = char === " ";

//               decorations.push(
//                 Decoration.inline(i, i + 1, {
//                   class: isSpace ? "animated-space" : "animated-char",
//                   style: `
//                                         display: inline-block;
//                                         opacity: 0;
//                                         animation: typeIn 0.1s forwards;
//                                         animation-delay: ${charIndex * 2}ms;
//                                     `,
//                 })
//               );
//               charIndex++;
//             }
//           }

//           return true;
//         });
//       });

//       return DecorationSet.create(state.doc, decorations);
//     },
//   },
// });

// // Our dummy content to insert
// const dummyContent = {
//   type: "doc",
//   content: [
//     {
//       type: "heading",
//       attrs: { level: 1 },
//       content: [
//         {
//           type: "text",
//           text: "The best cursor for docs yeah am sure this is the best cursor for docs with my own touch",
//         },
//       ],
//     },
//   ],
// };

function liftListItemOnlyAtStart(listItemType) {
  return function(state, dispatch, view) {
    const {$head, empty} = state.selection;
    // Condition: Selection must be empty AND cursor must be at offset 0 of its parent block
    if (!empty || $head.parentOffset !== 0) {
      return false; // Fail if cursor is not at start or if text is selected
    }
    // If condition met, try to execute the actual liftListItem command
    // We might need additional checks here if liftListItem itself does more complex things
    // but the core idea is to gate it behind the cursor position check.
    return liftListItem(listItemType)(state, dispatch, view);
  }
}

const listRelatedKeymap = keymap({
  // V V V THIS IS THE IMPORTANT BINDING V V V
  Enter: splitListItem(extendedProseMirrorSchema.nodes.list_item),

  Backspace: chainCommands( deleteSelection, liftListItemOnlyAtStart(extendedProseMirrorSchema.nodes.list_item), joinTextblockBackward)
  // Tab: sinkListItem(/* ... */),
  // ... other list bindings ...
});

// --- Combine all plugins ---
const plugins = [
  history(),
  listRelatedKeymap, // <--- Add the list keymap HERE
  keymap(baseKeymap), // Base keymap handles things list keymap doesn't
  keymap({ // Undo/Redo
      "Mod-z": undo,
      "Mod-y": redo,
      "Shift-Mod-z": redo,
  }),
  // trailingNode({ignoredNodes: ["bullet_list", "list_item", "ordered_list"], nodeName: "paragraph"})
  // ... other plugins ...
];

export const ProseMirrorEditor = () => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const { editorView, setEditorReady, isEditorReady } = useEditor();

  const scrollToBottom = () => {
    if (!editorRef.current) return; // Use editorRef instead of editorView for scrolling

    const container = editorRef.current; // This is your div with overflow-scroll

      container.scrollTop = container.scrollHeight - container.clientHeight + 50
  };

//   useEffect(() => {
//     const style = document.createElement("style");
//     style.textContent = `
//     .ProseMirror {
//         /* Add perspective to the container */
//         perspective: 1000px;
//         transform-style: preserve-3d;
//     }

//     .animated-char {
//         display: inline-block;
//         will-change: transform, opacity;
//         /* Move transform origin up a bit */
//         transform-origin: top center;
//         /* Ensure the character maintains its natural dimensions */
//         vertical-align: baseline;
//         position: relative;
//     }

//     @keyframes typeIn {
//         from {
//             opacity: 0;
//             /* Use a gentler transform that won't stretch */
//             transform: translateY(8px) rotateX(30deg) scale(0.95);
//         }
//         to {
//             opacity: 1;
//             transform: translateY(0) rotateX(0) scale(1);
//         }
//     }

//     /* Special handling for spaces to maintain consistent width */
//     .animated-space {
//         display: inline-block;
//         width: 0.25em;
//         white-space: pre;
//         position: relative;
//     }
// `;
//     document.head.appendChild(style);
//     return () => style.remove();
//   }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      schema: extendedProseMirrorSchema,
      plugins: plugins,
    });

    if (!editorView.current && editorRef.current) {
      editorView.current = new EditorView(editorRef.current, {
        state,
        nodeViews: {
          code_block: (node, view, getPos) => {
            return new CodeBlock(node, view, getPos)
          },
        },
        dispatchTransaction: (transaction) => {
          // Get the state *before* this transaction is applied.
          // We need this to apply our *final* transaction correctly.
          const originalState = editorView.current.state;
      
          // Check the incoming transaction to see if it matches our trigger pattern
          const endPos = transaction.selection.$head.pos;
          const pos = transaction.doc.resolve(endPos);
          const textBefore = transaction.doc.textBetween(Math.max(0, endPos - 2), endPos);
      
          // Condition: Is it a paragraph? Does it end with "-h"? Is the cursor right after "-h"?
          // NOTE: We are checking the state *after* the original transaction (containing '-h') would be applied.
          if (textBefore === "-h" && pos.parent.type.name === "paragraph" && pos.parentOffset === 2) {
              console.log("Creating bullet list");
      
              // --- Create a NEW transaction starting from the ORIGINAL state ---
              // This is generally cleaner than modifying the incoming one for complex replacements.
              let newTr = originalState.tr;
      
              // Calculate the range in the *original state* to replace.
              // This is the range containing just the "-" before 'h' was typed.
              const replaceStart = originalState.selection.$head.pos - 1; // Position of '-'
              const replaceEnd = originalState.selection.$head.pos;       // Position after '-'
      
              // Create the list structure WITH content in the paragraph
              const schema = originalState.schema;
              const zeroWidthSpace = schema.text("\u200B"); // Zero-width space is ideal!
              const paragraphNode = schema.nodes.paragraph.create(null, [zeroWidthSpace]);
              const listItemNode = schema.nodes.list_item.create(null, [paragraphNode]);
              const bulletListNode = schema.nodes.bullet_list.create(null, [listItemNode]);
      
              // Replace the "-" character with the entire bullet list structure
              newTr = newTr.replaceWith(replaceStart, replaceEnd, bulletListNode);
      
              // Calculate the new cursor position:
              // replaceStart is where the bulletList node begins.
              // +1 to enter bullet_list `<ul>`
              // +1 to enter list_item `<li>`
              // +1 to enter paragraph `<p>`
              // +1 to be *after* the zero-width space `\u200B`
              const newCursorPos = replaceStart + 4;
      
              // Set the selection explicitly in our new transaction
              newTr = newTr.setSelection(TextSelection.create(newTr.doc, newCursorPos));
      
              // --- Dispatch OUR transaction INSTEAD of the original one ---
              editorView.current.dispatch(newTr);

              console.log("NEW TR IS: ", newTr)
      
              if (newTr.docChanged) {
                  requestAnimationFrame(scrollToBottom); // Use requestAnimationFrame
              }
      
          } else {
              // --- Condition not met: Apply the original transaction as usual ---
              const newState = originalState.apply(transaction);
              editorView.current.updateState(newState);
      
              if (transaction.docChanged) {
                  requestAnimationFrame(scrollToBottom); // Use requestAnimationFrame
              }
          }
      },
      });

      setEditorReady(true);
    }

    return () => {
      if (editorView.current) {
        editorView.current.destroy();
        editorView.current = null;
        setEditorReady(false);
      }
    };
  }, [editorView, setEditorReady]);

  useEffect(() => {
    if (editorView.current && isEditorReady) {
      setTimeout(() => {
        editorView.current.focus();
      }, 1000);
    }
  }, [isEditorReady]);

  return (
    <div className="flex flex-col w-full h-full">
      <div
        className="prosemirror-editor w-full max-h-[calc(100vh - 60px)] h-full overflow-scroll py-2 px-4 border-t border-neutral-400 outline-none"
        ref={editorRef}
      />
      {/* <StreamingMarkdownDemo /> */}
    </div>
  );
};
