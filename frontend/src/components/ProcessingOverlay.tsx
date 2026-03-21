import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const STEPS = [
  { key: "analyzing", label: "Analyzing sketch structure..." },
  { key: "designing", label: "Designing premium UI..." },
  { key: "processing", label: "Generating React code..." },
];

interface Props {
  status?: string;
}

export function ProcessingOverlay({ status }: Props) {
  const [fallbackStep, setFallbackStep] = useState(0);

  // Determine current step from status prop or fallback timer
  const activeIdx = STEPS.findIndex((s) => s.key === status);
  const currentStep = activeIdx >= 0 ? activeIdx : fallbackStep;

  useEffect(() => {
    if (activeIdx >= 0) return; // status-driven, no timer needed
    const interval = setInterval(() => {
      setFallbackStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [activeIdx]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center"
      style={{ backgroundColor: "rgba(10, 14, 20, 0.92)", backdropFilter: "blur(8px)" }}
    >
      <div className="spinner mb-5" />

      <div className="space-y-2 text-center">
        {STEPS.map((step, i) => (
          <p
            key={step.key}
            className="text-xs"
            style={{
              opacity: i === currentStep ? 1 : i < currentStep ? 0.5 : 0.2,
              color: i === currentStep ? "var(--scifi-cyan)" : i < currentStep ? "var(--scifi-green)" : "var(--scifi-text-dim)",
              fontFamily: "'Courier New', monospace",
              fontWeight: i === currentStep ? 600 : 400,
              transition: "all 0.3s",
            }}
          >
            {i < currentStep ? "// " : i === currentStep ? ">> " : "   "}
            {step.label}
          </p>
        ))}
      </div>
    </motion.div>
  );
}
