import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { useNavigate } from '@tanstack/react-router';

export const WrisorLandingPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, clearUserDetails, setIsAuthenticated } = useUserStore()
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      setIsProcessing(true);
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        setMessage('');
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAuth = () => {
    if(isAuthenticated){
      setIsAuthenticated(false)
      clearUserDetails()
    } else {
      navigate({
        to: "/login"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-ui-chat-background to-card">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-palette-gold rounded-full opacity-20 animate-pulse" 
             style={{ animationDelay: '0s', animationDuration: '6s' }} />
        <div className="absolute top-40 right-20 w-3 h-3 bg-palette-salmon rounded-full opacity-15 animate-pulse" 
             style={{ animationDelay: '3s', animationDuration: '6s' }} />
        <div className="absolute bottom-40 left-1/4 w-1 h-1 bg-olive-green rounded-full opacity-25 animate-pulse" 
             style={{ animationDelay: '1s', animationDuration: '6s' }} />
        <div className="absolute bottom-60 right-1/3 w-2 h-2 bg-light-mushroom rounded-full opacity-20 animate-pulse" 
             style={{ animationDelay: '4s', animationDuration: '6s' }} />
      </div>

      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto relative z-10">
        <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-palette-dark bg-clip-text text-transparent">
          Wrisor
        </div>
        <Button 
          onClick={handleAuth}
          variant="outline" 
          className="bg-transparent border-ui-border hover:bg-card hover:border-palette-gold transition-all duration-200"
        >
          {isAuthenticated ? "Logout" : "Login"}
        </Button>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-[80vh] px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-foreground to-palette-dark bg-clip-text text-transparent">
              AI-Powered Writing,
            </span>
            <br />
            <span className="text-4xl md:text-5xl bg-gradient-to-r from-palette-dark to-foreground bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl mb-12 text-palette-dark opacity-80 font-light leading-relaxed">
            Experience the future of writing with intelligent assistance,
            <br />
            seamless collaboration, and effortless creativity.
          </p>

          {/* Chat Input Card */}
          <Card className="max-w-2xl mx-auto p-6 bg-ui-input-background border-ui-border shadow-2xl backdrop-blur-sm">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Wrisor to help you write, edit, or brainstorm..."
                  className="min-h-[80px] border-none bg-transparent text-lg leading-relaxed resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-ui-placeholder-text"
                  disabled={isProcessing}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isProcessing}
                className="bg-ui-button-background hover:bg-ui-button-hover text-ui-button-text shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Hint Text */}
          <p className="text-sm text-palette-dark opacity-60 mt-4 font-light">
            Start writing with AI assistance • No signup required to try
          </p>
        </div>

        {/* Subtle Brand Element */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-1 h-1 bg-palette-gold rounded-full" />
            <div className="text-xs font-light tracking-wide text-palette-dark">
              CURSOR FOR WRITING
            </div>
            <div className="w-1 h-1 bg-palette-gold rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
};