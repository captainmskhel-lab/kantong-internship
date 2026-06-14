"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Subtle floating red gradient orbs for hero / login backgrounds (spec §10, §11).
 * Pure transform/opacity animation; disabled under reduced motion.
 */
export function Aurora({ dense = false }: { dense?: boolean }) {
  const reduce = useReducedMotion();
  const orbs = dense
    ? [
        { x: "8%", y: "12%", size: 320, color: "rgba(239,68,68,0.18)", d: 14 },
        { x: "72%", y: "8%", size: 280, color: "rgba(220,38,38,0.14)", d: 18 },
        { x: "60%", y: "70%", size: 360, color: "rgba(248,113,113,0.16)", d: 22 },
      ]
    : [
        { x: "10%", y: "20%", size: 300, color: "rgba(239,68,68,0.14)", d: 16 },
        { x: "78%", y: "60%", size: 340, color: "rgba(220,38,38,0.12)", d: 20 },
      ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{ left: o.x, top: o.y, width: o.size, height: o.size, background: o.color }}
          animate={reduce ? undefined : { y: [0, -24, 0], x: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: o.d, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-x-0 top-0 h-64 bg-brand-glow" />
    </div>
  );
}
