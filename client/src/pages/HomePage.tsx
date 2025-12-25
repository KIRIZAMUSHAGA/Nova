import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sparkles, Zap, Shield, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useCreateThread } from "@/hooks/use-threads";
import { useLocation } from "wouter";

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const createThread = useCreateThread();
  const [, setLocation] = useLocation();

  const handleStartChat = async () => {
    try {
      const newThread = await createThread.mutateAsync();
      setLocation(`/thread/${newThread.id}`);
    } catch (error) {
      console.error("Failed to create thread", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <div />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80 bg-background border-r border-border">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content - Empty State / Landing */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 h-16 flex items-center px-4 z-10">
          <div className="mr-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-0 relative">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
          
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/30 mb-6 rotate-3 hover:rotate-6 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
                How can I <span className="text-primary glow-text">help you</span> today?
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Your intelligent assistant for coding, creative writing, analysis, and more. 
                Powerful, secure, and always ready.
              </p>
            </div>

            <Button 
              size="lg" 
              onClick={handleStartChat}
              disabled={createThread.isPending}
              className="h-14 px-8 rounded-full text-lg bg-white text-black hover:bg-white/90 shadow-xl shadow-white/5 font-semibold transition-all hover:scale-105 active:scale-95"
            >
              {createThread.isPending ? "Creating Space..." : "Start a Conversation"}
            </Button>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12">
              {[
                { icon: Zap, title: "Fast Responses", desc: "Powered by advanced LLMs" },
                { icon: Shield, title: "Secure & Private", desc: "Your data stays yours" },
                { icon: MessageSquare, title: "Smart Context", desc: "Remembers conversation history" }
              ].map((feature, i) => (
                <div key={i} className="p-4 rounded-2xl bg-secondary/30 border border-white/5 backdrop-blur-sm hover:bg-secondary/50 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary mb-3 mx-auto" />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
