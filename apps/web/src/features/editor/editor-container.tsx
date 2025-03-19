import Toolbar from "../toolbar"
import { ProseMirrorEditor } from "./prose-mirror-editor"




export const EditorContainer = () => {


    return (
        <div className="w-full h-auto overflow-auto flex flex-col items-center gap-2 px-4">
            <Toolbar />
            <ProseMirrorEditor />
        </div>
    )
}