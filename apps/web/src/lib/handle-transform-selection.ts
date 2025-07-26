import { textHighlightPluginKey } from "@/plugins/text-highlight-plugin/text-highlight-plugin";
import { Node } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { SemanticSelectionContext } from "./misc-editor-helpers";


interface HandleTransformSelectionProps {
    editorView: EditorView;
    transformedContent: string |  Node[]
    semanticSelectionContext: SemanticSelectionContext
}

export const handleTransformSelection = async (props: HandleTransformSelectionProps) => {



    const { semanticSelectionContext } = props;

    if(semanticSelectionContext.selectionType === "inline") {
        handleInlineTransformation(props)
    } else {
        handleBlockTransformation(props)
    }
    


}



const handleInlineTransformation = (props: HandleTransformSelectionProps) => {
    const { editorView, transformedContent, semanticSelectionContext } = props;


    const { from: semanticFrom, to: semanticTo } = semanticSelectionContext.semanticSelection

    const originalText = editorView.state.doc.textBetween(semanticFrom, semanticTo);

    let tr = editorView.state.tr;

    if(typeof transformedContent !== "string") {
        console.error("transformedContent is not a string")
        return
    }

    tr = tr.insertText(transformedContent, semanticTo);


    const strikeThroughRange = { from: semanticFrom, to: semanticTo }; // strikethrough original selection range
    const highlightRange = {
        from: semanticTo,
        to: semanticTo + (transformedContent).length,
    }; // highlight transformed text range

    const transformationId = Date.now().toString();

    const transformation = {
        action: "show-transformation",
        transformationId,
        originalText,
        transformedText: transformedContent,
        strikeThroughRange,
        highlightRange,
    }

    tr = tr.setMeta(textHighlightPluginKey, transformation)
    editorView.dispatch(tr)
       
}

// Assuming transformedText is actually transformedContentJSON for this function
const handleBlockTransformation = (props: HandleTransformSelectionProps) => {
    const { editorView, transformedContent, semanticSelectionContext } = props;
    const { state } = editorView;
    const { from: semanticFrom, to: semanticTo } = semanticSelectionContext.semanticSelection;

    try {
        // 1. PARSE THE AI's JSON RESPONSE (No change here)
        const newNodesFragment = Node.fromJSON(state.schema, transformedContent).content;

        // 2. CALCULATE THE SIZE OF THE NEW CONTENT (No change here)
        const newContentSize = newNodesFragment.size;

        // --- THE FIX STARTS HERE ---

        // 3. FIND THE CORRECT INSERTION POSITION
        // Resolve the end of our semantic selection to get its context in the tree.
        const $resolvedTo = state.doc.resolve(semanticTo);
        
        // "Climb up" to the top-level block (depth 1) and get the position AFTER it.
        // This is the "next lot" position we need.
        const insertionPos = $resolvedTo.after(1); 

        // 4. CREATE THE TRANSACTION using the new, correct insertionPos
        let tr = state.tr.insert(insertionPos, newNodesFragment);

        // 5. DEFINE THE RANGES FOR THE UI PLUGIN
        // The strikethrough range is still the original semantic selection.
        const strikeThroughRange = { from: semanticFrom, to: semanticTo };

        // The highlight range now starts at our new, correct insertion position.
        const highlightRange = {
            from: insertionPos,
            to: insertionPos + newContentSize,
        };
        
        // --- THE FIX ENDS HERE ---

        // 6. ASSEMBLE THE METADATA (No change here)
        const transformation = {
            action: "show-transformation",
            transformationId: Date.now().toString(),
            originalText: "", 
            transformedText: "",
            strikeThroughRange,
            highlightRange,
        };

        // 7. DISPATCH (No change here)
        tr = tr.setMeta(textHighlightPluginKey, transformation);
        editorView.dispatch(tr);

    } catch (error) {
        console.error("Failed to parse or apply AI's structured response:", error);
        // Handle the error gracefully.
    }
};