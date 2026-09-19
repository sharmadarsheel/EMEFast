"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Cpu, Users, HeartPulse } from "lucide-react";

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number;
}

export default function SplashScreen({
  onComplete,
  durationMs = 2800,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const statusMessages = [
    "Initializing AI…",
    "Connecting hospitals…",
    "Preparing emergency network…",
    "Ready.",
  ];

  useEffect(() => {
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(pct);

      if (elapsed < durationMs * 0.25) {
        setStatusIndex(0);
      } else if (elapsed < durationMs * 0.52) {
        setStatusIndex(1);
      } else if (elapsed < durationMs * 0.82) {
        setStatusIndex(2);
      } else {
        setStatusIndex(3);
      }

      if (elapsed < durationMs) {
        requestAnimationFrame(frame);
      } else {
        setProgress(100);
        setStatusIndex(3);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      }
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [durationMs, onComplete]);

  return (
    <AnimatePresence>
      {!isFadingOut ? (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col justify-between items-center select-none overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, #0e1526 0%, #070911 50%, #030407 100%)",
            color: "#FFFFFF",
          }}
        >
          {/* ==========================================================
              1. Ambient Background Layer
              ========================================================== */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Soft Volumetric Red Glow */}
            <motion.div
              animate={{
                scale: [0.95, 1.08, 0.95],
                opacity: [0.18, 0.28, 0.18],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-[90px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(255, 59, 48, 0.38) 0%, rgba(255, 69, 58, 0.12) 45%, transparent 70%)",
              }}
            />

            {/* Secondary Specular Depth */}
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[340px] rounded-full blur-[110px]"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(100, 210, 255, 0.07) 0%, transparent 60%)",
              }}
            />

            {/* Frosted Glass Arcs */}
            <svg
              className="absolute inset-0 w-full h-full opacity-35"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <circle
                cx="500"
                cy="460"
                r="320"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.2"
                strokeDasharray="6 8"
              />
              <circle
                cx="500"
                cy="460"
                r="410"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
              <circle
                cx="500"
                cy="460"
                r="220"
                stroke="rgba(255,59,48,0.12)"
                strokeWidth="1.5"
                strokeDasharray="12 18"
              />
            </svg>

            {/* Subtle Ambient ECG Pulse Waveform in Background */}
            <svg
              className="absolute top-[48%] left-0 w-full h-24 opacity-20"
              viewBox="0 0 1200 100"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 0 50 L 350 50 L 380 50 L 410 20 L 440 85 L 470 30 L 490 65 L 510 50 L 1200 50"
                stroke="url(#ambient-ecg-grad)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="ambient-ecg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF3B30" stopOpacity="0" />
                  <stop offset="35%" stopColor="#FF3B30" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#FF453A" stopOpacity="0.9" />
                  <stop offset="65%" stopColor="#FF3B30" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FF3B30" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Floating Bokeh / Lucid Particles */}
            <div className="absolute inset-0">
              {[
                { top: "20%", left: "22%", size: 4, delay: 0 },
                { top: "28%", left: "78%", size: 6, delay: 0.3 },
                { top: "65%", left: "18%", size: 5, delay: 0.6 },
                { top: "72%", left: "82%", size: 4, delay: 0.2 },
                { top: "42%", left: "12%", size: 3, delay: 0.8 },
                { top: "36%", left: "88%", size: 5, delay: 0.5 },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -18, 0],
                    opacity: [0.2, 0.65, 0.2],
                  }}
                  transition={{
                    duration: 3 + i * 0.4,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: "easeInOut",
                  }}
                  className="absolute rounded-full"
                  style={{
                    top: p.top,
                    left: p.left,
                    width: p.size,
                    height: p.size,
                    background:
                      i % 2 === 0
                        ? "rgba(255, 69, 58, 0.75)"
                        : "rgba(255, 255, 255, 0.85)",
                    boxShadow:
                      i % 2 === 0
                        ? "0 0 10px rgba(255,59,48,0.8)"
                        : "0 0 8px rgba(255,255,255,0.7)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Top Info Bar */}
          <div className="w-full pt-10 px-6 flex justify-between items-center opacity-60 text-[10px] tracking-[0.25em] uppercase font-mono">
            <span>EMEFast Core v18</span>
            <span>Emergency AI</span>
          </div>

          {/* ==========================================================
              2. Center Hero: Glass Cross + Integrated ECG + Native Logo
              ========================================================== */}
          <motion.div
            animate={{ scale: [0.985, 1.015, 0.985] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center justify-center px-4 -mt-6"
          >
            {/* Glass Medical Cross with Integrated ECG */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-7 flex items-center justify-center">
              {/* Glass Cross Outer Glow */}
              <div className="absolute inset-0 rounded-[32px] bg-[#FF3B30]/18 blur-2xl" />

              {/* Glass Medical Cross SVG */}
              <svg
                width="112"
                height="112"
                viewBox="0 0 1024 1024"
                fill="none"
                className="relative z-10 drop-shadow-[0_16px_32px_rgba(0,0,0,0.55)]"
              >
                <defs>
                  <path
                    id="splash-cross-path"
                    d="
                      M 387 293
                      L 533 293
                      A 46 46 0 0 1 579 339
                      L 579 439
                      L 633 439
                      A 46 46 0 0 1 679 485
                      L 679 539
                      A 46 46 0 0 1 633 585
                      L 579 585
                      L 579 685
                      A 46 46 0 0 1 533 731
                      L 387 731
                      A 46 46 0 0 1 341 685
                      L 341 585
                      L 287 585
                      A 46 46 0 0 1 241 539
                      L 241 485
                      A 46 46 0 0 1 287 439
                      L 341 439
                      L 341 339
                      A 46 46 0 0 1 387 293
                      Z
                    "
                  />
                  <clipPath id="splash-cross-clip">
                    <use href="#splash-cross-path" />
                  </clipPath>
                  <linearGradient id="splash-frost-left" x1="280" y1="280" x2="520" y2="740" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="45%" stopColor="#F1F5F9" />
                    <stop offset="100%" stopColor="#94A3B8" />
                  </linearGradient>
                  <linearGradient id="splash-lum-red" x1="480" y1="280" x2="680" y2="740" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF453A" />
                    <stop offset="50%" stopColor="#FF2D55" />
                    <stop offset="100%" stopColor="#D70015" />
                  </linearGradient>
                </defs>

                <g clipPath="url(#splash-cross-clip)">
                  <rect x="220" y="270" width="480" height="480" fill="url(#splash-frost-left)" />
                  <path d="M 450 270 L 700 270 L 700 750 L 380 750 Z" fill="url(#splash-lum-red)" />
                  <ellipse cx="460" cy="310" rx="160" ry="30" fill="#ffffff" opacity="0.4" />
                </g>

                <use
                  href="#splash-cross-path"
                  fill="none"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="6"
                />

                <path
                  d="
                    M 241 512
                    L 395 512
                    L 415 540
                    L 455 330
                    L 495 694
                    L 528 472
                    L 550 512
                    L 679 512
                  "
                  fill="none"
                  stroke="#FF3B30"
                  strokeWidth="32"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
                <path
                  d="
                    M 241 512
                    L 395 512
                    L 415 540
                    L 455 330
                    L 495 694
                    L 528 472
                    L 550 512
                    L 679 512
                  "
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Native Text Logo (NO image asset) */}
            <div className="flex items-baseline font-black italic tracking-tight select-none">
              {/* EME -> brushed titanium gradient */}
              <span
                className="text-4xl sm:text-5xl font-black"
                style={{
                  background:
                    "linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 38%, #94A3B8 75%, #64748B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                  letterSpacing: "-0.04em",
                }}
              >
                EME
              </span>

              {/* Fast -> luminous emergency red gradient */}
              <div className="relative inline-flex items-baseline ml-1">
                <span
                  className="text-4xl sm:text-5xl font-black"
                  style={{
                    background:
                      "linear-gradient(180deg, #FF453A 0%, #FF2D55 45%, #D70015 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 16px rgba(255, 59, 48, 0.75))",
                    letterSpacing: "-0.04em",
                  }}
                >
                  Fast
                </span>

                {/* Red Motion Streak Extending from "Fast" */}
                <div className="absolute -right-7 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none">
                  <span className="w-6 h-[2.5px] rounded-full bg-gradient-to-r from-[#FF3B30] to-transparent shadow-[0_0_8px_#FF3B30]" />
                  <span className="w-8 h-[3px] rounded-full bg-gradient-to-r from-[#FF453A] to-transparent shadow-[0_0_10px_#FF3B30]" />
                  <span className="w-5 h-[2px] rounded-full bg-gradient-to-r from-[#FF2D55] to-transparent opacity-80" />
                </div>
              </div>
            </div>

            {/* Subtitle: EMERGENCY COORDINATION AI */}
            <p className="mt-3 text-[10px] sm:text-[11px] font-bold tracking-[0.28em] uppercase text-white/60">
              EMERGENCY COORDINATION AI
            </p>

            {/* ==========================================================
                3. Loading Section:
                - Glossy glass progress bar (10px)
                - Animated red fill with bloom & travelling light
                - Dynamic percentage (0-100%)
                - Cycling status text
                ========================================================== */}
            <div className="mt-9 w-64 sm:w-72 flex flex-col items-center">
              {/* Glossy Glass Progress Bar (10px) */}
              <div className="relative w-full h-[10px] rounded-full p-[1px] bg-white/10 backdrop-blur-md border border-white/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,0,0,0.3)] overflow-hidden">
                {/* Progress Fill */}
                <div
                  className="h-full rounded-full relative transition-all duration-100 ease-out"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, #D70015 0%, #FF3B30 50%, #FF453A 100%)",
                    boxShadow:
                      "0 0 16px rgba(255, 59, 48, 0.9), 0 0 32px rgba(255, 59, 48, 0.45)",
                  }}
                >
                  {/* Travelling Specular Light Flare */}
                  <motion.div
                    animate={{ x: ["-100%", "250%"] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-12 bg-gradient-to-r from-transparent via-white/85 to-transparent"
                  />
                </div>
              </div>

              {/* Status and Percentage Row */}
              <div className="w-full mt-3 flex justify-between items-center text-xs">
                <span className="text-white/70 font-medium tracking-wide min-h-[18px]">
                  {statusMessages[statusIndex]}
                </span>
                <span className="font-mono font-bold text-white/90 tabular-nums">
                  {progress}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* ==========================================================
              4. Bottom: 4 Minimal Glowing Icons
              ========================================================== */}
          <div className="w-full max-w-md pb-8 sm:pb-10 px-4">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { icon: Zap, label: "Faster Response" },
                { icon: Cpu, label: "Smarter Allocation" },
                { icon: Users, label: "Stronger Communities" },
                { icon: HeartPulse, label: "Safer Lives" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1, duration: 0.4 }}
                    className="flex flex-col items-center text-center p-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] text-[#FF453A] shadow-[0_0_12px_rgba(255,69,58,0.35)] mb-1.5">
                      <Icon size={16} strokeWidth={2.2} />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-white/75 leading-tight">
                      {item.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
