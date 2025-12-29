import * as React from "react";
import { Link, useLocation } from "wouter";
import { useThreads, useCreateThread } from "@/hooks/use-threads";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  MessageSquare, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  Settings, 
  Info, 
  User as UserIcon, 
  Rocket, 
  ChevronDown, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: threads, isLoading } = useThreads();
  const createThread = useCreateThread();
  const [isChatsExpanded, setIsChatsExpanded] = React.useState(true);

  const handleNewChat = async () => {
    try {
      const newThread = await createThread.mutateAsync();
      setLocation(`/thread/${newThread.id}`);
    } catch (error) {
      console.error("Failed to create thread", error);
    }
  };

  const currentThreadId = location.startsWith("/thread/") 
    ? location.split("/")[2]
    : null;

  if (isLoading) {
    return (
      <div className="w-80 border-r border-border bg-card/30 backdrop-blur-md flex flex-col h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground mt-4 animate-pulse">Chargement de Nova...</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-border bg-card/30 backdrop-blur-md flex flex-col h-full overflow-hidden">
      {/* SECTION 1 — En-tête Nova */}
      <div className="p-6 border-b border-border/50 relative group cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setLocation("/about")}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full shadow-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold tracking-tight">Nova AI</h2>
            <p className="text-xs text-muted-foreground font-medium truncate">Assistant Intelligent</p>
            <p className="text-[10px] text-primary/70 font-bold uppercase tracking-wider mt-0.5">Par Kiriza Mushaga</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* SECTION 2 — Actions principales */}
          <div className="space-y-2">
            <Button 
              onClick={handleNewChat} 
              disabled={createThread.isPending}
              className="w-full justify-start gap-3 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-0"
            >
              {createThread.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span className="font-semibold">{createThread.isPending ? "Initialisation..." : "Nouvelle conversation"}</span>
            </Button>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" size="sm" className="justify-start gap-2 h-10 rounded-lg text-xs font-medium border-white/5 hover:bg-white/5">
                <FileText className="w-4 h-4 text-orange-400" />
                Générer PDF
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2 h-10 rounded-lg text-xs font-medium border-white/5 hover:bg-white/5">
                <ImageIcon className="w-4 h-4 text-pink-400" />
                Créer Image
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2 h-10 rounded-lg text-xs font-medium border-white/5 hover:bg-white/5">
                <Globe className="w-4 h-4 text-blue-400" />
                Recherche Web
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2 h-10 rounded-lg text-xs font-medium border-white/5 hover:bg-white/5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Capacités
              </Button>
            </div>
          </div>

          {/* SECTION 3 — Conversations récentes */}
          <div className="space-y-2">
            <button 
              onClick={() => setIsChatsExpanded(!isChatsExpanded)}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors group"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Récents
              </span>
              {isChatsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            <AnimatePresence>
              {isChatsExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  {threads?.length === 0 ? (
                    <div className="text-center py-6 px-4 text-muted-foreground/50 italic text-xs">
                      Aucun chat récent
                    </div>
                  ) : (
                    threads?.map((thread) => (
                      <Link 
                        key={thread.id} 
                        href={`/thread/${thread.id}`}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden",
                          currentThreadId === String(thread.id)
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                      >
                        <MessageSquare className={cn(
                          "w-4 h-4 shrink-0",
                          currentThreadId === String(thread.id) ? "text-primary" : "text-muted-foreground/50 group-hover:text-primary/50"
                        )} />
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate font-medium">{thread.title || `Chat #${thread.id}`}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>

      {/* SECTION 4 — Paramètres & identité */}
      <div className="p-4 bg-background/40 backdrop-blur-xl border-t border-border/50 space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 px-3">
          <Settings className="w-4 h-4" />
          Paramètres
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/about")}
          className="w-full justify-start gap-3 h-10 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 px-3"
        >
          <Info className="w-4 h-4" />
          À propos de Nova
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 px-3">
          <UserIcon className="w-4 h-4" />
          Le Créateur
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 px-3">
          <Rocket className="w-4 h-4" />
          Vision & Futur
        </Button>
      </div>
    </div>
  );
}
