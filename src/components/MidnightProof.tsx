import React from "react";
import { motion } from "motion/react";
import { Shield, Fingerprint, Lock, ArrowRight, Info, AlertCircle, CheckCircle2, ChevronLeft, Activity } from "lucide-react";

interface MidnightProofProps {
  onBack: () => void;
}

export function MidnightProof({ onBack }: MidnightProofProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
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
        className="max-w-6xl mx-auto"
      >
        <motion.div variants={itemVariants} className="text-center mb-20">
          <button 
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-tertiary hover:text-primary transition-colors mb-12"
          >
            <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Back to Manifest
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/5 mb-8 backdrop-blur-sm">
            <Fingerprint className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">Midnight Proof Protocol</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-serif mb-8 italic leading-[0.9]">Midnight <br /><span className="text-tertiary/40">Verification.</span></h2>
          <p className="text-tertiary font-light text-xl max-w-2xl mx-auto leading-relaxed">
            Generate a zero-knowledge proof that your redactions follow the disclosure policy without revealing the original content.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div variants={itemVariants} className="card-premium p-12 bg-white/80 backdrop-blur-md relative overflow-hidden group shadow-xl shadow-primary/5 border border-border transition-all duration-500 hover:shadow-2xl hover:border-primary/20">
            <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 group-hover:scale-110 transform origin-top-right">
              <Shield className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-neutral border border-border flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary/5 transition-colors duration-500">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-3xl italic mb-4 text-primary">ZKP Generation</h3>
              <p className="text-tertiary font-light leading-relaxed mb-12">
                The Midnight protocol uses zk-SNARKs to prove that the redacted document is a valid subset of the original document, following the approved manifest policy.
              </p>
              
              <div className="space-y-6 mb-12 flex-1">
                <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-primary">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Original Hash Commitment</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-primary">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Redaction Policy Compliance</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-tertiary/40">
                  <div className="w-4 h-4 rounded-full border border-tertiary/20 animate-pulse shadow-[0_0_8px_rgba(119,119,119,0.2)]" />
                  <span>Proof Generation Pending</span>
                </div>
              </div>

              <button className="btn-primary w-full flex items-center justify-center gap-3 mt-auto group/btn relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]">
                <span className="relative z-10">Generate Proof</span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover/btn:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card-premium p-12 bg-neutral/30 backdrop-blur-sm border border-border opacity-80 flex flex-col relative overflow-hidden transition-all duration-500 hover:opacity-100 group">
             <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-700 group-hover:scale-110 transform origin-top-right">
              <Activity className="w-64 h-64" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary/5 transition-colors duration-500">
                <Fingerprint className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-3xl italic mb-4 text-primary">Wallet Connection</h3>
              <p className="text-tertiary font-light leading-relaxed mb-12">
                Connect your Midnight-compatible wallet to sign the proof and publish the verification key to the ledger.
              </p>
              
              <div className="mt-auto p-12 bg-white/50 rounded-3xl border border-border flex flex-col items-center justify-center text-center shadow-inner transition-colors duration-500 group-hover:bg-white/80">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6 text-primary/40" />
                </div>
                <p className="text-[10px] font-mono tracking-[0.3em] text-tertiary/60 uppercase mb-8">No Wallet Connected</p>
                <button className="btn-secondary w-full text-sm tracking-widest uppercase font-mono transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">Connect Wallet</button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="mt-16 p-8 card-premium bg-white/80 backdrop-blur-md border border-border flex flex-col md:flex-row items-center gap-8 shadow-sm transition-all duration-500 hover:shadow-md hover:border-primary/20 group">
          <div className="w-16 h-16 rounded-2xl bg-neutral border border-border flex items-center justify-center shadow-inner shrink-0 group-hover:bg-primary/5 transition-colors duration-500">
            <Info className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-serif text-xl italic text-primary mb-2">Protocol Note</h4>
            <p className="text-tertiary font-light text-sm leading-relaxed">
              ZKP generation is a computationally intensive process. Your browser will generate the proof locally using WebAssembly. This may take several minutes depending on document complexity.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
