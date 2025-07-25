import { TransformationLoader } from "@/components/loaders/transformation-loader";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/store/ui";
import Toolbar from "../toolbar";
import { ProseMirrorEditor } from "./prose-mirror-editor";

export const EditorContainer = () => {

  const { isTransforming } = useUIStore()
  console.log("transformation is: ", isTransforming)
  return (
    <div className="w-full h-full flex flex-col items-center bg-background relative">
      <Toolbar />
      <Separator />
      {isTransforming && <TransformationLoader />}
      <ProseMirrorEditor />
    </div>
  );
};
