import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Ask anything..." }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;
    
    onSend(input);
    setInput("");
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background/80 backdrop-blur-md border-t border-border/50">
      <div className="max-w-3xl mx-auto relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
        
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-secondary/50 rounded-2xl border border-white/5 p-2 shadow-xl">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[50px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 text-base placeholder:text-muted-foreground/50 scrollbar-hide"
            rows={1}
          />
          
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || disabled}
            className={cn(
              "h-10 w-10 mb-1 mr-1 rounded-xl transition-all duration-300",
              input.trim() 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {disabled ? (
              <Sparkles className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" />
            )}
          </Button>
        </form>
        
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}
