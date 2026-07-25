import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ARR = [1, 4, 6, 8, 11, 15];
const TARGET = 14;

// Auto-play mini demo used in the hero card.
export default function TwoPointersMini() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 5), 1400);
    return () => clearInterval(id);
  }, []);

  // Precomputed pointer positions across a short loop.
  const frames = [
    { l: 0, r: 5, note: `${ARR[0]} + ${ARR[5]} = 16 > 14 — move right in` },
    { l: 0, r: 4, note: `${ARR[0]} + ${ARR[4]} = 12 < 14 — move left in` },
    { l: 1, r: 4, note: `${ARR[1]} + ${ARR[4]} = 15 > 14 — move right in` },
    { l: 1, r: 3, note: `${ARR[1]} + ${ARR[3]} = 12 < 14 — move left in` },
    { l: 2, r: 3, note: `${ARR[2]} + ${ARR[3]} = 14 ✓ found` },
  ];
  const f = frames[step];

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-2 md:gap-3">
        {ARR.map((n, i) => {
          const active = i === f.l || i === f.r;
          return (
            <motion.div
              key={i}
              animate={{
                scale: active ? 1.08 : 1,
                borderColor: active ? "rgb(249 115 22)" : "rgba(255,255,255,0.15)",
              }}
              transition={{ duration: 0.3 }}
              className="h-12 w-12 md:h-14 md:w-14 rounded-lg border-2 flex items-center justify-center bg-background/60 font-mono text-lg font-semibold"
            >
              {n}
            </motion.div>
          );
        })}
      </div>
      <div className="relative h-6">
        <motion.div
          className="absolute text-xs font-mono text-orange-400"
          animate={{ x: f.l * (window.innerWidth < 768 ? 56 : 64) }}
          transition={{ type: "spring", damping: 22, stiffness: 220 }}
          style={{ left: "calc(50% - 96px)" }}
        >
          <div className="text-center">▲</div>
          <div className="text-center">L</div>
        </motion.div>
        <motion.div
          className="absolute text-xs font-mono text-sky-400"
          animate={{ x: f.r * (window.innerWidth < 768 ? 56 : 64) }}
          transition={{ type: "spring", damping: 22, stiffness: 220 }}
          style={{ left: "calc(50% - 96px)" }}
        >
          <div className="text-center">▲</div>
          <div className="text-center">R</div>
        </motion.div>
      </div>
      <div className="text-center text-sm text-muted-foreground font-mono">{f.note}</div>
    </div>
  );
}
