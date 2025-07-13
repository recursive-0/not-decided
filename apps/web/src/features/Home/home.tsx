import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user";
import { CursorContainer } from "@/svg/cursor-container.svg";
import { WrisorLogo } from "@/svg/wrisor-logo.svg";
import { useNavigate } from "@tanstack/react-router";
import { CornerDownRight, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-start items-center relative">
      <Navbar />

      <div className="w-full px-6 py-16 relative">
        {/* <Grid /> */}

        <div className="relative z-10">
          <div className="text-center mb-16 relative">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
              <Sparkles className="w-4 h-4" />
              AI-Powered Writing Assistant
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 relative leading-20">
              <span className="text-primary relative px-2">
                <CursorContainer />
                Write
              </span>
              <span className="text-accent ml-4">Like</span>
              <br />
              <span className="text-accent">You</span>
              <span className="text-primary ml-4">Think</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Wrisor is the first editor that thinks with you. Point anywhere,
              ask for anything, and watch your document build itself.
            </p>
            <PromptArea />
          </div>
        </div>
      </div>

      <GridBackground />
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full h-[500px] bg-accent-foreground relative">
        <WrisorLogo />
      </div>
    </div>
  );
}

const Navbar = () => {
  const navigate = useNavigate()
  return (
    <nav className="w-full sticky top-0 mt-2 py-2 rounded-lg flex justify-between items-center px-20">

      <div className="flex items-center justify-between gap-2">
        <div className="w-10 h-10 bg-none flex items-center justify-center relative rounded-lg">
          <WrisorLogo />
        </div>
        <span className="text-2xl font-bold text-foreground">Wrisor</span>
      </div>

      <div className="flex items-center justify-between gap-10">
        <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
        <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
      </div>


        <Button variant="outline" onClick={() => navigate({ to: "/login" })}>
          Sign In
        </Button>
    </nav>
  );
};

const GridBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Animated Grid with Fade Effect */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="grid grid-cols-50 grid-rows-50 h-full w-full">
          {Array.from({ length: 2500 }).map((_, i) => (
            <div
              key={i}
              className="border border-primary animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        {/* Fade mask that stops at textarea boundary */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"
          style={{
            background: `linear-gradient(to bottom, 
                   transparent 0%, 
                   transparent 45%, 
                   rgba(232, 218, 203, 0.3) 55%,
                   rgba(232, 218, 203, 0.7) 65%,
                   rgba(232, 218, 203, 1) 75%)`,
          }}
        />
      </div>

      {/* Dynamic Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 animate-gradient-shift"></div>
    </div>
  );
};

const PromptArea = () => {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated } = useUserStore();
  const navigate = useNavigate();

  const handleSend = () => {
    if (message.trim()) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setMessage("");
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isAuthenticated) {
        handleSend();
      } else {
        localStorage.setItem("user_prompt", message);
        navigate({
          to: "/login",
        });
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto mb-16">
      <div className="relative z-10">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write an essay, article, or anything else... ✨"
          className="w-full h-32 bg-card/50 border border-input rounded-lg p-4 pr-10 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          disabled={isProcessing}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() || isProcessing}
          className="absolute bottom-3 right-1 bg-none text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
          ) : (
            <CornerDownRight className="w-5 h-5 text-primary" />
          )}
        </button>
      </div>
    </div>
  );
};
