import { textHighlightPluginKey } from "@/plugins/text-highlight-plugin/text-highlight-plugin";
import { EditorView } from "prosemirror-view";


interface HandleTransformSelectionProps {
    editorView: EditorView;
    transformedText: string
}

export const handleTransformSelection = async (props: HandleTransformSelectionProps) => {
    const { editorView, transformedText } = props;

    const { from: semanticFrom, to: semanticTo } = editorView.state.selection

    const originalText = editorView.state.doc.textBetween(semanticFrom, semanticTo);

    let tr = editorView.state.tr;

    tr = tr.insertText(transformedText, semanticTo);


    const strikeThroughRange = { from: semanticFrom, to: semanticTo }; // strikethrough original selection range
    const highlightRange = {
        from: semanticTo,
        to: semanticTo + transformedText.length,
    }; // highlight transformed text range

    const transformationId = Date.now().toString();

    const transformation = {
        action: "show-transformation",
        transformationId,
        originalText,
        transformedText,
        strikeThroughRange,
        highlightRange,
    }

    tr = tr.setMeta(textHighlightPluginKey, transformation)
    editorView.dispatch(tr)
    
}