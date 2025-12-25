import { Link, useLocation } from "wouter";
import { useThreads, useCreateThread } from "@/hooks/use-threads";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Box } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: threads, isLoading } = useThreads();
  const createThread = useCreateThread();

  const handleNewChat = async () => {
    try {
      const newThread = await createThread.mutateAsync();
      setLocation(`/thread/${newThread.id}`);
    } catch (error) {
      console.error("Failed to create thread", error);
    }
  };

  const currentThreadId = location.startsWith("/thread/") 
    ? parseInt(location.split("/")[2]) 
    : null;

  return (
    <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <Button 
          onClick={handleNewChat} 
          disabled={createThread.isPending}
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          {createThread.isPending ? "Creating..." : "New Chat"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          <h4 className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Chats</h4>
          
          {isLoading ? (
            <div className="space-y-2 px-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : threads?.length === 0 ? (
            <div className="text-center py-8 px-4 text-muted-foreground text-sm">
              <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No chats yet.</p>
              <p className="text-xs mt-1 opacity-70">Start a new conversation!</p>
            </div>
          ) : (
            threads?.map((thread) => (
              <Link 
                key={thread.id} 
                href={`/thread/${thread.id}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden",
                  currentThreadId === thread.id
                    ? "bg-secondary text-foreground shadow-md border border-white/5" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {currentThreadId === thread.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
                )}
                <MessageSquare className={cn(
                  "w-4 h-4 transition-colors",
                  currentThreadId === thread.id ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary/70"
                )} />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">
                    {thread.title || `Chat #${thread.id}`}
                  </p>
                  <p className="text-xs opacity-60 truncate">
                    {thread.createdAt ? formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true }) : 'Just now'}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary/20">
            AI
          </div>
          <div>
            <p className="text-sm font-medium">Nova</p>
            <p className="text-xs text-muted-foreground">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
