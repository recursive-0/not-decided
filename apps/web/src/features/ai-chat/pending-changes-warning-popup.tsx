import { X, AlertTriangle } from "lucide-react";

export const PendingChangesWarning = ({ 
  visible, 
  onClose,
}: { 
  visible: boolean; 
  onClose: () => void;
}) => {
  if (!visible) return null;
  
  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 px-2">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 shadow-md text-sm flex items-start">
        <AlertTriangle className="text-amber-500 h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-amber-800 font-medium">You have pending changes</p>
          <p className="text-amber-700 text-xs mt-1">
            Please apply or discard your changes before generating a new response.
          </p>
          <div className="mt-2 flex gap-2">
            <button 
              onClick={onClose}
              className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-amber-500 hover:text-amber-700 ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PendingChangesWarning;