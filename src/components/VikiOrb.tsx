import { motion } from "framer-motion";

export type OrbState = "idle" | "thinking" | "speaking";

const container = {
  width: 100,
  height: 100,
  position: "relative" as const,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const glow = {
  position: "absolute" as const,
  width: 90,
  height: 90,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(0,220,255,0.6), rgba(0,120,255,0.15), transparent)",
};

const core = {
  width: 50,
  height: 50,
  borderRadius: "50%",
  background: "radial-gradient(circle at 30% 30%, #8fe9ff, #0bbcd6 60%, #056b8a)",
};

// Cast to any to avoid strict Framer Motion type checks
const variants: any = {
  glow: {
    thinking: {
      scale: [1, 1.3, 1],
      opacity: [0.4, 0.7, 0.4],
      filter: ["blur(12px)", "blur(20px)", "blur(12px)"],
      transition: { duration: 2, ease: "easeInOut", repeat: Infinity }
    },
  },
  core: {
    thinking: {
      scale: [0.95, 1.05, 0.95],
      rotate: [0, 360],
      borderRadius: [
        "50% 50% 50% 50% / 50% 50% 50% 50%", 
        "60% 40% 40% 60% / 60% 40% 60% 40%", 
        "50% 60% 30% 70% / 60% 30% 70% 40%",
        "40% 60% 60% 40% / 40% 60% 60% 40%", 
        "60% 40% 30% 70% / 70% 30% 50% 50%", 
        "30% 70% 60% 40% / 40% 60% 30% 70%", 
        "50% 50% 50% 50% / 50% 50% 50% 50%" 
      ],
      boxShadow: [
        "0 0 20px rgba(0,200,255,0.6)",
        "0 0 35px rgba(0,220,255,0.8)",
        "0 0 20px rgba(0,200,255,0.6)"
      ],
      transition: { duration: 7, ease: "linear", repeat: Infinity }
    },
  }
};

export default function VikiOrb() {
  return (
    <div style={container}>
      {/* Glow ring */}
      <motion.div 
        style={glow} 
        variants={variants.glow}
        animate="thinking"
      />
      {/* Core orb */}
      <motion.div 
        style={core} 
        variants={variants.core}
        animate="thinking"
      />
      {/* Inner pulse layer */}
      <motion.div 
        style={{ ...core, position: 'absolute', opacity: 0.5 }}
        animate={{ scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}
