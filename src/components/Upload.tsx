import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload as UploadIcon, FileText, ArrowRight, Info, ChevronLeft, Settings2, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";

interface UploadProps {
  initialText?: string;
  initialInstructions?: string;
  onNext: (text: string, instructions: string) => void;
  onBack: () => void;
}

export function Upload({ initialText = "", initialInstructions = "Redact all personal names, email addresses, and specific financial amounts.", onNext, onBack }: UploadProps) {
  const [text, setText] = useState(initialText);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_FILE_SIZE = 100_000; // 100KB
  const ALLOWED_EXTENSIONS = ['.txt', '.md'];

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type "${ext}". Please upload a .txt or .md file.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (${(file.size / 1000).toFixed(0)}KB). Maximum size is ${MAX_FILE_SIZE / 1000}KB.`;
    }
    return null;
  };

  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) { setFileError(error); return; }
      setFileError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) { setFileError(error); return; }
      setFileError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="pt-32 pb-32 px-8 max-w-7xl mx-auto relative z-10">
      <div className="mb-12 flex items-end justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-tertiary hover:text-primary transition-colors mb-6"
          >
            <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </button>
          <h2 className="text-4xl md:text-5xl font-serif italic">Initialize Redaction</h2>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay: 0.1 }}
          className="hidden md:flex items-center gap-4"
        >
           <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10 backdrop-blur-sm">
             <ShieldAlert className="w-4 h-4 text-primary" />
             <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Secure Session</span>
           </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const, delay: 0.2 }}
        className="grid md:grid-cols-2 gap-8"
      >
        {/* Left Column: Configuration */}
        <div className="flex flex-col gap-6 h-full">
          <div className="card-premium p-8 bg-white/80 backdrop-blur-md border border-primary/10 shadow-sm flex-1 flex flex-col group/config transition-all duration-500 hover:shadow-md hover:border-primary/20">
            <div className="flex items-center gap-3 mb-6 border-b border-primary/5 pb-6 shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover/config:bg-primary/10 transition-colors duration-500">
                <Settings2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-xl italic">Disclosure Policy</h3>
                <p className="text-[10px] font-mono uppercase tracking-widest text-tertiary">AI Instructions</p>
              </div>
            </div>
            
            <div className="relative group flex-1 min-h-[200px]">
              <textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="absolute inset-0 w-full h-full resize-none bg-neutral/50 border border-primary/10 rounded-xl p-6 text-base leading-relaxed focus:outline-none focus:border-primary/30 focus:bg-white transition-all duration-500 font-sans shadow-inner"
                placeholder="Describe exactly what should be redacted... (e.g., 'Redact all personal names, email addresses, and specific financial amounts.')"
              />
              <div className="absolute bottom-4 right-4 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(15,17,19,0.5)]" />
              </div>
            </div>
            <div className="mt-6 shrink-0 flex items-start gap-3 text-tertiary/60 bg-primary/5 p-4 rounded-xl border border-primary/5 transition-colors duration-500 group-hover/config:bg-primary/[0.07]">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
              <p className="text-[10px] leading-relaxed italic">
                The NLP engine will use these parameters to identify and suggest redactions. You will review all suggestions before finalization.
              </p>
            </div>
          </div>

          <button 
            onClick={() => onNext(text, instructions)}
            disabled={!text.trim()}
            className="btn-primary w-full flex items-center justify-between p-6 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-primary/10 shrink-0 relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]"
          >
            <span className="font-serif italic text-lg relative z-10">Analyze Document</span>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors duration-500 relative z-10 group-hover:scale-110">
              <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
            </div>
            {/* Button shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
          </button>

          <AnimatePresence>
            {fileError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-sm text-center"
              >
                {fileError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Document Input */}
        <div className="flex flex-col h-full">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "h-full min-h-[600px] rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col overflow-hidden relative group/editor",
              isDragging ? "border-primary bg-primary/5 scale-[1.02] shadow-xl" : "border-primary/10 bg-white/80 backdrop-blur-md hover:border-primary/20",
              text ? "border-solid border-primary/10 shadow-sm hover:shadow-md" : ""
            )}
          >
            {/* Header of the editor */}
            <div className="flex justify-between items-center p-6 border-b border-primary/5 bg-neutral/30 transition-colors duration-500 group-hover/editor:bg-neutral/50">
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-tertiary">
                <FileText className={cn("w-4 h-4 transition-colors duration-500", text ? "text-primary" : "")} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={text ? "loaded" : "awaiting"}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {text ? "Document Loaded" : "Awaiting Input"}
                  </motion.span>
                </AnimatePresence>
              </div>
              <label className="cursor-pointer text-[10px] font-mono uppercase tracking-widest text-primary hover:text-primary/70 transition-all duration-300 px-4 py-2 rounded-full border border-primary/10 bg-white shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0">
                <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md" />
                Browse Files
              </label>
            </div>

            {/* Editor Body */}
            <div className="flex-1 relative p-8 flex flex-col">
              <AnimatePresence>
                {!text && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  >
                    <div className={cn(
                      "w-24 h-24 mb-6 rounded-full flex items-center justify-center transition-all duration-500",
                      isDragging ? "bg-primary/10 scale-110" : "bg-primary/5 group-hover/editor:bg-primary/10"
                    )}>
                      <UploadIcon className={cn(
                        "w-8 h-8 transition-all duration-500",
                        isDragging ? "text-primary scale-110" : "text-primary/40 group-hover/editor:text-primary/60"
                      )} />
                    </div>
                    <p className="text-lg font-serif italic text-tertiary mb-2">Drag & drop your document here</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-tertiary/40">Supports .txt, .md</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 w-full bg-transparent border-none focus:outline-none text-base font-sans leading-loose resize-none placeholder:text-transparent relative z-10 transition-colors duration-300"
                placeholder="Or paste your text directly..."
              />
            </div>

            {/* Footer of the editor */}
            <AnimatePresence>
              {text && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="p-4 border-t border-primary/5 bg-neutral/30 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-tertiary/60"
                >
                  <div className="flex gap-6">
                    <span>{text.split(/\s+/).filter(Boolean).length} Words</span>
                    <span>{text.length} Characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-primary">Ready for Analysis</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
