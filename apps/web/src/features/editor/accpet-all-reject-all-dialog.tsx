import { Button } from "@/components/ui/button";


interface AcceptAllRejectAllDialogProps {
  position: { left: number; bottom: number };
}

export const AcceptAllRejectAllDialog = ({
  position,
}: AcceptAllRejectAllDialogProps) => {

  const onAcceptAll = () => {
    const suggestionsManagerInstance = window.suggestionsManager;
    if (!suggestionsManagerInstance) {
      throw new Error("Suggestion manager instance doesn't exist!!!");
    }
    suggestionsManagerInstance.acceptAll();
  };

  const onRejectAll = () => {
    const suggestionsManagerInstance = window.suggestionsManager;
    if (!suggestionsManagerInstance) {
      throw new Error("Suggestion manager instance doesn't exist!!!");
    }
    suggestionsManagerInstance.rejectAll();
  };

  return (
    <div
      className="flex justify-center p-2 z-10 pointer-events-none"
      style={{
        position: "fixed",
        left: `${position.left}px`,
        bottom: `${position.bottom}px`,
        transform: "translateX(-50%)",
      }}
    >
      <div className="w-fit flex pointer-events-auto">
        <Button
          onClick={onAcceptAll}
          variant="default"
          className="bg-forest-teal z-20 hover:bg-forest-teal/20 text-white rounded-[0px] rounded-l-lg hover:cursor-pointer"
        >
          Accept All
        </Button>
        <Button
          onClick={onRejectAll}
          variant="destructive"
          className="bg-olive-green z-20 hover:bg-olive-green/20 text-white rounded-[0px] rounded-r-lg  hover:cursor-pointer"
        >
          Reject All
        </Button>
      </div>
      <div className="absolute h-full w-full top-0 left-0 bg-olive-green/90 blur-2xl z-0" />{" "}
    </div>
  );
};
