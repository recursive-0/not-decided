import Toolbar from "../toolbar";
import { ProseMirrorEditor } from "./prose-mirror-editor";

export const EditorContainer = () => {
  return (
    
    
    <div className="w-full h-full overflow-hidden flex flex-col items-center bg-background">
      <Toolbar />
      <ProseMirrorEditor />
    </div>
  );
};