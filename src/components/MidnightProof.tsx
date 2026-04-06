import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Lock, ArrowRight, AlertCircle, CheckCircle2, ChevronLeft, Activity, Network, Wallet, Boxes, Copy, Check, ExternalLink } from "lucide-react";
import { ReleaseManifest, WalletState, AttestationState } from "../types";
import { midnightService, buildAttestationPayload, AttestationPayload } from "../services/midnightService";
import { cn } from "../lib/utils";

interface MidnightProofProps {
  manifest: ReleaseManifest;
  onBack: () => void;
  onAttestationComplete?: (attestation: AttestationState) => void;
}

function truncateAddress(addr: string | null, chars = 8): string {
  if (!addr) return "—";
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="ml-2 text-tertiary/40 hover:text-primary transition-colors">
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export function MidnightProof({ manifest, onBack, onAttestationComplete }: MidnightProofProps) {
  const [walletState, setWalletState] = useState<WalletState>({
    available: false,
    connected: false,
    address: null,
    balance: null,
    network: 'preprod',
    connectionStatus: 'disconnected',
  });
  const [attestationState, setAttestationState] = useState<'IDLE' | 'PREPARING' | 'SIGNING' | 'CONFIRMED' | 'FAILED'>('IDLE');
  const [attestationResult, setAttestationResult] = useState<AttestationState | null>(manifest.attestation || null);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<AttestationPayload | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  // Check wallet availability with graceful polling to allow content scripts to inject
  useEffect(() => {
    let timeoutId: number;
    let intervalId: number;

    const checkAvailability = () => {
      const info = midnightService.getWalletInfo();
      if (info) {
        setWalletState(prev => ({ 
          ...prev, 
          available: true,
          walletName: info.name,
          walletIcon: info.icon
        }));
        setIsDetecting(false);
        return true;
      }
      return false;
    };

    if (checkAvailability()) return;

    // Polling if not immediately available
    intervalId = window.setInterval(() => {
      if (checkAvailability()) {
        window.clearInterval(intervalId);
        window.clearTimeout(timeoutId);
      }
    }, 200);

    // Give up after 1500ms
    timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setWalletState(prev => ({ ...prev, available: false }));
      setIsDetecting(false);
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Build attestation payload on mount
  useEffect(() => {
    buildAttestationPayload(manifest).then(setPayload);
  }, [manifest]);

  // Check connection status periodically
  useEffect(() => {
    if (!walletState.connected) return;
    const interval = setInterval(async () => {
      const status = await midnightService.checkConnectionStatus();
      if (status === 'disconnected') {
        setWalletState(prev => ({ ...prev, connected: false, connectionStatus: 'disconnected', address: null, balance: null }));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [walletState.connected]);

  const handleConnect = useCallback(async () => {
    setError(null);
    setWalletState(prev => ({ ...prev, connectionStatus: 'connecting' }));
    try {
      const state = await midnightService.connectWallet();
      setWalletState(state);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet.");
      setWalletState(prev => ({ ...prev, connectionStatus: 'error' }));
    }
  }, []);

  const handleAttest = useCallback(async () => {
    setError(null);
    setAttestationState('PREPARING');
    try {
      const result = await midnightService.attestManifest(manifest, (state) => {
        setAttestationState(state as any);
      });
      setAttestationResult(result);
      setAttestationState('CONFIRMED');
      onAttestationComplete?.(result);
    } catch (err: any) {
      setError(err.message || "Attestation signing failed.");
      setAttestationState('FAILED');
    }
  }, [manifest, onAttestationComplete]);

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
        {/* Header */}
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">Midnight Attestation</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-serif mb-8 italic leading-[0.9]">Cryptographic <br /><span className="text-tertiary/40">Attestation.</span></h2>
          <p className="text-tertiary font-light text-xl max-w-2xl mx-auto leading-relaxed">
            Sign your release manifest with your Midnight wallet to create a verifiable attestation tied to your identity.
          </p>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-3xl mx-auto bg-destructive/5 text-destructive border border-destructive/20 p-4 rounded-xl mb-12 text-sm flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success State */}
        {attestationState === 'CONFIRMED' && attestationResult ? (
          <motion.div key="success" variants={itemVariants} className="max-w-4xl mx-auto">
            <div className="card-premium p-12 bg-green-500/5 border border-green-500/10 flex flex-col items-center text-center relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                <CheckCircle2 className="w-64 h-64 text-green-700" />
              </div>
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-8 border border-green-500/20 relative z-10 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-serif text-3xl italic text-primary mb-4 relative z-10">Attestation Signed</h3>
              <p className="text-tertiary font-light leading-relaxed mb-8 max-w-md relative z-10">
                Your release manifest has been cryptographically signed via {attestationResult.walletAddress ? 'your connected wallet' : 'the Midnight Lace wallet'}. The signature below is a verifiable proof of authorization.
              </p>

              <div className="w-full bg-white/50 rounded-2xl p-6 border border-border text-left backdrop-blur-sm relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center text-xs border-b border-border pb-3">
                  <span className="font-mono text-tertiary/40 uppercase tracking-widest">Status</span>
                  <span className="font-mono text-green-600 font-medium px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    WALLET SIGNED
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-border pb-3">
                  <span className="font-mono text-tertiary/40 uppercase tracking-widest">Network</span>
                  <span className="font-mono text-primary font-medium px-2 py-0.5 bg-primary/5 rounded border border-primary/10">PREPROD</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-border pb-3">
                  <span className="font-mono text-tertiary/40 uppercase tracking-widest">Wallet</span>
                  <span className="font-mono text-primary flex items-center">
                    {truncateAddress(attestationResult.walletAddress || null)}
                    {attestationResult.walletAddress && <CopyButton text={attestationResult.walletAddress} />}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-border pb-3">
                  <span className="font-mono text-tertiary/40 uppercase tracking-widest">Document ID</span>
                  <span className="font-mono text-primary text-[10px] truncate max-w-[200px] md:max-w-[400px] flex items-center">
                    {attestationResult.documentId || '—'}
                    {attestationResult.documentId && <CopyButton text={attestationResult.documentId} />}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-border pb-3">
                  <span className="font-mono text-tertiary/40 uppercase tracking-widest">Metadata Hash</span>
                  <span className="font-mono text-primary text-[10px] truncate max-w-[200px] md:max-w-[400px] flex items-center">
                    {attestationResult.metadataHash || '—'}
                    {attestationResult.metadataHash && <CopyButton text={attestationResult.metadataHash} />}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-border pb-3">
                  <span className="font-mono text-tertiary/40 uppercase tracking-widest">Signed At</span>
                  <span className="font-mono text-primary">{attestationResult.attestedAt || '—'}</span>
                </div>
                <div className="flex flex-col gap-2 text-xs pt-1">
                  <span className="font-mono text-tertiary/40 uppercase tracking-widest">Verifying Key</span>
                  <span className="font-mono text-primary text-[9px] break-all bg-neutral/50 p-3 rounded-lg border border-border">
                    {attestationResult.signature?.verifyingKey || '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-xs pt-1">
                  <span className="font-mono text-tertiary/40 uppercase tracking-widest">Signature</span>
                  <span className="font-mono text-primary text-[9px] break-all bg-neutral/50 p-3 rounded-lg border border-border max-h-24 overflow-y-auto">
                    {attestationResult.signature?.signature || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* On-chain note */}
            <div className="max-w-4xl mx-auto bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-tertiary text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary/60 font-bold">Next Step</span>
              <span className="mx-2 text-border">·</span>
              On-chain persistence via Compact contract requires Docker proof server and DUST tokens on Preprod.
            </div>
          </motion.div>
        ) : (
          /* Main flow: connect + attest */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Left: Attestation Payload */}
            <motion.div variants={itemVariants} className="card-premium p-12 bg-white/80 backdrop-blur-md relative overflow-hidden group shadow-xl shadow-primary/5 border border-border transition-all duration-500 hover:shadow-2xl hover:border-primary/20">
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-neutral border border-border flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary/5 transition-colors duration-500">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-3xl italic mb-4 text-primary">Attestation Payload</h3>
                <p className="text-tertiary font-light leading-relaxed mb-8 text-sm">
                  The following hashes will be signed by your wallet. Only cryptographic hashes are attested — no document content leaves your machine.
                </p>

                <div className="bg-neutral/50 p-6 rounded-2xl border border-border flex-1 flex flex-col relative group-hover:bg-neutral/80 transition-colors duration-500">
                  {payload ? (
                    <pre className="text-[10px] font-mono leading-relaxed text-tertiary whitespace-pre-wrap overflow-hidden">
{`{
  documentId:   "${payload.documentId.substring(0, 16)}...",
  metadataHash: "${payload.metadataHash.substring(0, 16)}...",
  originalHash: "${payload.originalHash.substring(0, 16)}...",
  redactedHash: "${payload.redactedHash.substring(0, 16)}...",
  mode:         "${payload.mode}",
  timestamp:    "${payload.timestamp}",
  appVersion:   "${payload.appVersion}"
}`}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-tertiary/40 text-sm">Building payload...</div>
                  )}
                  <p className="mt-4 pt-4 border-t border-primary/10 text-[9px] font-mono text-tertiary/60 italic uppercase tracking-widest">
                    Target Contract: attestation.compact
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right: Wallet + Action */}
            <motion.div variants={itemVariants} className="card-premium p-12 bg-neutral/30 backdrop-blur-sm border border-border flex flex-col relative overflow-hidden transition-all duration-500 hover:bg-white/80 group">
              <div className="relative z-10 flex flex-col h-full justify-between items-center text-center">

                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                  {walletState.connected ? <Activity className="w-6 h-6 text-primary" /> : <Wallet className="w-6 h-6 text-primary/40" />}
                </div>

                {/* Detecting wallet state */}
                {isDetecting ? (
                  <div className="flex flex-col items-center">
                    <p className="font-serif text-2xl italic text-primary mb-3">Detecting Wallet</p>
                    <p className="text-tertiary text-sm max-w-[260px] leading-relaxed mb-8">
                      Looking for Midnight wallet providers...
                    </p>
                    <div className="flex items-center justify-center p-4">
                      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  </div>
                ) : 
                /* No wallet installed */
                !walletState.available ? (
                  <div className="flex flex-col items-center">
                    <p className="font-serif text-2xl italic text-primary mb-3">Wallet Required</p>
                    <p className="text-tertiary text-sm max-w-[260px] leading-relaxed mb-8">
                      Install a Midnight-compatible browser extension to sign attestations.
                    </p>
                    <a
                      href="https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary w-full text-[10px] uppercase font-mono tracking-widest px-12 py-4 rounded-full flex items-center justify-center gap-2 no-underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Install Lace Wallet
                    </a>
                  </div>

                /* Wallet available but not connected */
                ) : !walletState.connected ? (
                  <div className="flex flex-col items-center w-full">
                    <p className="font-serif text-2xl italic text-primary mb-3">Ready to Connect</p>
                    <p className="text-tertiary text-sm max-w-[260px] leading-relaxed mb-8">
                      Connect your {walletState.walletName || 'Midnight wallet'} to authorize the attestation signature.
                    </p>
                    <button
                      onClick={handleConnect}
                      disabled={walletState.connectionStatus === 'connecting'}
                      className="btn-secondary w-full text-[10px] uppercase font-mono tracking-widest px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {walletState.connectionStatus === 'connecting' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                          Connecting...
                        </div>
                      ) : (
                        <>
                          {walletState.walletIcon ? <img src={walletState.walletIcon} alt="" className="w-4 h-4 rounded-full" /> : <Network className="w-4 h-4" />}
                          Connect {walletState.walletName || 'Wallet'}
                        </>
                      )}
                    </button>
                  </div>

                /* Connected */
                ) : (
                  <div className="flex flex-col items-center w-full gap-6">
                    {/* Connection info */}
                    <div className="w-full flex flex-col gap-3">
                      <div className="flex items-center justify-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-mono tracking-widest text-green-700 uppercase">{walletState.walletName || 'Wallet'} Connected</span>
                      </div>

                      <div className="bg-neutral/50 rounded-xl p-4 border border-border text-left w-full">
                        <div className="flex justify-between items-center text-[10px] mb-2">
                          <span className="font-mono text-tertiary/40 uppercase tracking-widest">Address</span>
                          <span className="font-mono text-primary flex items-center">
                            {truncateAddress(walletState.address)}
                            {walletState.address && <CopyButton text={walletState.address} />}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] mb-2">
                          <span className="font-mono text-tertiary/40 uppercase tracking-widest">Network</span>
                          <span className="font-mono text-primary uppercase">{walletState.network}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-mono text-tertiary/40 uppercase tracking-widest">Balance</span>
                          <span className="font-mono text-primary">
                            {walletState.balance ? `${walletState.balance.dust.toString()} DUST` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attest button */}
                    <button
                      onClick={handleAttest}
                      disabled={attestationState !== 'IDLE' && attestationState !== 'FAILED'}
                      className="btn-primary w-full text-[10px] uppercase font-mono tracking-widest px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-1 overflow-hidden relative disabled:opacity-50"
                    >
                      {attestationState === 'PREPARING' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span className="animate-pulse">Building Attestation...</span>
                        </div>
                      ) : attestationState === 'SIGNING' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span className="animate-pulse">Awaiting Wallet Signature...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Sign Release Attestation
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      )}
                    </button>

                    <p className="text-[9px] font-mono text-tertiary/40 uppercase tracking-widest text-center leading-relaxed">
                      Your wallet will prompt you to sign the attestation payload. No tokens are spent.
                    </p>
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
