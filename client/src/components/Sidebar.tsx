import * as React from "react";
import { Link, useLocation } from "wouter";
import { useThreads, useCreateThread } from "@/hooks/use-threads";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  MessageSquare, 
  Sparkles, 
  FileText, 
  ImageIcon, 
  Globe, 
  Settings, 
  Info, 
  User as UserIcon, 
  Rocket, 
  ChevronDown, 
  ChevronRight,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  Power
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { data: threads, isLoading } = useThreads();
  const { user, logout } = useAuth();
  const createThread = useCreateThread();
  const [isChatsExpanded, setIsChatsExpanded] = React.useState(true);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: whatsappSession, isLoading: isSessionLoading } = useQuery({
    queryKey: ['/api/whatsapp/session'],
    enabled: isWhatsAppModalOpen,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status === 'qr_ready' || status === 'disconnected') ? 3000 : false;
    }
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/whatsapp/connect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/session'] });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/whatsapp/logout');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/session'] });
      toast({ title: "Déconnecté", description: "Session WhatsApp terminée." });
    }
  });

  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  }, [location]);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 border-r border-border bg-card/30 backdrop-blur-md flex flex-col h-full items-center justify-center p-6 transition-transform duration-300 lg:relative lg:translate-x-0",
        !isOpen && "-translate-x-full"
      )}>
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground mt-4 animate-pulse">Chargement de Nova...</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 border-r border-border bg-card/95 backdrop-blur-md flex flex-col h-full overflow-hidden transition-transform duration-300 lg:relative lg:translate-x-0 lg:bg-card/30",
        !isOpen && "-translate-x-full"
      )}>
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
            <div className="space-y-2">
              <Button 
                onClick={handleNewChat} 
                disabled={createThread.isPending}
                className="w-full justify-start gap-3 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-0"
              >
                {createThread.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                <span className="font-semibold">{createThread.isPending ? "Initialisation..." : "Nouvelle conversation"}</span>
              </Button>

              <Dialog open={isWhatsAppModalOpen} onOpenChange={setIsWhatsAppModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className={cn(
                      "w-full justify-start gap-3 h-12 rounded-xl border-green-500/50 bg-green-500/5 text-green-600 hover:bg-green-500/10 hover:text-green-700 transition-all",
                      whatsappSession?.status === 'connected' && "border-green-600 bg-green-600/10 text-green-700"
                    )}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">
                      {whatsappSession?.status === 'connected' ? "WhatsApp Connecté" : "Connecter WhatsApp"}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Gestion WhatsApp</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center gap-6 py-6">
                    {whatsappSession?.status === 'connected' ? (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <MessageCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg">Nova est actif</h3>
                          <p className="text-sm text-muted-foreground">Votre compte est lié et répondra automatiquement aux messages.</p>
                        </div>
                        <Button 
                          variant="destructive" 
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending}
                          className="w-full gap-2"
                        >
                          <Power className="w-4 h-4" />
                          Déconnecter l'appareil
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-inner flex items-center justify-center border-2 border-dashed border-muted relative overflow-hidden">
                          {isSessionLoading || connectMutation.isPending ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          ) : whatsappSession?.qrCode ? (
                            <img src={whatsappSession.qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                          ) : (
                            <div className="text-center space-y-2 text-muted-foreground p-4">
                              <MessageCircle className="w-12 h-12 mx-auto opacity-20" />
                              <p className="text-xs italic">Prêt pour la connexion</p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => connectMutation.mutate()}
                                className="mt-2 h-8"
                              >
                                Générer QR Code
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4 text-sm w-full">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold">Instructions</h4>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/session'] })}
                            >
                              <RefreshCw className="h-4 h-4" />
                            </Button>
                          </div>
                          <ol className="space-y-2 list-decimal list-inside text-muted-foreground bg-muted/30 p-4 rounded-lg">
                            <li>Ouvrez WhatsApp sur votre téléphone</li>
                            <li>Appuyez sur <span className="font-semibold text-foreground">Menu</span> ou <span className="font-semibold text-foreground">Réglages</span></li>
                            <li>Sélectionnez <span className="font-semibold text-foreground">Appareils liés</span></li>
                            <li>Appuyez sur <span className="font-semibold text-foreground">Lier un appareil</span></li>
                            <li>Scannez le code QR ci-dessus</li>
                          </ol>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" className="justify-start gap-2 h-10 rounded-lg text-xs font-medium border-white/5 hover:bg-white/5">
                  <FileText className="w-4 h-4 text-orange-400" />
                  Générer PDF
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2 h-10 rounded-lg text-xs font-medium border-white/5 hover:bg-white/5">
                  <Sparkles className="w-4 h-4 text-pink-400" />
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

        <div className="p-4 bg-background/40 backdrop-blur-xl border-t border-border/50 space-y-3">
          {/* User Info */}
          {user && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Compte</p>
              <p className="text-sm font-medium text-foreground truncate" data-testid="text-user-email">{user.email}</p>
              <Button 
                variant="destructive"
                size="sm"
                onClick={logout}
                className="w-full justify-start gap-2 h-9 rounded-lg text-xs font-medium"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </Button>
            </div>
          )}

          <Button 
            variant="ghost" 
            onClick={() => setLocation("/about")}
            className="w-full justify-start gap-3 h-10 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 px-3"
          >
            <Info className="w-4 h-4" />
            À propos de Nova
          </Button>
          {deferredPrompt && (
            <Button 
              onClick={handleInstall}
              className="w-full justify-start gap-3 h-10 rounded-lg text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 mt-2 animate-pulse"
            >
              <Rocket className="w-4 h-4" />
              📲 Installer Nova
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
