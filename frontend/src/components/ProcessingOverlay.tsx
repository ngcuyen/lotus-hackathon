import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const STEPS = [
  "Analyzing sketch layout...",
  "Detecting UI components...",
  "Mapping relationships...",
  "Generating React code...",
  "Applying Tailwind styles...",
];

export function ProcessingOverlay() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((s) => (s + 1) % STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center"
      style={{ backgroundColor: "rgba(10, 14, 20, 0.92)", backdropFilter: "blur(8px)" }}
    >
      <div className="spinner mb-5" />

      <div className="space-y-2 text-center">
        {STEPS.map((step, i) => (
          <motion.p
            key={step}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: i === currentStep ? 1 : i < currentStep ? 0.5 : 0.2 }}
            className={`text-xs transition-all duration-300`}
            style={{
              color: i === currentStep ? "var(--scifi-cyan)" : i < currentStep ? "var(--scifi-green)" : "var(--scifi-text-dim)",
              fontFamily: "'Courier New', monospace",
              fontWeight: i === currentStep ? 600 : 400,
            }}
          >
            {i < currentStep ? "✓ " : i === currentStep ? "→ " : "  "}
            {step}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}
