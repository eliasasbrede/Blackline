import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, Shield, ArrowRight, Info, AlertCircle, ChevronLeft, FileText, Lock, User, Undo2, Redo2, MousePointer2 } from "lucide-react";
import { Redaction } from "../types";
import { cn } from "../lib/utils";

interface RedactionReviewProps {
  globalMode: 'redact' | 'substitute';
  text: string;
  redactions: Redaction[];
  reviewerName: string;
  reviewerEmail: string;
  onUpdateRedactions: (redactions: Redaction[]) => void;
  onUpdateReviewer: (name: string, email: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function RedactionReview({ globalMode, text, redactions, reviewerName, reviewerEmail, onUpdateRedactions, onUpdateReviewer, onNext, onBack }: RedactionReviewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [manualSelection, setManualSelection] = useState<{
    text: string;
    startIndex: number;
    endIndex: number;
    top: number;
    left: number;
  } | null>(null);
  
  const [history, setHistory] = useState<Redaction[][]>([redactions]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Keyboard undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (historyIndex < history.length - 1) {
            const nextIdx = historyIndex + 1;
            setHistoryIndex(nextIdx);
            onUpdateRedactions(history[nextIdx]);
          }
        } else {
          if (historyIndex > 0) {
            const prevIdx = historyIndex - 1;
            setHistoryIndex(prevIdx);
            onUpdateRedactions(history[prevIdx]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, onUpdateRedactions]);

  // Sync scrolling between the two text panes
  const originalRef = useRef<HTMLDivElement>(null);
  const redactedRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement | null>) => {
    if (targetRef.current) {
      targetRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleUpdateAndPushHistory = (updated: Redaction[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updated);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onUpdateRedactions(updated);
  };

  const handleActionChange = (id: string, action: Redaction['action']) => {
    const updated = redactions.map(r => r.id === id ? { ...r, status: 'accepted' as const, action } : r);
    handleUpdateAndPushHistory(updated);
  };

  const handleSubstituteChange = (id: string, proposedSubstitute: string) => {
    const updated = redactions.map(r => r.id === id ? { ...r, proposedSubstitute } : r);
    // Don't push to history on every keystroke, just update the current state
    onUpdateRedactions(updated);
  };
  
  const handleAcceptAll = () => {
    const updated = redactions.map(r => r.status === 'suggested' ? { ...r, status: 'accepted' as const, action: globalMode } : r);
    handleUpdateAndPushHistory(updated);
  };
  
  const handleKeepAll = () => {
    const updated = redactions.map(r => r.status === 'suggested' ? { ...r, status: 'accepted' as const, action: 'keep' as const } : r);
    handleUpdateAndPushHistory(updated);
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      onUpdateRedactions(history[prevIdx]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      onUpdateRedactions(history[nextIdx]);
    }
  };

  const handleSelectionChange = () => {
    const textContainer = document.getElementById("original-text-container");
    if (!textContainer || !originalRef.current) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setManualSelection(null);
      return;
    }

    if (!textContainer.contains(sel.anchorNode)) {
      setManualSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    
    // Traverse DOM to find exact character offset robustly, skipping injected UI labels
    let currentStart = 0;
    let currentEnd = 0;
    let startFound = false;
    let endFound = false;

    const traverse = (node: Node) => {
      if (startFound && endFound) return;
      
      // Skip injected UI elements so our character count exactly matches the raw text string
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).hasAttribute('data-is-label')) {
        return;
      }
      
      if (node === range.startContainer) {
        currentStart += range.startOffset;
        startFound = true;
      }
      
      if (node === range.endContainer) {
        currentEnd += range.endOffset;
        endFound = true;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const len = (node.textContent || '').length;
        if (!startFound && node !== range.startContainer) currentStart += len;
        if (!endFound && node !== range.endContainer) currentEnd += len;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
        }
      }
    };

    traverse(textContainer);

    const finalStart = Math.min(currentStart, currentEnd);
    const finalEnd = Math.max(currentStart, currentEnd);
    const finalText = text.substring(finalStart, finalEnd);

    if (finalText.trim().length === 0) {
      setManualSelection(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = originalRef.current.getBoundingClientRect();

    setManualSelection({
      text: finalText,
      startIndex: finalStart,
      endIndex: finalEnd,
      top: rect.top - containerRect.top + originalRef.current.scrollTop - 40,
      left: rect.left - containerRect.left + (rect.width / 2)
    });
  };

  const addManualRedaction = (type: string) => {
    if (!manualSelection) return;
    
    const { text: selText, startIndex, endIndex } = manualSelection;
    
    // Remove existing redactions that overlap with our manual selection
    const nonOverlapping = redactions.filter(r => 
      r.endIndex <= startIndex || r.startIndex >= endIndex
    );

    const newRedaction: Redaction = {
      id: crypto.randomUUID(),
      text: selText,
      startIndex,
      endIndex,
      type,
      confidence: 1.0,
      status: 'manual',
      action: globalMode,
      proposedSubstitute: globalMode === 'substitute' ? 'a sensitive entity' : undefined,
      reason: 'Manually added by reviewer'
    };
    
    handleUpdateAndPushHistory([...nonOverlapping, newRedaction]);
    setManualSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const renderOriginalText = () => {
    const sortedRedactions = [...redactions].sort((a, b) => a.startIndex - b.startIndex);
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedRedactions.forEach((redaction, index) => {
      if (redaction.startIndex > lastIndex) {
        result.push(
          <span key={`text-${index}`} className="text-primary/90 transition-colors duration-500">
            {text.substring(lastIndex, redaction.startIndex)}
          </span>
        );
      }

      const isAccepted = redaction.status === 'accepted' || redaction.status === 'manual';
      const isSuggested = redaction.status === 'suggested';
      const isKept = isAccepted && redaction.action === 'keep';

      if (!isKept) {
        result.push(
          <motion.span
            key={`orig-${redaction.id}`}
            layoutId={`orig-${redaction.id}`}
            onClick={() => setActiveId(redaction.id)}
            animate={{
              backgroundColor: redaction.status === 'manual' ? "var(--color-accent)" : isAccepted ? "var(--color-primary)" : isSuggested ? "rgba(15, 17, 19, 0.05)" : "transparent",
              color: (isAccepted || redaction.status === 'manual') ? "var(--color-neutral)" : isSuggested ? "rgba(15, 17, 19, 0.6)" : "inherit",
              borderColor: (isAccepted || redaction.status === 'manual') ? "transparent" : "rgba(15, 17, 19, 0.3)"
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
            className={cn(
              "relative inline-block cursor-pointer rounded-sm px-1 mx-0.5 border-b border-dashed group/orig",
              activeId === redaction.id ? "ring-2 ring-primary/20 ring-offset-2 ring-offset-white" : "hover:bg-primary/5 hover:border-primary/50 transition-colors duration-300"
            )}
          >
            {redaction.text}
            {isSuggested && (
              <motion.span 
                data-is-label="true"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: activeId === redaction.id ? 1 : 0, y: activeId === redaction.id ? 0 : 5 }}
                className="absolute -top-5 left-0 text-[7px] font-mono tracking-[0.2em] text-tertiary uppercase bg-white px-1.5 py-0.5 rounded shadow-sm border border-primary/10 group-hover/orig:opacity-100 group-hover/orig:translate-y-0 transition-all duration-300 z-20 pointer-events-none select-none"
              >
                {redaction.type}
              </motion.span>
            )}
          </motion.span>
        );
      } else {
        result.push(
          <span key={`text-rejected-${index}`} className="text-primary/90">
            {text.substring(redaction.startIndex, redaction.endIndex)}
          </span>
        );
      }

      lastIndex = redaction.endIndex;
    });

    if (lastIndex < text.length) {
      result.push(
        <span key="text-end" className="text-primary/90 transition-colors duration-500">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return result;
  };

  const renderRedactedText = () => {
    const sortedRedactions = [...redactions].sort((a, b) => a.startIndex - b.startIndex);
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedRedactions.forEach((redaction, index) => {
      if (redaction.startIndex > lastIndex) {
        result.push(
          <span key={`r-text-${index}`} className="text-primary/90 transition-colors duration-500">
            {text.substring(lastIndex, redaction.startIndex)}
          </span>
        );
      }

      const isAccepted = redaction.status === 'accepted' || redaction.status === 'manual';
      const isSuggested = redaction.status === 'suggested';
      const isKept = isAccepted && redaction.action === 'keep';

      if (isAccepted && !isKept) {
        const displayText = redaction.action === 'substitute' ? (redaction.proposedSubstitute || "[SUBSTITUTED]") : "[REDACTED]";
        result.push(
          <motion.span
            key={`redact-${redaction.id}`}
            layoutId={`redact-${redaction.id}`}
            onClick={() => setActiveId(redaction.id)}
            className={cn(
              "relative inline-block cursor-pointer rounded-sm px-1 mx-0.5 group/redact",
              redaction.action === 'substitute' ? "redaction-block-substitute" : "redaction-block",
              activeId === redaction.id ? "ring-2 ring-primary/20 ring-offset-2 ring-offset-neutral" : ""
            )}
          >
            {displayText}
            <span className="absolute inset-0 bg-primary opacity-0 group-hover/redact:opacity-10 transition-opacity duration-300 rounded-sm pointer-events-none" />
          </motion.span>
        );
      } else if (isSuggested) {
        result.push(
          <motion.span
            key={`redact-sug-${redaction.id}`}
            onClick={() => setActiveId(redaction.id)}
            animate={{ backgroundColor: activeId === redaction.id ? "rgba(15, 17, 19, 0.08)" : "transparent" }}
            className={cn(
              "relative inline-block transition-all duration-300 cursor-pointer rounded-sm px-1 mx-0.5 text-primary/40 hover:bg-primary/5",
              activeId === redaction.id ? "ring-1 ring-primary/15" : ""
            )}
          >
            {redaction.text}
          </motion.span>
        );
      } else {
        result.push(
          <span key={`r-text-rejected-${index}`} className="text-primary/90">
            {text.substring(redaction.startIndex, redaction.endIndex)}
          </span>
        );
      }

      lastIndex = redaction.endIndex;
    });

    if (lastIndex < text.length) {
      result.push(
        <span key="r-text-end" className="text-primary/90 transition-colors duration-500">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return result;
  };

  const activeRedaction = redactions.find(r => r.id === activeId);
  const pendingCount = redactions.filter(r => r.status === 'suggested').length;

  return (
    <div className="pt-32 pb-32 px-8 max-w-[1800px] mx-auto w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="space-y-4"
        >
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-tertiary hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-3 h-3 transition-transform duration-300 group-hover:-translate-x-1" />
            Edit Policy
          </button>
          <h2 className="text-5xl md:text-6xl font-serif italic">Human Verification</h2>
          <p className="text-tertiary font-light text-lg max-w-2xl">
            AI brings efficiency, but the final responsibility stays with you. Verify all identified entities before generating the blockchain proof.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const }}
          className="flex items-center gap-6"
        >
          <div className="flex items-center gap-2 bg-white border border-border rounded-full p-1.5 shadow-sm">
             <button onClick={handleAcceptAll} disabled={pendingCount === 0} className="hover:bg-primary/5 px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest disabled:opacity-30 transition-colors">Accept All</button>
             <div className="w-px h-4 bg-border" />
             <button onClick={handleKeepAll} disabled={pendingCount === 0} className="hover:bg-primary/5 px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest disabled:opacity-30 transition-colors">Keep All</button>
             <div className="w-px h-4 bg-border" />
             <button onClick={undo} disabled={historyIndex === 0} className="p-1.5 hover:bg-primary/5 rounded-full disabled:opacity-30 transition-colors" title="Undo (Cmd+Z)"><Undo2 className="w-4 h-4" /></button>
             <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-1.5 hover:bg-primary/5 rounded-full disabled:opacity-30 transition-colors" title="Redo (Cmd+Shift+Z)"><Redo2 className="w-4 h-4" /></button>
          </div>
          <motion.div 
            animate={{ backgroundColor: pendingCount === 0 ? "rgba(34, 197, 94, 0.1)" : "white" }}
            className="flex items-center gap-3 px-6 py-3 border border-border rounded-full shadow-sm transition-colors duration-500"
          >
            <div className={cn("w-2 h-2 rounded-full transition-colors duration-500", pendingCount === 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]")} />
            <span className={cn("text-[10px] font-mono uppercase tracking-widest transition-colors duration-500", pendingCount === 0 ? "text-green-700 font-bold" : "text-tertiary")}>
              {pendingCount === 0 ? "All Verified" : `${pendingCount} Pending`}
            </span>
          </motion.div>
          <button 
            onClick={onNext}
            disabled={pendingCount > 0}
            className="btn-primary flex items-center gap-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            <span className="relative z-10">Finalize Release</span>
            <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            {!pendingCount && (
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
            )}
          </button>
        </motion.div>
      </div>

      {/* Global Manual Override Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
        className="mb-8 flex items-center gap-5 p-5 rounded-2xl bg-white border border-accent/20 shadow-sm relative overflow-hidden group/banner"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent -translate-x-full group-hover/banner:translate-x-full duration-[2s] transition-transform ease-in-out pointer-events-none" />
        <div className="shrink-0 w-10 h-10 rounded-full bg-accent/5 flex items-center justify-center border border-accent/10 relative z-10">
          <MousePointer2 className="w-5 h-5 text-accent group-hover/banner:scale-110 transition-transform duration-300" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-widest text-accent font-bold mb-1">Targeted Override</h4>
            <p className="text-[15px] font-serif text-tertiary leading-relaxed">
               Notice an entity the AI missed? Highlight any string within the <span className="text-primary italic">Original Document</span> pane to snap a custom redaction to your release.
            </p>
          </div>
          <span className="shrink-0 px-3 py-1 rounded bg-accent/5 border border-accent/10 text-[9px] font-mono uppercase tracking-widest text-accent">Instruction Rule</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-[70vh] min-h-[600px]">
        
        {/* Left Column: Original Text */}
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
          className="lg:col-span-4 card-premium flex flex-col h-full bg-white shadow-sm border border-border overflow-hidden relative group"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-border bg-neutral/30 shrink-0 relative z-10 gap-3">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-tertiary group-hover:text-primary transition-colors duration-500" />
              <span className="block text-[10px] font-mono uppercase tracking-widest text-tertiary group-hover:text-primary transition-colors duration-500">Original Document</span>
            </div>
            <span className="text-[9px] font-mono text-tertiary/40 uppercase tracking-widest hidden sm:block">Analysis View</span>
          </div>
          <div 
            ref={originalRef}
            onScroll={(e) => handleScroll(e, redactedRef)}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            className="p-8 overflow-y-auto font-serif text-lg leading-[2] flex-1 relative z-10"
          >
            <div id="original-text-container" className="whitespace-pre-wrap relative z-0">
              {renderOriginalText()}
            </div>
            
            <AnimatePresence>
              {manualSelection && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  className="absolute z-50 flex items-center gap-1 bg-white border border-border rounded-lg shadow-xl p-1.5 backdrop-blur-md"
                  style={{ top: manualSelection.top, left: manualSelection.left, x: "-50%" }}
                >
                  <div className="text-[9px] font-mono tracking-widest uppercase text-tertiary px-2 whitespace-nowrap hidden sm:block">Action:</div>
                  <button onClick={() => addManualRedaction('manual')} className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded text-[10px] font-mono uppercase tracking-widest transition-colors duration-200 shadow-sm border border-primary/10">Redact</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Middle Column: Redacted Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
          className="lg:col-span-4 card-premium flex flex-col h-full bg-neutral/30 shadow-sm border border-border overflow-hidden relative group"
        >
          <div className="absolute inset-0 bg-noise pointer-events-none" />
          <div className="flex items-center justify-between p-6 border-b border-border bg-white shrink-0 relative z-10">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-medium">Redacted Preview</span>
            </div>
            <span className="text-[9px] font-mono text-primary/40 uppercase tracking-widest">Live Output</span>
          </div>
          <div 
            ref={redactedRef}
            onScroll={(e) => handleScroll(e, originalRef)}
            className="p-8 overflow-y-auto font-serif text-lg leading-[2] flex-1 relative z-10 bg-white/50 backdrop-blur-sm transition-all duration-700"
            style={{ filter: pendingCount > 0 ? "blur(0.5px)" : "blur(0px)" }}
          >
            <div className="whitespace-pre-wrap relative z-0">
              {renderRedactedText()}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
          className="lg:col-span-4 space-y-6 flex flex-col h-full"
        >
          {/* Entity Properties Card */}
          <div className="card-premium flex flex-col bg-white border border-border shadow-sm shrink-0 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent overflow-hidden">
              <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-1/2 h-full bg-primary/40"
              />
            </div>
            <div className="flex items-center justify-between p-6 border-b border-border bg-neutral/30 shrink-0">
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-tertiary">
                <Shield className="w-4 h-4 text-primary" />
                <span>Entity Inspector</span>
              </div>
            </div>

            <div className="p-8 relative z-10">
              <AnimatePresence mode="wait">
                {activeRedaction ? (
                  <motion.div 
                    key={activeRedaction.id}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <div className="text-[9px] font-mono tracking-[0.2em] text-tertiary uppercase">Selected Fragment</div>
                      <div className="text-2xl font-serif text-primary italic leading-tight break-words">{activeRedaction.text}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 border-y border-border py-4">
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono tracking-[0.2em] text-tertiary uppercase">Classification</div>
                        <div className="text-xs font-medium uppercase tracking-widest text-primary">
                          {activeRedaction.type === 'instruction' ? 'User Instruction' : activeRedaction.type === 'manual' ? 'Manual Override' : activeRedaction.type}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono tracking-[0.2em] text-tertiary uppercase">Confidence</div>
                        <div className="text-xs font-medium text-primary">{(activeRedaction.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="space-y-2 bg-neutral/50 p-4 rounded-xl border border-border">
                      <div className="text-[9px] font-mono tracking-[0.2em] text-tertiary uppercase flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        AI Analysis
                      </div>
                      <div className="text-xs text-tertiary font-light leading-relaxed italic">
                        {activeRedaction.reason || "Identified as sensitive information based on disclosure policy."}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => handleActionChange(activeRedaction.id, 'redact')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-300 text-[10px] uppercase tracking-widest font-medium shadow-sm active:scale-[0.98] group/btn",
                          activeRedaction.status !== 'suggested' && activeRedaction.action === 'redact' ? "bg-primary text-neutral border-primary shadow-md shadow-primary/20" : "bg-white border-border hover:border-primary/30 hover:bg-neutral/50"
                        )}
                      >
                        Redact
                      </button>
                      <button 
                        onClick={() => handleActionChange(activeRedaction.id, 'substitute')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-300 text-[10px] uppercase tracking-widest font-medium shadow-sm active:scale-[0.98] group/btn",
                          activeRedaction.status !== 'suggested' && activeRedaction.action === 'substitute' ? "bg-accent text-white border-accent shadow-md shadow-accent/20" : "bg-white border-border hover:border-accent/30 hover:bg-neutral/50"
                        )}
                      >
                        Substitute
                      </button>
                      <button 
                        onClick={() => handleActionChange(activeRedaction.id, 'keep')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-300 text-[10px] uppercase tracking-widest font-medium shadow-sm active:scale-[0.98] group/btn",
                          activeRedaction.status !== 'suggested' && activeRedaction.action === 'keep' ? "bg-neutral text-primary border-primary shadow-md shadow-primary/10" : "bg-white border-border hover:border-border/80 hover:bg-neutral/50 text-tertiary hover:text-primary"
                        )}
                      >
                        <X className="w-3 h-3 transition-transform duration-300 group-hover/btn:scale-110" />
                        Keep
                      </button>
                    </div>

                    <AnimatePresence>
                      {activeRedaction.action === 'substitute' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          <div className="text-[9px] font-mono tracking-[0.2em] text-tertiary uppercase mt-4">Semantic Substitute</div>
                          <input
                            type="text"
                            value={activeRedaction.proposedSubstitute || ''}
                            onChange={(e) => handleSubstituteChange(activeRedaction.id, e.target.value)}
                            placeholder="e.g. 'a financial institution'"
                            className="w-full bg-neutral/50 border border-primary/20 focus:border-accent focus:ring-1 focus:ring-accent/20 rounded-xl px-4 py-3 text-sm text-primary transition-all duration-300 placeholder:text-tertiary/40 font-mono shadow-inner"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center opacity-40"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-4 transition-transform duration-500 hover:scale-110 hover:bg-primary/10">
                      <Info className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-xs font-mono uppercase tracking-widest text-tertiary">Select entity to review</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Reviewer Identity Card */}
          <div className="card-premium flex flex-col bg-white border border-border shadow-sm shrink-0 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border bg-neutral/30 shrink-0">
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-tertiary">
                <User className="w-4 h-4 text-primary" />
                <span>Reviewer Identity</span>
              </div>
              <span className="text-[9px] font-mono text-tertiary/40 uppercase tracking-widest">Optional</span>
            </div>
            <div className="p-6 space-y-3">
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => onUpdateReviewer(e.target.value, reviewerEmail)}
                placeholder="Name (e.g. Jane Smith)"
                className="w-full bg-neutral/50 border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 transition-all duration-300 placeholder:text-tertiary/40"
              />
              <input
                type="email"
                value={reviewerEmail}
                onChange={(e) => onUpdateReviewer(reviewerName, e.target.value)}
                placeholder="Email (e.g. jane@company.com)"
                className="w-full bg-neutral/50 border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 transition-all duration-300 placeholder:text-tertiary/40"
              />
            </div>
          </div>

          {/* Pending Review List */}
          <div className="card-premium flex-1 overflow-hidden flex flex-col bg-white border border-border shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-border bg-neutral/30 shrink-0">
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-tertiary">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span>Pending Review</span>
              </div>
              <span className="text-[9px] font-mono text-tertiary/40 uppercase tracking-widest">{pendingCount} Items</span>
            </div>

            <div className="p-6 space-y-2 flex-1 overflow-y-auto relative">
              <AnimatePresence>
                {redactions.filter(r => r.status === 'suggested').map(r => (
                  <motion.button 
                    key={r.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
                    onClick={() => setActiveId(r.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border text-sm transition-all duration-300 flex justify-between items-center group shadow-sm",
                      activeId === r.id ? "bg-primary/5 border-primary/30 ring-1 ring-primary/10" : "bg-white border-border hover:border-primary/30 hover:bg-neutral/50 hover:shadow-md"
                    )}
                  >
                    <span className="font-serif italic truncate mr-3 text-primary text-sm">{r.text}</span>
                    <span className="text-[7px] font-mono tracking-widest uppercase text-tertiary/60 group-hover:text-primary transition-colors shrink-0">{r.type}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
              
              <AnimatePresence>
                {redactions.length > 0 && pendingCount === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                    className="absolute inset-0 flex flex-col items-center justify-center py-8 text-center bg-white/80 backdrop-blur-sm z-10"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                      className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20 shadow-lg shadow-green-500/10"
                    >
                      <Check className="w-6 h-6 text-green-600" />
                    </motion.div>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-[10px] font-mono text-primary font-bold uppercase tracking-[0.2em]"
                    >
                      Verification Complete
                    </motion.p>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-tertiary font-light mt-2"
                    >
                      Ready for cryptographic proof generation.
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {redactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center h-full opacity-50">
                   <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-[8px] font-mono text-tertiary uppercase tracking-[0.2em]">No entities identified</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
