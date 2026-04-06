/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "./components/Landing";
import { Landing } from "./components/Landing";
import { Upload } from "./components/Upload";
import { RedactionReview } from "./components/RedactionReview";
import { Manifest } from "./components/Manifest";
import { MidnightProof } from "./components/MidnightProof";
import { AppStep, DocumentState, Redaction, ReleaseManifest, AttestationState } from "./types";
import { suggestRedactions } from "./services/geminiService";
import { Loader2, ShieldAlert } from "lucide-react";

export default function App() {
  const [step, setStep] = useState<AppStep>('LANDING');
  const [docState, setDocState] = useState<DocumentState>({
    mode: 'redact',
    originalText: "",
    redactedText: "",
    redactions: [],
    instructions: "Redact all personal names, email addresses, and specific financial amounts.",
    reviewerName: "",
    reviewerEmail: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error toast after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleStart = () => {
    setDocState({
      mode: 'redact',
      originalText: "",
      redactedText: "",
      redactions: [],
      instructions: "Redact all personal names, email addresses, and specific financial amounts.",
      reviewerName: "",
      reviewerEmail: "",
    });
    setStep('UPLOAD');
  };
  
  const handleUploadNext = async (text: string, instructions: string, mode: 'redact' | 'substitute') => {
    setIsLoading(true);
    setError(null);
    try {
      const suggestions = await suggestRedactions(text, instructions, mode);
      setDocState(prev => ({
        ...prev,
        mode,
        originalText: text,
        instructions,
        redactions: suggestions
      }));
      setStep('REDACT');
    } catch (err) {
      console.error(err);
      setError("Failed to analyze document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedactionUpdate = (redactions: Redaction[]) => {
    setDocState(prev => ({ ...prev, redactions }));
  };

  const handleRedactionNext = async () => {
    setIsLoading(true);
    try {
      // Generate manifest
      const acceptedRedactions = docState.redactions.filter(r => r.status === 'accepted' || r.status === 'manual');
      
      // Generate redacted text
      // We only consider accepted rules or manual rules that don't have action === 'keep'
      const activeRedactions = acceptedRedactions.filter(r => r.action !== 'keep');
      const sortedRedactions = [...activeRedactions].sort((a, b) => a.startIndex - b.startIndex);
      let redactedText = "";
      let lastIndex = 0;
      
      sortedRedactions.forEach((redaction) => {
        if (redaction.startIndex > lastIndex) {
          redactedText += docState.originalText.substring(lastIndex, redaction.startIndex);
        }
        if (redaction.action === 'substitute' && redaction.proposedSubstitute) {
          redactedText += redaction.proposedSubstitute;
        } else {
          redactedText += "[REDACTED]";
        }
        lastIndex = redaction.endIndex;
      });
      
      if (lastIndex < docState.originalText.length) {
        redactedText += docState.originalText.substring(lastIndex);
      }

      // Robust SHA-256 hash generation using Web Crypto API
      const generateHash = async (str: string) => {
        const msgUint8 = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      };

      const originalHash = await generateHash(docState.originalText);
      const finalHash = await generateHash(redactedText);

      const timestamp = new Date().toISOString();
      const reviewerLine = docState.reviewerName
        ? `${docState.reviewerName} <${docState.reviewerEmail}>`
        : docState.reviewerEmail || "Anonymous Reviewer";

      const finalDocumentWithHash = `${redactedText}\n\n=================================================================\nCRYPTOGRAPHIC PROOF OF DISCLOSURE\n=================================================================\nMODE         : ${docState.mode.toUpperCase()}\nSHA-256 HASH : ${finalHash}\nORIGINAL HASH: ${originalHash}\nTIMESTAMP    : ${timestamp}\nREVIEWER     : ${reviewerLine}\n=================================================================`;

      // Generate manifest hash for attestation document ID
      const manifestJson = JSON.stringify({
        mode: docState.mode,
        hash: finalHash,
        originalHash: originalHash,
        timestamp: timestamp,
        policy: docState.instructions,
        redactionCount: acceptedRedactions.length,
      });
      const manifestHash = await generateHash(manifestJson);

      const manifest: ReleaseManifest = {
        mode: docState.mode,
        hash: finalHash,
        originalHash: originalHash,
        timestamp: timestamp,
        reviewerName: docState.reviewerName,
        reviewerEmail: docState.reviewerEmail,
        policy: docState.instructions,
        redactionCount: acceptedRedactions.length,
        manifestHash,
      };

      setDocState(prev => ({ ...prev, manifest, redactedText: finalDocumentWithHash }));
      setStep('MANIFEST');
    } catch (err) {
      console.error("Failed to generate manifest:", err);
      setError("Failed to generate cryptographic proofs.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManifestNext = () => setStep('MIDNIGHT');

  const handleAttestationComplete = (attestation: AttestationState) => {
    setDocState(prev => ({
      ...prev,
      manifest: prev.manifest ? { ...prev.manifest, attestation } : prev.manifest,
    }));
  };

  return (
    <div className="min-h-screen bg-neutral text-primary font-sans selection:bg-primary selection:text-neutral relative">
      <div className="fixed inset-0 bg-noise pointer-events-none z-0" />
      <Header onHome={() => setStep('LANDING')} onRedact={() => setStep('UPLOAD')} isLanding={step === 'LANDING'} />
      
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-neutral/80 flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="w-32 h-32 border border-primary/5 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-32 h-32 border-t border-primary rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-primary/10" />
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 mt-12"
            >
              <h3 className="font-serif text-3xl italic">Analyzing Protocol</h3>
              <div className="flex flex-col items-center gap-2">
                <p className="mt-3 text-tertiary font-mono text-[10px] tracking-[0.2em] uppercase">Selective Disclosure Engine Active</p>
                <div className="w-48 h-[1px] bg-primary/10 relative overflow-hidden mt-2">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary/40 w-1/3"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {step === 'LANDING' && (
            <motion.div key="landing" initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -15, filter: "blur(8px)" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}>
              <Landing onStart={handleStart} />
            </motion.div>
          )}
          
          {step === 'UPLOAD' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -15, filter: "blur(8px)" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}>
              <Upload 
                initialText={docState.originalText}
                initialInstructions={docState.instructions}
                onNext={handleUploadNext} 
                onBack={() => setStep('LANDING')} 
              />
            </motion.div>
          )}

          {step === 'REDACT' && (
            <motion.div key="redact" initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -15, filter: "blur(8px)" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}>
              <RedactionReview 
                globalMode={docState.mode}
                text={docState.originalText}
                redactions={docState.redactions}
                reviewerName={docState.reviewerName}
                reviewerEmail={docState.reviewerEmail}
                onUpdateRedactions={handleRedactionUpdate}
                onUpdateReviewer={(name, email) => setDocState(prev => ({ ...prev, reviewerName: name, reviewerEmail: email }))}
                onNext={handleRedactionNext}
                onBack={() => setStep('UPLOAD')}
              />
            </motion.div>
          )}

          {step === 'MANIFEST' && docState.manifest && (
            <motion.div key="manifest" initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -15, filter: "blur(8px)" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}>
              <Manifest 
                manifest={docState.manifest}
                redactedText={docState.redactedText}
                onNext={handleManifestNext}
                onBack={() => setStep('REDACT')}
              />
            </motion.div>
          )}

          {step === 'MIDNIGHT' && (
            <motion.div key="midnight" initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -15, filter: "blur(8px)" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}>
              <MidnightProof 
                manifest={docState.manifest!}
                onBack={() => setStep('MANIFEST')}
                onAttestationComplete={handleAttestationComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-full text-sm font-medium backdrop-blur-md z-50"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.footer
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        className="fixed bottom-8 left-8 text-[9px] font-mono tracking-widest text-tertiary/40 uppercase z-50"
      >
        © 2026 Blackline Protocol • Selective Disclosure v1.0
      </motion.footer>
    </div>
  );
}
