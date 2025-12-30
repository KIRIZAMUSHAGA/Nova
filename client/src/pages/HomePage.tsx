import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Shield, MessageSquare, Loader2 } from "lucide-react";
import { useCreateThread } from "@/hooks/use-threads";
import { useLocation } from "wouter";

export default function HomePage() {
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-0 relative overflow-y-auto w-full h-full">
      {/* Main background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-2xl mx-auto space-y-8 py-12 w-full">
        <div className="space-y-4">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-primary to-accent rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/30 mb-6 rotate-3 hover:rotate-6 transition-transform duration-300">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            Comment puis-je <span className="text-primary">vous aider</span> aujourd'hui ?
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Votre assistant intelligent pour le code, la rédaction, l'analyse et plus encore.
            Puissant, sécurisé et toujours prêt.
          </p>
        </div>

        <Button 
          size="lg" 
          onClick={handleStartChat}
          disabled={createThread.isPending}
          className="h-14 px-8 rounded-full text-lg bg-primary text-primary-foreground shadow-xl shadow-primary/20 font-semibold transition-all hover:scale-105 active:scale-95"
        >
          {createThread.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Initialisation...
            </>
          ) : (
            "Démarrer une conversation"
          )}
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 w-full">
          {[
            { icon: Zap, title: "Réponses Rapides", desc: "Propulsé par des LLMs avancés" },
            { icon: Shield, title: "Sécurisé & Privé", desc: "Vos données vous appartiennent" },
            { icon: MessageSquare, title: "Contexte Intelligent", desc: "Mémorise l'historique" }
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
  );
}
