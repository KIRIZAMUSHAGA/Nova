import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Paperclip, X, Loader2, FileIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/hooks/use-upload";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type FileStatus = "IDLE" | "SELECTED" | "PROCESSING" | "READY" | "UPLOADING" | "SUCCESS" | "ERROR";

interface ChatInputProps {
  onSend: (content: string, attachment?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];

export function ChatInput({ onSend, disabled: parentDisabled, placeholder = "Ask anything..." }: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<FileStatus>("IDLE");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [attachmentPath, setAttachmentPath] = React.useState<string | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { uploadFile } = useUpload();

  const resetFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus("IDLE");
    setErrorMessage(null);
    setAttachmentPath(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setStatus("SELECTED");
    setErrorMessage(null);

    // 2. Pre-traitement local
    setStatus("PROCESSING");
    
    // Validation
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage("Fichier trop lourd (max 20Mo)");
      setStatus("ERROR");
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setErrorMessage("Format non supporté");
      setStatus("ERROR");
      return;
    }

    setFile(selectedFile);
    
    // Preview generation
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }

    // Simulate small delay for "preparation" feel and metadata check
    setTimeout(() => {
      setStatus("READY");
    }, 500);
  };

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const canSend = (input.trim() || status === "READY") && 
                    status !== "PROCESSING" && 
                    status !== "UPLOADING" && 
                    !parentDisabled;

    if (!canSend) return;

    let finalAttachment = attachmentPath;

    if (file && status === "READY") {
      setStatus("UPLOADING");
      try {
        const response = await uploadFile(file);
        if (response) {
          finalAttachment = response.objectPath;
          setStatus("SUCCESS");
        } else {
          setStatus("ERROR");
          setErrorMessage("Échec de l'upload");
          return;
        }
      } catch (err) {
        setStatus("ERROR");
        setErrorMessage("Erreur lors de l'envoi");
        return;
      }
    }

    onSend(input, finalAttachment || undefined);
    setInput("");
    resetFile();
    
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

  const isUploading = status === "UPLOADING";
  const isProcessing = status === "PROCESSING";
  const hasError = status === "ERROR";
  const isReady = status === "READY" || (status === "IDLE" && input.trim() !== "");
  
  const sendDisabled = parentDisabled || isProcessing || isUploading || (status !== "IDLE" && status !== "READY" && status !== "SUCCESS" && !input.trim());

  const getTooltipContent = () => {
    if (isProcessing) return "Préparation du fichier...";
    if (isUploading) return "Envoi du fichier...";
    if (hasError) return errorMessage || "Erreur avec le fichier";
    if (!input.trim() && status === "IDLE") return "Écrivez un message ou joignez un fichier";
    return null;
  };

  const tooltip = getTooltipContent();

  return (
    <div className="p-4 md:p-6 bg-background/80 backdrop-blur-md border-t border-border/50">
      <div className="max-w-3xl mx-auto relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
        
        <form onSubmit={handleSubmit} className="relative flex flex-col bg-secondary/50 rounded-2xl border border-white/5 p-2 shadow-xl">
          {/* File Preview Area */}
          {(file || hasError) && (
            <div className="flex items-center gap-3 p-3 mb-2 bg-background/50 rounded-xl border border-border/50 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-white/10">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                )}
                {(isProcessing || isUploading) && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate text-foreground/90">
                    {file?.name || "Fichier"}
                  </span>
                  {hasError && <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
                  {isProcessing && "Préparation..."}
                  {isUploading && "Upload en cours..."}
                  {status === "READY" && "Prêt à l'envoi"}
                  {hasError && (
                    <span className="text-destructive">{errorMessage || "Erreur"}</span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive shrink-0"
                onClick={resetFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept={ALLOWED_TYPES.join(",")}
            />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={parentDisabled || isUploading || isProcessing}
                    className="h-10 w-10 mb-1 ml-1 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Joindre un fichier (Max 20Mo)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={parentDisabled || isUploading}
              className="min-h-[50px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 text-base placeholder:text-muted-foreground/50 scrollbar-hide"
              rows={1}
            />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={sendDisabled}
                      className={cn(
                        "h-10 w-10 mb-1 mr-1 rounded-xl transition-all duration-300",
                        !sendDisabled
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80 opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 ml-0.5" />
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {tooltip && (
                  <TooltipContent side="top">
                    <p>{tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
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
