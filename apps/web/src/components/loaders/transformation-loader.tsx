import "@/components/loaders/transformation-loader.css"
import { useUIStore } from "@/store/ui";

export const TransformationLoader = ({ message = "Transforming" }) => {
  const shouldShake = useUIStore(state => state.shouldShake);
  console.log("should shake is: ", shouldShake)
  
  return (
    <div className={`transformation-loader-container ${shouldShake ? 'shake' : ''} absolute z-10 right-2 top-14 bg-palette-cream flex items-center justify-start gap-2 px-2 py-1.5 rounded-md shadow-lg border border-palette-salmon/30`}>
      <div className="wrisor-loader"></div>
      <span className="text-olive-green text-sm font-normal tracking-wide">
        {message}
      </span>
    </div>
  );
};