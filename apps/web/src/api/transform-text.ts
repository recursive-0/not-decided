import { CursorContext } from "@/lib/misc-editor-helpers";
import ky from "ky";

interface TransformTextProps {
    prompt: string;
    cursorContext: CursorContext
}


export const transformText = async (props: TransformTextProps) => {

    try{
        const response = await ky.post(`${import.meta.env.VITE_API_BASE_URL}/api/documents/transform-text`, {json: {...props}}).json<TransformTextResponse>()
        return response;
    } catch (error) {
        console.error("Error transforming text: ", error);
        throw error;
    }
}

interface TransformTextResponse {
    transformedText: string;
}