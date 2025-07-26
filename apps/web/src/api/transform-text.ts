import { CursorContext, NodeContextType } from "@/lib/misc-editor-helpers";
import ky from "ky";

interface TransformTextProps {
    userPrompt: string;
    selectedText: string;
    selectedNodes: NodeContextType[];
    focusPoints: {
        from: number;
        to: number;
    };
    cursorContext: CursorContext;
}


export const transformText = async (props: TransformTextProps) => {

    try{
        const response = await ky.post(`${import.meta.env.VITE_API_BASE_URL}/api/documents/transform-text`, {json: {...props}, timeout: 30000}).json<TransformTextResponse>()
        return response;
    } catch (error) {
        console.error("Error transforming text: ", error);
        throw error;
    }
}

interface TransformTextResponse {
    transformedText: string;
}