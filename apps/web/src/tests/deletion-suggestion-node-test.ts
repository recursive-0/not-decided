// src/utils/editorTestUtils.ts (or wherever you prefer)

import type { EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model"; // Import Node type

/**
 * Inserts an empty test deletion_suggestion node (with an empty paragraph inside)
 * and then simulates streaming text content into that paragraph.
 *
 * @param view The initialized ProseMirror EditorView instance.
 * @param textToStream The full string of text to simulate streaming.
 * @param chunkDelay Milliseconds delay between each chunk insertion (e.g., 50).
 * @returns A Promise that resolves when streaming is complete, or rejects on error.
 */
export async function streamTestContentInsideSuggestion(
  view: EditorView | null,
  textToStream: string = "This is simulated streaming text, appearing chunk by chunk!",
  chunkDelay: number = 50
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 1. Validate EditorView instance
    if (!view) {
      console.error(
        "streamTestContentInsideSuggestion: Failed because EditorView is null or not provided."
      );
      reject(new Error("EditorView is null or not provided."));
      return;
    }

    console.log(
      "streamTestContentInsideSuggestion: Starting test streaming..."
    );

    let intervalId: NodeJS.Timeout | null = null; // For cleanup
    let suggestionNodePos: number | null = null; // Store position of the container

    try {
      const { state } = view;
      const { schema } = state;

      // 2. Get required node types
      const suggestionNodeType = schema.nodes.deletion_suggestion;
      if (!suggestionNodeType) {
        throw new Error(
          "Node type 'deletion_suggestion' not found in the editor schema!"
        );
      }
      const paragraphNodeType = schema.nodes.paragraph;
      if (!paragraphNodeType) {
        throw new Error(
          "Node type 'paragraph' not found in the editor schema!"
        );
      }

      // 3. Create an EMPTY paragraph for the initial content
      //    (Assumes deletion_suggestion content spec allows/requires a block, like 'block+')
      const emptyParagraph = paragraphNodeType.create();

      // 4. Create the suggestion node WITH the empty paragraph inside
      const suggestionNode = suggestionNodeType.create(
        {
          id: `streaming-test-${Date.now()}`,
          originalNodeType: "STREAMING_TEST_CONTAINER",
          originalAttrs: "{}",
        },
        emptyParagraph // Initial empty content
      );

      // 5. Insert the container node at the end
      const initialInsertPos = state.doc?.content?.size ?? 0;
      let tr = state.tr.insert(initialInsertPos, suggestionNode);
      view.dispatch(tr);

      // --- Get the actual position AFTER insertion ---
      // This is crucial because other transactions might happen.
      // We map the initial position through the transaction that inserted the node.
      suggestionNodePos = tr.mapping.map(initialInsertPos);
      console.log(
        `streamTestContentInsideSuggestion: Inserted container at pos ${suggestionNodePos}`
      );


      // --- Start Streaming Simulation ---
      let currentIndex = 0;
      const textChunks = textToStream.split(" "); // Simple splitting by space for chunks

      intervalId = setInterval(() => {
        if (!view || view.isDestroyed) {
           console.warn("streamTestContentInsideSuggestion: View destroyed, stopping stream.");
           if (intervalId) clearInterval(intervalId);
           reject(new Error("EditorView destroyed during streaming"));
           return;
        }

        if (suggestionNodePos === null) {
             console.error("streamTestContentInsideSuggestion: Suggestion node position is lost.");
             if (intervalId) clearInterval(intervalId);
             reject(new Error("Suggestion node position tracking failed."));
             return;
        }

        if (currentIndex >= textChunks.length) {
          // Streaming finished
          if (intervalId) clearInterval(intervalId);
          console.log(
            "streamTestContentInsideSuggestion: Streaming finished successfully."
          );
          resolve();
          return;
        }

        try {
          const chunk = textChunks[currentIndex] + (currentIndex < textChunks.length - 1 ? " " : ""); // Add space back
          const currentState = view.state; // Get the *latest* state

          // --- Recalculate insertion position INSIDE the paragraph ---
          // Find the node *at its current position*. Its pos might change if content before it is added/removed.
          // We need to map the original position through all transactions since insertion,
          // OR re-find the node (e.g., by ID if we had one, or by its relative position).
          // For this test, let's assume its position `suggestionNodePos` remains valid relative to doc start,
          // unless things are inserted *before* it. A safer way in real app is using decorations or node IDs.

          // Let's *try* finding the node at the stored position.
          let currentSuggestionNode = currentState.doc.nodeAt(suggestionNodePos);
          if (!currentSuggestionNode || currentSuggestionNode.type !== suggestionNodeType) {
              // Position might be invalid due to external edits, try to find last node as fallback for test
              console.warn("streamTestContentInsideSuggestion: Suggestion node not found at original mapped position", suggestionNodePos, ". Trying lastChild.");
              if(currentState.doc.lastChild?.type === suggestionNodeType) {
                 currentSuggestionNode = currentState.doc.lastChild;
                 suggestionNodePos = currentState.doc.content.size - currentSuggestionNode.nodeSize;
                 console.log("streamTestContentInsideSuggestion: Found suggestion node as last child at new pos", suggestionNodePos);
              } else {
                 throw new Error(`Suggestion node lost or invalid at pos ${suggestionNodePos}.`);
              }
          }

          // Get the paragraph node inside (assuming it's the first child)
          const paragraphInside = currentSuggestionNode.content?.firstChild;
          if (!paragraphInside || paragraphInside.type !== paragraphNodeType) {
            throw new Error(
              "Paragraph node not found inside the suggestion node."
            );
          }

          // Calculate position: node start + suggestion tag(1) + paragraph tag(1) + current paragraph content size
          const insertPosInParagraph = suggestionNodePos + 1 + 1 + paragraphInside.content.size;

          console.log(`streamTestContentInsideSuggestion: Inserting chunk "${chunk}" at pos ${insertPosInParagraph}`);

          // Create and dispatch transaction to insert text
          const streamTr = currentState.tr.insertText(chunk, insertPosInParagraph);
          view.dispatch(streamTr);

          // Update the suggestionNodePos based on the mapping of the transaction *if needed*.
          // In this case, insertion *inside* the node doesn't change its start pos.
          // suggestionNodePos = streamTr.mapping.map(suggestionNodePos); // Not strictly necessary here

          currentIndex++;

        } catch (streamError) {
          console.error(
            "streamTestContentInsideSuggestion: Error during chunk insertion:",
            streamError
          );
          if (intervalId) clearInterval(intervalId);
          reject(streamError); // Reject the promise on error
        }
      }, chunkDelay);

    } catch (setupError) {
      console.error(
        "streamTestContentInsideSuggestion: Error during setup:",
        setupError
      );
      if (intervalId) clearInterval(intervalId); // Ensure cleanup if interval started before error
      reject(setupError); // Reject the promise on setup error
    }
  });
}