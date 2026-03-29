import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Lock, FileText, Zap, ArrowRight, Menu, Check, X, Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";

export function Header({ onHome, onRedact, isLanding = false }: { onHome?: () => void, onRedact?: () => void, isLanding?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    if (!isLanding && onHome) {
      onHome();
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center bg-neutral/80 backdrop-blur-md border-b border-primary/5">
      <button 
        onClick={onHome}
        className="flex items-center gap-3 hover:opacity-70 transition-opacity cursor-pointer group"
      >
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <Shield className="w-4 h-4 text-neutral relative z-10" />
        </div>
        <span className="font-serif text-xl tracking-tight font-medium italic">Blackline</span>
      </button>
      
      <nav className="hidden md:flex items-center gap-10">
        <button onClick={() => scrollToSection('protocol')} className="text-[11px] font-mono uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">Protocol</button>
        <button onClick={() => scrollToSection('security')} className="text-[11px] font-mono uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">Security</button>
        <button onClick={() => scrollToSection('enterprise')} className="text-[11px] font-mono uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">Enterprise</button>
        {onRedact && (
          <button onClick={onRedact} className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary font-bold hover:opacity-70 transition-opacity">Redact</button>
        )}
      </nav>
      
      <div className="flex items-center gap-6">
        <span className="hidden sm:inline text-[9px] font-mono text-tertiary/60 uppercase tracking-widest">v1.0.0-mvp</span>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 rounded-full border border-primary/10 flex items-center justify-center hover:bg-primary/5 transition-colors relative z-50 md:hidden"
        >
          {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-primary/5 p-8 shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-6">
              <button onClick={() => scrollToSection('protocol')} className="text-sm font-mono uppercase tracking-widest text-left hover:text-primary transition-colors">Protocol</button>
              <button onClick={() => scrollToSection('security')} className="text-sm font-mono uppercase tracking-widest text-left hover:text-primary transition-colors">Security</button>
              <button onClick={() => scrollToSection('enterprise')} className="text-sm font-mono uppercase tracking-widest text-left hover:text-primary transition-colors">Enterprise</button>
              {onRedact && (
                <button onClick={() => { onRedact(); setIsMenuOpen(false); }} className="text-sm font-mono uppercase tracking-widest text-left text-primary font-bold">Redact</button>
              )}
              <hr className="border-primary/5" />
              <button onClick={() => { if(onHome) onHome(); setIsMenuOpen(false); }} className="text-sm font-mono uppercase tracking-widest text-left hover:text-primary transition-colors">Home</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Landing({ onStart }: { onStart: () => void }) {
  const [demoStep, setDemoStep] = useState<'original' | 'review' | 'final'>('original');

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
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } }
  };

  return (
    <div className="pt-32 pb-32 px-8 max-w-7xl mx-auto relative z-10">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-12 gap-12 items-center mb-24">
        <div className="lg:col-span-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/5 mb-8 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(15,17,19,0.5)]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">Midnight Network — Preview</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl lg:text-8xl font-serif leading-[0.9] mb-8 italic">
              Selective <br />
              <span className="text-tertiary/40">Disclosure.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-tertiary max-w-lg leading-relaxed font-light mb-10">
              The industry standard for privacy-first document release. Redact sensitive intelligence with AI precision and generate cryptographic proofs of integrity.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <button onClick={onStart} className="btn-primary group flex items-center justify-center gap-3 relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]">
                <span className="relative z-10">Initialize Protocol</span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
              </button>
              <button onClick={() => document.getElementById('protocol')?.scrollIntoView({ behavior: 'smooth' })} className="btn-outline group transition-all duration-500 hover:shadow-md active:scale-[0.98]">
                Explore Protocol
                <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 inline-block" />
              </button>
            </motion.div>
          </motion.div>
        </div>
        
        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative"
          >
            <div className="card-premium p-5 md:p-6 overflow-hidden relative shadow-2xl bg-white/80 backdrop-blur-md border border-primary/10 group/demo transition-all duration-500 hover:shadow-primary/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 pointer-events-none transition-opacity duration-500 group-hover/demo:opacity-100" />
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-tertiary">Live Demo</span>
                </div>
                <div className="flex bg-neutral/80 backdrop-blur-sm rounded-full p-1 border border-primary/5 shadow-inner">
                  <button 
                    onClick={() => setDemoStep('original')}
                    className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest transition-all",
                      demoStep === 'original' ? "bg-primary text-neutral shadow-sm" : "text-tertiary hover:text-primary"
                    )}
                  >
                    Original
                  </button>
                  <button 
                    onClick={() => setDemoStep('review')}
                    className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest transition-all",
                      demoStep === 'review' ? "bg-primary text-neutral shadow-sm" : "text-tertiary hover:text-primary"
                    )}
                  >
                    Review
                  </button>
                  <button 
                    onClick={() => setDemoStep('final')}
                    className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest transition-all",
                      demoStep === 'final' ? "bg-primary text-neutral shadow-sm" : "text-tertiary hover:text-primary"
                    )}
                  >
                    Final
                  </button>
                </div>
              </div>

              <div className="bg-neutral/50 rounded-xl p-5 font-serif text-sm leading-relaxed relative min-h-[160px] border border-primary/5 shadow-inner overflow-hidden">
                <AnimatePresence mode="wait">
                  {demoStep === 'original' && (
                    <motion.div
                      key="original"
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.4 }}
                      className="space-y-3 relative z-10"
                    >
                      <p>Subject: Project Midnight - Q1 Financial Summary</p>
                      <p>The total acquisition cost for <span className="bg-primary/5 px-1 rounded transition-colors duration-300 hover:bg-primary/10">Stellar Dynamics Ltd</span> was <span className="bg-primary/5 px-1 rounded transition-colors duration-300 hover:bg-primary/10">$42,500,000</span>. This transaction was overseen by <span className="bg-primary/5 px-1 rounded transition-colors duration-300 hover:bg-primary/10">Martin Smith</span> and finalized on March 28, 2026.</p>
                      <p>Please contact <span className="bg-primary/5 px-1 rounded transition-colors duration-300 hover:bg-primary/10">m.smith@blackline.io</span> for further details.</p>
                    </motion.div>
                  )}
                  {demoStep === 'review' && (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.4 }}
                      className="space-y-3 relative z-10"
                    >
                      <p>Subject: Project Midnight - Q1 Financial Summary</p>
                      <p>The total acquisition cost for <span className="bg-primary/10 text-primary border-b border-primary/30 px-1 rounded-sm relative group cursor-pointer transition-all duration-300 hover:bg-primary/20">Stellar Dynamics Ltd<span className="absolute -top-4 left-0 text-[6px] font-mono tracking-[0.2em] text-tertiary uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white px-1 rounded shadow-sm border border-primary/10">ORG</span></span> was <span className="bg-primary/10 text-primary border-b border-primary/30 px-1 rounded-sm relative group cursor-pointer transition-all duration-300 hover:bg-primary/20">$42,500,000<span className="absolute -top-4 left-0 text-[6px] font-mono tracking-[0.2em] text-tertiary uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white px-1 rounded shadow-sm border border-primary/10">MONEY</span></span>. This transaction was overseen by <span className="bg-primary/10 text-primary border-b border-primary/30 px-1 rounded-sm relative group cursor-pointer transition-all duration-300 hover:bg-primary/20">Martin Smith<span className="absolute -top-4 left-0 text-[6px] font-mono tracking-[0.2em] text-tertiary uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white px-1 rounded shadow-sm border border-primary/10">PERSON</span></span> and finalized on March 28, 2026.</p>
                      <p>Please contact <span className="bg-primary/10 text-primary border-b border-primary/30 px-1 rounded-sm relative group cursor-pointer transition-all duration-300 hover:bg-primary/20">m.smith@blackline.io<span className="absolute -top-4 left-0 text-[6px] font-mono tracking-[0.2em] text-tertiary uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white px-1 rounded shadow-sm border border-primary/10">EMAIL</span></span> for further details.</p>
                    </motion.div>
                  )}
                  {demoStep === 'final' && (
                    <motion.div
                      key="final"
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.4 }}
                      className="space-y-3 relative z-10"
                    >
                      <p>Subject: Project Midnight - Q1 Financial Summary</p>
                      <p>The total acquisition cost for <span className="redaction-block px-1">REDACTED ENTITY</span> was <span className="redaction-block px-1">REDACTED AMOUNT</span>. This transaction was overseen by <span className="redaction-block px-1">REDACTED NAME</span> and finalized on March 28, 2026.</p>
                      <p>Please contact <span className="redaction-block px-1">REDACTED EMAIL</span> for further details.</p>
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mt-6 pt-4 border-t border-primary/10 text-[8px] font-mono text-tertiary/60 uppercase tracking-widest space-y-1 overflow-hidden"
                      >
                        <p>=================================================================</p>
                        <p className="text-primary font-bold">CRYPTOGRAPHIC PROOF OF DISCLOSURE</p>
                        <p>=================================================================</p>
                        <p>SHA-256 HASH : e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                        <p>ORIGINAL HASH: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92</p>
                        <p>TIMESTAMP    : 2026-03-28T18:42:00Z</p>
                        <p>REVIEWER     : m.smith@blackline.io</p>
                        <p>=================================================================</p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex justify-between items-center relative z-10">
                <div className="flex -space-x-2">
                  {['BL', 'JS', 'MR'].map((initials, index) => (
                    <motion.div 
                      key={initials} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (index * 0.1) }}
                      className="w-5 h-5 rounded-full border border-white bg-neutral flex items-center justify-center overflow-hidden shadow-sm hover:z-10 hover:scale-110 transition-transform duration-300"
                    >
                      <span className="text-[6px] font-mono font-bold text-primary">{initials}</span>
                    </motion.div>
                  ))}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="w-5 h-5 rounded-full border border-white bg-primary flex items-center justify-center text-[7px] text-neutral font-mono shadow-sm z-10"
                  >
                    +12
                  </motion.div>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] font-mono text-tertiary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-full">
                  <Lock className="w-2.5 h-2.5" />
                  <span>SHA-256 Verified</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Protocol Section */}
      <section id="protocol" className="py-32 border-t border-primary/5">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif mb-6 italic">The Blackline Process.</h2>
          <p className="text-xl text-tertiary font-light leading-relaxed max-w-2xl">
            AI brings efficiency, but humans stay in control. You are always the last step in the process to verify everything.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-16">
          {[
            {
              icon: Zap,
              title: "1. Upload & AI Proposal",
              desc: "Upload documents securely. Our AI engine analyzes the text and makes a comprehensive redaction proposal based on your instructions."
            },
            {
              icon: Shield,
              title: "2. Human Reviews & Accepts",
              desc: "The human is the last step in the process. You review the AI's suggestions, accept or reject them, and stay in complete control."
            },
            {
              icon: FileText,
              title: "3. Blockchain Proof",
              desc: "Generate a cryptographic hash of the final version. Blockchain brings proof and traceability to your redacted documents."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] as const }}
              className="space-y-6 relative group"
            >
              {i !== 2 && (
                <div className="hidden md:block absolute top-6 left-16 right-0 h-[1px] bg-gradient-to-r from-primary/10 to-transparent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 ease-out" />
              )}
              <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center shadow-sm relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:shadow-md group-hover:border-primary/20">
                <feature.icon className="w-6 h-6 text-primary transition-transform duration-500 group-hover:rotate-12" />
              </div>
              <h3 className="text-2xl italic min-h-[4rem] transition-colors duration-300 group-hover:text-primary">{feature.title}</h3>
              <p className="text-tertiary leading-relaxed font-light">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-32 border-t border-primary/5">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="max-w-3xl"
        >
          <h2 className="text-4xl md:text-5xl font-serif mb-8 italic">Uncompromising Security.</h2>
          <p className="text-xl text-tertiary font-light leading-relaxed mb-12">
            Blackline is built on the Midnight network, leveraging zero-knowledge proofs to ensure that your sensitive data never leaves your control. We provide cryptographic certainty in an uncertain world.
          </p>
          <div className="grid sm:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)" }}
              transition={{ duration: 0.3 }}
              className="p-8 bg-white/80 backdrop-blur-sm border border-border rounded-3xl transition-colors duration-300 hover:border-primary/20"
            >
              <h4 className="font-serif text-xl mb-4 italic text-primary">Zero-Knowledge</h4>
              <p className="text-sm text-tertiary leading-relaxed">Prove document integrity without revealing a single byte of redacted content.</p>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)" }}
              transition={{ duration: 0.3 }}
              className="p-8 bg-white/80 backdrop-blur-sm border border-border rounded-3xl transition-colors duration-300 hover:border-primary/20"
            >
              <h4 className="font-serif text-xl mb-4 italic text-primary">Server-Side AI</h4>
              <p className="text-sm text-tertiary leading-relaxed">AI analysis is processed server-side. Your document text is never stored or persisted beyond the active session.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Enterprise Section */}
      <section id="enterprise" className="py-32 border-t border-primary/5">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-16 md:flex md:items-end md:justify-between gap-8"
        >
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-serif mb-6 italic">Enterprise Scale.</h2>
            <p className="text-lg text-tertiary font-light leading-relaxed">
              From global law firms to government agencies, Blackline provides the infrastructure needed for secure, high-volume document disclosure with guaranteed compliance.
            </p>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-20">
          {[
            { title: "Automated Pipelines", desc: "Batch process thousands of documents simultaneously using custom-trained AI models." },
            { title: "Advanced RBAC", desc: "Granular role-based access control for reviewers, approvers, and external auditors." },
            { title: "Private Deployment", desc: "Deploy entirely on-premise or within your organization's private VPC." },
            { title: "Audit Trails", desc: "Immutable cryptographic logs of every redaction decision and document access." },
            { title: "Custom AI Models", desc: "Fine-tune redaction engines for specific legal domains or proprietary data types." },
            { title: "Dedicated Support", desc: "24/7 SLA-backed support with direct access to our security engineering team." }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="space-y-3 group"
            >
              <div className="flex items-center gap-3 text-sm font-medium text-primary">
                <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:bg-primary/10">
                  <Check className="w-3 h-3 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                {feature.title}
              </div>
              <p className="text-sm text-tertiary font-light leading-relaxed pl-9 transition-colors duration-300 group-hover:text-tertiary/80">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Slim Black Box CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="card-premium p-8 md:p-10 bg-primary text-neutral flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl group/cta"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none transition-transform duration-1000 group-hover/cta:scale-150" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay pointer-events-none" />
          
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-6 md:mb-4 backdrop-blur-sm">
              <Shield className="w-3 h-3 text-neutral" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral/80">Custom Solutions</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-serif mb-2 italic">Secure your workflow.</h3>
            <p className="text-neutral/70 font-light text-sm leading-relaxed">
              Get a tailored demonstration of how Blackline can integrate with your existing compliance infrastructure.
            </p>
          </div>
          <a href="mailto:hello@blackline.io" className="relative z-10 w-full md:w-auto whitespace-nowrap py-4 px-8 bg-neutral text-primary rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-neutral/90 transition-all duration-500 flex items-center justify-center gap-3 shrink-0 hover:scale-105 hover:shadow-xl active:scale-95 group/contact no-underline">
            Contact Sales
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/contact:translate-x-1" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
