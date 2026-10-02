import { motion } from "motion/react";
import robotAsset from "@/assets/raksha twin bot svg.png";

/** Rotor hub positions as % of the robot image (1536×1024). */
const ROTORS = [
  { x: 18.5, y: 28, w: 34 },
  { x: 71, y: 14, w: 34 },
  { x: 85, y: 47, w: 30 },
];

export function RobotVisual({ heading, flying }: { heading: number; flying: boolean }) {
  return (
    <div className={`robot-visual ${flying ? "is-flying" : ""}`}>
      <motion.div className="heading-dial" animate={{ rotate: -heading }} transition={{ type: "spring", stiffness: 60, damping: 18 }}>
        {["N", "E", "S", "W"].map((d, i) => <span key={d} style={{ transform: `rotate(${i * 90}deg) translateY(-50%)` }}><b style={{ transform: `rotate(${-i * 90}deg)` }}>{d}</b></span>)}
      </motion.div>
      <div className="heading-pointer" />
      <motion.div className="robot-body" animate={{ rotateY: ((heading % 360) - 180) / 12, y: flying ? [0, -2, 0] : 0 }} transition={{ rotateY: { type: "spring", stiffness: 50, damping: 16 }, y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}>
        <img src={robotAsset} alt="RAKSHA vehicle" />
        {ROTORS.map((r, i) => <span key={i} className="rotor" style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%` }}><i /></span>)}
      </motion.div>
      <div className="robot-visual-caption"><span>HDG</span><strong>{String(Math.round(heading)).padStart(3, "0")}°</strong><span>{flying ? "ROTORS ON" : "ROTORS IDLE"}</span></div>
    </div>
  );
}
