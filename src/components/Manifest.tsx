import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Download, Fingerprint, FileCheck, ArrowRight, Copy, Check, Lock, ChevronLeft, Database, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ReleaseManifest } from "../types";
import { cn } from "../lib/utils";

interface ManifestProps {
  manifest: ReleaseManifest;
  redactedText: string;
  onNext: () => void;
  onBack: () => void;
}

export function Manifest({ manifest, redactedText, onNext, onBack }: ManifestProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'document' | 'json'>('document');

  const handleCopy = () => {
    const contentToCopy = viewMode === 'document' ? redactedText : JSON.stringify(manifest, null, 2);
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Download redacted text
    const textBlob = new Blob([redactedText], { type: 'text/plain' });
    const textUrl = URL.createObjectURL(textBlob);
    const textLink = document.createElement('a');
    textLink.href = textUrl;
    textLink.download = `redacted_document_${manifest.hash.substring(0, 8)}.txt`;
    document.body.appendChild(textLink);
    textLink.click();
    document.body.removeChild(textLink);
    URL.revokeObjectURL(textUrl);

    // Download manifest JSON
    const jsonBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `manifest_${manifest.hash.substring(0, 8)}.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
  };

  return (
    <div className="pt-32 pb-32 px-8 max-w-[1600px] mx-auto w-full relative z-10">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid lg:grid-cols-12 gap-16 items-start"
      >
        {/* Left Column: Manifest Details */}
        <div className="lg:col-span-5 flex flex-col gap-12">
          <motion.div variants={itemVariants}>
            <button 
              onClick={onBack}
              className="group flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-tertiary hover:text-primary transition-colors mb-8"
            >
              <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
              Back to Review
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/5 mb-8 backdrop-blur-sm">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">Release Manifest v1.0</span>
            </div>
            <h2 className="text-6xl font-serif mb-6 italic leading-[0.9]">Disclosure <br /><span className="text-tertiary/40">Proven.</span></h2>
            <p className="text-tertiary font-light text-lg leading-relaxed max-w-md">
              Your document has been redacted and the release manifest generated. The manifest contains cryptographic proofs of the disclosure policy.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="card-premium bg-white/80 backdrop-blur-md border border-border shadow-sm overflow-hidden group/manifest transition-all duration-500 hover:shadow-md hover:border-primary/20">
            <div className="p-6 border-b border-border bg-neutral/30 flex items-center gap-3 transition-colors duration-500 group-hover/manifest:bg-neutral/50">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-primary font-medium">Cryptographic Manifest</h3>
            </div>
            
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 p-6 border-b border-border hover:bg-neutral/30 transition-colors duration-300">
                <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary mb-2 sm:mb-0">Policy</div>
                <div className="sm:col-span-2 text-sm font-serif italic text-primary">{manifest.policy}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-6 border-b border-border hover:bg-neutral/30 transition-colors duration-300">
                <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary mb-2 sm:mb-0">Mode</div>
                <div className="sm:col-span-2 text-sm font-mono text-primary uppercase">{manifest.mode}</div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 p-6 border-b border-border hover:bg-neutral/30 transition-colors duration-300">
                <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary mb-2 sm:mb-0">Reviewer</div>
                <div className="sm:col-span-2 text-sm font-mono text-primary break-all">
                  {manifest.reviewerName && <span className="font-medium">{manifest.reviewerName}</span>}
                  {manifest.reviewerName && manifest.reviewerEmail && <span className="text-tertiary mx-1">·</span>}
                  {manifest.reviewerEmail && <span className="text-tertiary">{manifest.reviewerEmail}</span>}
                  {!manifest.reviewerName && !manifest.reviewerEmail && <span className="text-tertiary/40 italic">Anonymous Reviewer</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-6 border-b border-border hover:bg-neutral/30 transition-colors duration-300">
                <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary mb-2 sm:mb-0">Redactions</div>
                <div className="sm:col-span-2 text-sm font-mono text-primary">{manifest.redactionCount} Entities Removed</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-6 border-b border-border hover:bg-neutral/30 transition-colors duration-300">
                <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary mb-2 sm:mb-0">Original Hash</div>
                <div className="sm:col-span-2 text-[10px] font-mono text-tertiary break-all">{manifest.originalHash}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-6 bg-primary/5 hover:bg-primary/10 transition-colors duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/manifest:animate-[shimmer_2s_infinite]" />
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary font-medium mb-2 sm:mb-0 flex items-center gap-2 relative z-10">
                  <Lock className="w-3 h-3" />
                  Final Hash
                </div>
                <div className="sm:col-span-2 text-[11px] font-mono text-primary font-medium break-all relative z-10">{manifest.hash}</div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleDownload}
              className="btn-primary flex-1 flex items-center justify-center gap-3 group relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]"
            >
              <span className="relative z-10">Download Release</span>
              <Download className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5" />
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
            </button>
            <button 
              onClick={onNext}
              className="btn-outline flex-1 flex items-center justify-center gap-3 group transition-all duration-500 hover:shadow-md active:scale-[0.98]"
            >
              Blockchain Attestation
              <span className="text-[8px] opacity-60 font-normal ml-1">(Preview)</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* Right Column: Document/JSON Viewer */}
        <motion.div variants={itemVariants} className="lg:col-span-7 h-[800px] flex flex-col">
          <div className="card-premium flex flex-col bg-white/80 backdrop-blur-md shadow-xl shadow-primary/5 relative overflow-hidden h-full border border-border group/viewer transition-all duration-500 hover:shadow-2xl hover:border-primary/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl opacity-50 pointer-events-none transition-opacity duration-500 group-hover/viewer:opacity-70" />
            
            <div className="flex justify-between items-center p-6 border-b border-border bg-neutral/30 relative z-10 shrink-0 transition-colors duration-500 group-hover/viewer:bg-neutral/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewMode('document')}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-all duration-300 px-3 py-1.5 rounded-full",
                    viewMode === 'document' ? "bg-white text-primary shadow-sm border border-border scale-105" : "text-tertiary hover:text-primary hover:bg-white/50"
                  )}
                >
                  <FileCheck className="w-3 h-3" />
                  Redacted Document
                </button>
                <button 
                  onClick={() => setViewMode('json')}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-all duration-300 px-3 py-1.5 rounded-full",
                    viewMode === 'json' ? "bg-white text-primary shadow-sm border border-border scale-105" : "text-tertiary hover:text-primary hover:bg-white/50"
                  )}
                >
                  <Database className="w-3 h-3" />
                  JSON Manifest
                </button>
              </div>
              <button 
                onClick={handleCopy}
                className="text-[10px] font-mono uppercase tracking-widest text-tertiary hover:text-primary transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-white shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={copied ? "copied" : "copy"}
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
                    className="flex items-center gap-2"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto relative z-10 p-8 bg-white/30">
              <AnimatePresence mode="wait">
                {viewMode === 'document' ? (
                  <motion.div 
                    key="document"
                    initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    exit={{ opacity: 0, filter: "blur(4px)", y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                    className="font-serif text-lg leading-[2] text-primary whitespace-pre-wrap markdown-preview"
                  >
                    <ReactMarkdown>{redactedText}</ReactMarkdown>
                  </motion.div>
                ) : (
                  <motion.pre 
                    key="json"
                    initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    exit={{ opacity: 0, filter: "blur(4px)", y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                    className="font-mono text-[13px] leading-relaxed text-primary whitespace-pre-wrap bg-neutral/50 p-6 rounded-xl border border-border shadow-inner"
                  >
                    {JSON.stringify(manifest, null, 2)}
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
            
            <div className="p-4 border-t border-border bg-neutral/30 flex items-center justify-between relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-tertiary/40 relative z-10" />
                </div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-tertiary/60 uppercase">Local Verification Only</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] text-tertiary/40 uppercase">
                <Activity className="w-3 h-3" />
                Protocol v1.0
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
