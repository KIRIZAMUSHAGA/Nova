import * as React from "react";
import { useParams } from "wouter";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { useThread, useMessages, useSendMessage } from "@/hooks/use-threads";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.id || null;
  const [streamingMessage, setStreamingMessage] = React.useState<string | null>(null);

  const { data: thread, isLoading: isLoadingThread, error: threadError } = useThread(threadId);
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(threadId);
  const sendMessage = useSendMessage();

  const handleSend = async (content: string) => {
    if (!threadId) return;
    setStreamingMessage("");
    try {
      await sendMessage.mutateAsync({ 
        threadId, 
        content,
        onChunk: (chunk) => setStreamingMessage(prev => (prev || "") + chunk)
      });
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setStreamingMessage(null);
    }
  };

  const isThinking = sendMessage.isPending;

  if (threadError) {
    return (
      <div className="flex h-screen bg-background items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load this conversation. It might have been deleted or doesn't exist.
          </AlertDescription>
          <Button 
            className="mt-4 w-full" 
            variant="outline" 
            onClick={() => window.location.href = "/"}
          >
            Go Back Home
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background text-foreground font-sans selection:bg-primary/20">
      <header className="h-16 flex items-center px-4 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-display font-semibold truncate flex items-center gap-2">
            {isLoadingThread ? (
              <div className="h-5 w-32 bg-muted/40 animate-pulse rounded" />
            ) : (
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {thread?.title || "New Conversation"}
              </span>
            )}
          </h1>
        </div>
      </header>

      <MessageList 
        messages={messages} 
        isLoading={isThinking} 
        streamingMessage={streamingMessage} 
      />

      <ChatInput 
        onSend={handleSend} 
        disabled={isThinking || !threadId} 
        placeholder={threadId ? "Ask anything..." : "Select or create a chat to start"}
      />
    </div>
  );
}
