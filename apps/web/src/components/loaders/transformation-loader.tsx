import "@/components/loaders/transformation-loader.css";
import { useUIStore } from "@/store/ui";

export const TransformationLoader = ({ message = "Transforming" }) => {
  const shouldShake = useUIStore(state => state.shouldShake);
  console.log("should shake is: ", shouldShake)
  
  return (
    <div className={`transformation-loader-container ${shouldShake ? 'shake' : ''} absolute z-10 -right-2 top-14 bg-white flex items-center justify-start gap-1 px-2 pr-4 py-1.5 rounded-md border border-y-1 border-x-0 border-l-1 border-border`}>
      <div className="wrisor-loader"></div>
      <span className="text-muted-foreground text-sm font-normal">
        {message}
      </span>
    </div>
  );
};