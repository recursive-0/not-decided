import { Separator } from "@/components/ui/separator";
import Toolbar from "../toolbar";
import { ProseMirrorEditor } from "./prose-mirror-editor";

export const EditorContainer = () => {
  return (
    
    
    <div className="w-full h-full flex flex-col items-center bg-background relative">
      <Toolbar />
      <Separator />
      <ProseMirrorEditor />
    </div>
  );
};