import { useEffect, useRef } from "react";
import { Message } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  streamingMessage?: string | null;
}

export function MessageList({ messages, isLoading, streamingMessage }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming updates
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, streamingMessage]);

  return (
    <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
      <div className="max-w-3xl mx-auto space-y-6 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "flex gap-4 group",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg",
                  isUser 
                    ? "bg-secondary text-secondary-foreground border border-white/5" 
                    : "bg-primary text-primary-foreground shadow-primary/20"
                )}>
                  {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                {/* Message Bubble */}
                <div className={cn(
                  "flex-1 max-w-[85%] rounded-2xl p-4 md:p-5 shadow-sm text-sm md:text-base leading-relaxed overflow-hidden",
                  isUser 
                    ? "bg-secondary/80 text-secondary-foreground rounded-tr-sm border border-white/5" 
                    : "bg-card text-card-foreground rounded-tl-sm border border-border/50"
                )}>
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-medium">{message.content}</div>
                  ) : (
                    <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {streamingMessage !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 flex-row"
            >
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg bg-primary text-primary-foreground shadow-primary/20">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 max-w-[85%] rounded-2xl p-4 md:p-5 shadow-sm text-sm md:text-base leading-relaxed overflow-hidden bg-card text-card-foreground rounded-tl-sm border border-border/50">
                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 max-w-none">
                  <ReactMarkdown>{streamingMessage || "..."}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && streamingMessage === null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div className="bg-card px-4 py-3 rounded-2xl rounded-tl-sm border border-border/50 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
        
        <div ref={bottomRef} className="h-1" />
      </div>
    </ScrollArea>
  );
}
