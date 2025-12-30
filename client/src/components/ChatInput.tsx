import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Paperclip, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/hooks/use-upload";

interface ChatInputProps {
  onSend: (content: string, attachment?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Ask anything..." }: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const [attachment, setAttachment] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setAttachment(response.objectPath);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
    // Reset file input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachment) || disabled || isUploading) return;
    
    onSend(input, attachment || undefined);
    setInput("");
    setAttachment(null);
    
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
        
        <form onSubmit={handleSubmit} className="relative flex flex-col bg-secondary/50 rounded-2xl border border-white/5 p-2 shadow-xl">
          {attachment && (
            <div className="flex items-center gap-2 p-2 mb-2 bg-background/50 rounded-lg border border-border/50 w-fit">
              {attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) || attachment.startsWith("/objects/") ? (
                <div className="relative w-10 h-10 rounded overflow-hidden">
                  <img src={attachment} alt="Attachment preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {attachment.split("/").pop()}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setAttachment(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || isUploading}
              className="h-10 w-10 mb-1 ml-1 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isUploading}
              className="min-h-[50px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 text-base placeholder:text-muted-foreground/50 scrollbar-hide"
              rows={1}
            />
            
            <Button 
              type="submit" 
              size="icon"
              disabled={(!input.trim() && !attachment) || disabled || isUploading}
              className={cn(
                "h-10 w-10 mb-1 mr-1 rounded-xl transition-all duration-300",
                (input.trim() || attachment) && !isUploading
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
          </div>
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
