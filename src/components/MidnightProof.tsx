import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Fingerprint, Lock, ArrowRight, Info, AlertCircle, CheckCircle2, ChevronLeft, Activity, Network, Wallet, Boxes } from "lucide-react";
import { ReleaseManifest } from "../types";
import { midnightService, AttestationPayload } from "../services/midnightService";

interface MidnightProofProps {
  manifest: ReleaseManifest;
  onBack: () => void;
}

export function MidnightProof({ manifest, onBack }: MidnightProofProps) {
  const [isLaceAvailable, setIsLaceAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [attestationState, setAttestationState] = useState<'IDLE' | 'PREPARING' | 'SUBMITTING' | 'CONFIRMED' | 'FAILED'>('IDLE');
  const [txResult, setTxResult] = useState<{ txHash: string; contractAddress: string; network: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAvailability = () => {
      setIsLaceAvailable(midnightService.isWalletAvailable());
    };
    checkAvailability();
    const interval = setInterval(checkAvailability, 1000); 
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setError(null);
    try {
      const connected = await midnightService.connectWallet();
      setIsConnected(connected);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet.");
    }
  };

  const handleAttest = async () => {
    setError(null);
    setAttestationState('PREPARING');
    try {
      const payload: AttestationPayload = {
        originalHash: manifest.originalHash,
        redactedHash: manifest.hash,
        timestamp: manifest.timestamp,
        reviewerName: manifest.reviewerName || "Anonymous",
        reviewerEmail: manifest.reviewerEmail || "No Email",
        policy: manifest.policy,
        appVersion: "Blackline_v1.0"
      };
      
      const result = await midnightService.submitOnChainAttestation(payload, (state) => {
        setAttestationState(state as any);
      });
      
      setTxResult(result);
      setAttestationState('CONFIRMED');
    } catch (err: any) {
      setError(err.message || "Attestation transaction failed.");
      setAttestationState('FAILED');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
  };

  return (
    <div className="pt-32 pb-32 px-8 max-w-[1600px] mx-auto w-full relative z-10">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto">
        <motion.div variants={itemVariants} className="text-center mb-20">
          <button 
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-tertiary hover:text-primary transition-colors mb-12"
          >
            <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Back to Manifest
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/5 mb-4 backdrop-blur-sm">
            <Boxes className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">Midnight Attestation · Preview</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-serif mb-8 italic leading-[0.9]">On-Chain <br /><span className="text-tertiary/40">Persistence.</span></h2>
          <p className="text-tertiary font-light text-xl max-w-2xl mx-auto leading-relaxed">
            Prepare an attestation payload and sign it via the Midnight Lace wallet. Full on-chain deployment requires a compiled Compact contract.
          </p>

          <div className="max-w-3xl mx-auto mt-8 bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-tertiary text-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary/60 font-bold">Preview Mode</span>
            <span className="mx-2 text-border">·</span>
            Transaction hashes are simulated until a compactc-compiled contract is deployed to Midnight Preprod.
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="max-w-3xl mx-auto bg-destructive/5 text-destructive border border-destructive/20 p-4 rounded-xl mb-12 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </motion.div>
        )}

        {attestationState === 'CONFIRMED' && txResult ? (
          <motion.div key="success" variants={itemVariants} className="max-w-3xl mx-auto card-premium p-12 bg-green-500/5 border border-green-500/10 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
              <CheckCircle2 className="w-64 h-64 text-green-700" />
            </div>
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-8 border border-green-500/20 relative z-10 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="font-serif text-3xl italic text-primary mb-4 relative z-10">Attestation Signed</h3>
            <p className="text-tertiary font-light leading-relaxed mb-8 max-w-md relative z-10">
              Your release manifest has been signed via the Midnight Lace wallet. The values below are preview identifiers — full on-chain persistence requires a deployed Compact contract.
            </p>
            
            <div className="w-full bg-white/50 rounded-2xl p-6 border border-border text-left backdrop-blur-sm relative z-10 flex flex-col gap-4">
               <div className="flex justify-between items-center text-xs border-b border-border pb-3">
                 <span className="font-mono text-tertiary/40 uppercase tracking-widest">Network</span>
                 <span className="font-mono text-primary font-medium px-2 py-0.5 bg-primary/5 rounded border border-primary/10">{txResult.network.toUpperCase()}</span>
               </div>
               <div className="flex justify-between items-center text-xs border-b border-border pb-3">
                 <span className="font-mono text-tertiary/40 uppercase tracking-widest">Contract Board ID</span>
                 <span className="font-mono text-primary truncate max-w-[200px] md:max-w-full">{txResult.contractAddress}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="font-mono text-tertiary/40 uppercase tracking-widest">Transaction Hash</span>
                 <span className="font-mono text-primary truncate max-w-[200px] md:max-w-full">{txResult.txHash}</span>
               </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <motion.div variants={itemVariants} className="card-premium p-12 bg-white/80 backdrop-blur-md relative overflow-hidden group shadow-xl shadow-primary/5 border border-border transition-all duration-500 hover:shadow-2xl hover:border-primary/20">
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-neutral border border-border flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary/5 transition-colors duration-500">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-3xl italic mb-4 text-primary">Map Structure</h3>
                <p className="text-tertiary font-light leading-relaxed mb-8 text-sm">
                  Review the cryptographic release manifest map. If compiled with `compactc`, this exact sequence is piped through the WASM builder, generating state updates strictly against your wallet authority.
                </p>
                
                <div className="bg-neutral/50 p-6 rounded-2xl border border-border flex-1 flex flex-col relative group-hover:bg-neutral/80 transition-colors duration-500">
                  <pre className="text-[10px] font-mono leading-relaxed text-tertiary whitespace-pre-wrap overflow-hidden">
{`{
  originalHash: "${manifest.originalHash.substring(0, 16)}...",
  redactedHash: "${manifest.hash.substring(0, 16)}...",
  timestamp: "${manifest.timestamp}",
  appVersion: "Blackline_v1.0"
}`}
                  </pre>
                  <p className="mt-4 pt-4 border-t border-primary/10 text-[9px] font-mono text-tertiary/60 italic uppercase tracking-widest">
                    Target Board: attestation.compact
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card-premium p-12 bg-neutral/30 backdrop-blur-sm border border-border flex flex-col relative overflow-hidden transition-all duration-500 hover:bg-white/80 group">
              <div className="relative z-10 flex flex-col h-full justify-between items-center text-center">
                
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                  {isConnected ? <Activity className="w-6 h-6 text-primary" /> : <Wallet className="w-6 h-6 text-primary/40" />}
                </div>

                {!isLaceAvailable ? (
                  <div className="flex flex-col items-center">
                    <p className="font-serif text-2xl italic text-primary mb-3">Wallet Missing</p>
                    <p className="text-tertiary text-sm max-w-[240px] leading-relaxed mb-8">Midnight Lace extension not detected. Please install and refresh.</p>
                    <button disabled className="btn-secondary w-full text-[10px] uppercase font-mono tracking-widest opacity-50 cursor-not-allowed px-12 py-4 rounded-full">Extension Not Detected</button>
                  </div>
                ) : !isConnected ? (
                  <div className="flex flex-col items-center w-full">
                     <p className="font-serif text-2xl italic text-primary mb-3">Ready to Connect</p>
                     <p className="text-tertiary text-sm max-w-[240px] leading-relaxed mb-8">Authorizing the connection will bridge Blackline safely into your Midnight Lace dashboard.</p>
                     <button onClick={handleConnect} className="btn-secondary w-full text-[10px] uppercase font-mono tracking-widest px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3">
                       <Network className="w-4 h-4" /> Connect Midnight Lace
                     </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                     <div className="flex items-center gap-2 mb-3 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[10px] font-mono tracking-widest text-green-700 uppercase">Lace Active</span>
                     </div>
                     <p className="text-tertiary text-sm leading-relaxed mb-8">Ready to execute network deployment on Preprod. Requires Dust balance for ledger fees.</p>
                     
                     <button 
                       onClick={handleAttest} 
                       disabled={attestationState !== 'IDLE' && attestationState !== 'FAILED'}
                       className="btn-primary w-full text-[10px] uppercase font-mono tracking-widest px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-1 overflow-hidden relative"
                     >
                       {attestationState === 'PREPARING' ? (
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                           <span className="animate-pulse">Building Prover ZK Params...</span>
                         </div>
                       ) : attestationState === 'SUBMITTING' ? (
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                           <span className="animate-pulse">Awaiting Dust Wallet TX...</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2">
                           Deploy Release to Ledger <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                         </div>
                       )}
                     </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
