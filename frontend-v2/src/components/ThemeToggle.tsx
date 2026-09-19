"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // Read directly from DOM to avoid hydration flicker
    const active = document.documentElement.classList.contains("theme-light");
    setIsLight(active);
    setMounted(true);

    const handleThemeChange = (e: Event) => {
      const custom = e as CustomEvent<{ theme: string }>;
      if (custom?.detail?.theme) {
        setIsLight(custom.detail.theme === "light");
      }
    };

    window.addEventListener("emefast-theme-change", handleThemeChange);
    return () => window.removeEventListener("emefast-theme-change", handleThemeChange);
  }, []);

  const toggle = () => {
    const next = !isLight;
    const root = document.documentElement;

    if (next) {
      root.classList.add("theme-light");
      root.classList.remove("theme-dark");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
      localStorage.setItem("emefast-theme", "light");
    } else {
      root.classList.remove("theme-light");
      root.classList.add("theme-dark");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
      localStorage.setItem("emefast-theme", "dark");
    }

    setIsLight(next);
    window.dispatchEvent(
      new CustomEvent("emefast-theme-change", { detail: { theme: next ? "light" : "dark" } })
    );
  };

  const lightActive = mounted ? isLight : false;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={lightActive}
      aria-label={lightActive ? "Switch to dark mode" : "Switch to light mode"}
      title={lightActive ? "Switch to dark mode" : "Switch to light mode"}
      className={`liquid-glass-toggle ${lightActive ? "light-mode" : "dark-mode"}`}
      onClick={toggle}
      suppressHydrationWarning
    >
      {/* Meniscus curved optical glass highlight */}
      <span className="glass-meniscus-reflection" aria-hidden="true" />
      <span className="glass-prism-warm" aria-hidden="true" />
      <span className="glass-prism-cool" aria-hidden="true" />

      {/* Sliding Glass Orb Thumb */}
      <span
        className={`liquid-glass-thumb ${lightActive ? "thumb-right" : "thumb-left"}`}
        aria-hidden="true"
      />

      {/* Moon Slot (Left) */}
      <span
        className={`toggle-icon moon-icon ${!lightActive ? "active-icon" : ""}`}
        aria-hidden="true"
      >
        <Moon size={15} strokeWidth={2.4} />
      </span>

      {/* Sun Slot (Right) */}
      <span
        className={`toggle-icon sun-icon ${lightActive ? "active-icon" : ""}`}
        aria-hidden="true"
      >
        <Sun size={15} strokeWidth={2.4} />
      </span>
    </button>
  );
}
