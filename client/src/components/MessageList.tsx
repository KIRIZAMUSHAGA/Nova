import * as React from "react";
import { Message } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Bot, User, Sparkles, Paperclip, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  streamingMessage?: string | null;
}

export function MessageList({ messages, isLoading, streamingMessage }: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming updates
  React.useEffect(() => {
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
                    <div className="flex flex-col gap-3">
                      <div className="whitespace-pre-wrap font-medium">{message.content}</div>
                      {message.attachment && (
                        <div className="flex flex-wrap gap-2">
                          <div className="group relative flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-white/5 hover:border-primary/50 transition-all duration-300">
                            {message.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) || message.attachment.startsWith("/objects/") ? (
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <img src={message.attachment} alt="Attachment" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                                <Paperclip className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-foreground/70 truncate max-w-[150px]">
                                {message.attachment.split("/").pop()}
                              </span>
                              <a 
                                href={message.attachment} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-1 flex items-center gap-1.5 text-[10px] text-primary hover:underline font-bold uppercase tracking-widest"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
