import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentStep } from "../hooks/useSketchToApp";

interface Props {
  agentStep?: AgentStep;
}

const AUTO_SWITCH_MS = 3500;

export function ProcessingOverlay({ agentStep }: Props) {
  const [internalStep, setInternalStep] = useState<"analyzing" | "generating">("analyzing");
  const [step1Elapsed, setStep1Elapsed] = useState<number | null>(null);
  const [step2Elapsed, setStep2Elapsed] = useState<number | null>(null);
  const [dotCount, setDotCount] = useState(1);

  const activeStep: "analyzing" | "generating" = agentStep ?? internalStep;

  // Fallback timer when agentStep not wired
  useEffect(() => {
    if (agentStep !== undefined) return;
    const t = setTimeout(() => setInternalStep("generating"), AUTO_SWITCH_MS);
    return () => clearTimeout(t);
  }, [agentStep]);

  // Elapsed counter per step
  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      const s = (Date.now() - start) / 1000;
      if (activeStep === "analyzing") setStep1Elapsed(s);
      else setStep2Elapsed(s);
    }, 100);
    return () => clearInterval(iv);
  }, [activeStep]);

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDotCount((d) => (d % 3) + 1), 450);
    return () => clearInterval(t);
  }, []);

  const dots = ".".repeat(dotCount);
  const step1Done = activeStep === "generating";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
    >
      {/* Spinning ring + icon */}
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 rounded-full border-2 border-neutral-100 border-t-neutral-900"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">
            {activeStep === "analyzing" ? "🔍" : "⚡"}
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="w-72 space-y-3">
        {/* Step 1 — Analyze */}
        <motion.div
          layout
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            step1Done
              ? "bg-emerald-50 border border-emerald-100"
              : "bg-neutral-900 border border-neutral-800"
          }`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            step1Done ? "bg-emerald-500" : "bg-white/20"
          }`}>
            {step1Done ? (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-white"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold leading-tight ${
              step1Done ? "text-emerald-700" : "text-white"
            }`}>
              {step1Done ? "Sketch analyzed" : `Analyzing sketch${dots}`}
            </p>
            {!step1Done && (
              <p className="text-[10px] text-white/50 mt-0.5">Reading layout, counting elements</p>
            )}
          </div>
          {step1Elapsed !== null && (
            <span className={`text-[10px] font-mono shrink-0 ${
              step1Done ? "text-emerald-500" : "text-white/40"
            }`}>
              {step1Elapsed.toFixed(1)}s
            </span>
          )}
        </motion.div>

        {/* Step 2 — Generate */}
        <motion.div
          layout
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            activeStep === "generating"
              ? "bg-neutral-900 border border-neutral-800"
              : "bg-neutral-50 border border-neutral-100"
          }`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            activeStep === "generating" ? "bg-white/20" : "bg-neutral-200"
          }`}>
            {activeStep === "generating" ? (
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-white"
              />
            ) : (
              <div className="w-2 h-2 rounded-full bg-neutral-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold leading-tight ${
              activeStep === "generating" ? "text-white" : "text-neutral-300"
            }`}>
              {activeStep === "generating" ? `Building your app${dots}` : "Building your app"}
            </p>
            {activeStep === "generating" && (
              <p className="text-[10px] text-white/50 mt-0.5">Writing React + Tailwind code</p>
            )}
          </div>
          {activeStep === "generating" && step2Elapsed !== null && (
            <span className="text-[10px] text-white/40 font-mono shrink-0">
              {step2Elapsed.toFixed(1)}s
            </span>
          )}
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="w-72 mt-5">
        <div className="h-0.5 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-neutral-900 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: step1Done ? "82%" : "38%" }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence>
        {activeStep === "generating" && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-[10px] text-neutral-400"
          >
            2-step AI agent · Claude Vision + Code Gen
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
