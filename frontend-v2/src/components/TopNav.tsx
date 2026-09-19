"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Siren, Ambulance, Building2, Settings2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import FloatingDock from "@/components/FloatingDock";

interface TopNavProps {
  role?: "USER" | "HOSPITAL" | "ADMIN";
}

export default function TopNav({ role = "USER" }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isHospital = pathname?.startsWith("/hospital");
  const isAdmin = pathname?.startsWith("/admin");
  const isAmbulance = pathname?.startsWith("/ambulance") || pathname?.startsWith("/user");
  const activeRole = isAdmin ? "ADMIN" : isHospital ? "HOSPITAL" : isAmbulance ? "USER" : role;

  return (
    <>
      <header className="apple-nav">
        <div className="apple-nav-inner">
          {/* Row 1 (40px): Native EMEFast Logo, Flexible Spacer, Theme Toggle + SOS */}
          <div className="apple-nav-row-1">
            <Link href="/" className="liquid-logo-link" aria-label="EMEFast home">
              <span className="liquid-logo" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 13h4l4-8 3.5 14 3-6h3.5" />
                </svg>
              </span>
              <div className="liquid-brand-col">
                <div className="liquid-wordmark">
                  <span className="brand-eme">EME</span>
                  <span className="brand-fast">
                    Fast
                    <span className="brand-speed-streak" aria-hidden="true">
                      <span className="streak-main" />
                      <span className="streak-sub" />
                      <span className="streak-flare" />
                    </span>
                  </span>
                </div>
              </div>
            </Link>

            <div className="apple-nav-spacer" />

            <div className="apple-nav-actions-group">
              <div className="liquid-theme-wrapper" title="Toggle theme">
                <ThemeToggle />
              </div>
              <button
                type="button"
                className="nav-sos-liquid"
                onClick={() => router.push("/ambulance/emergency/new")}
                aria-label="Open emergency SOS"
                title="Open emergency SOS"
              >
                <Siren size={16} strokeWidth={2.4} />
                <span>SOS</span>
              </button>
            </div>
          </div>

          {/* Row 2 (34px): Primary Workspace Selector [ Ambulance | Hospital | Admin ] */}
          <div className="role-switcher" aria-label="Primary workspace switcher">
            <button
              type="button"
              className={activeRole === "USER" ? "active" : ""}
              aria-pressed={activeRole === "USER"}
              title="Ambulance workspace"
              onClick={() => router.push("/ambulance/dashboard")}
            >
              <Ambulance size={14} strokeWidth={2.2} className="role-icon" />
              <span>Ambulance</span>
            </button>
            <button
              type="button"
              className={activeRole === "HOSPITAL" ? "active" : ""}
              aria-pressed={activeRole === "HOSPITAL"}
              title="Hospital workspace"
              onClick={() => router.push("/hospital/dashboard")}
            >
              <Building2 size={14} strokeWidth={2.2} className="role-icon" />
              <span>Hospital</span>
            </button>
            <button
              type="button"
              className={activeRole === "ADMIN" ? "active" : ""}
              aria-pressed={activeRole === "ADMIN"}
              title="Admin workspace"
              onClick={() => router.push("/admin/dashboard")}
            >
              <Settings2 size={14} strokeWidth={2.2} className="role-icon" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Navigation: Floating Glass Dock (10px below header) */}
      <FloatingDock role={activeRole} />
    </>
  );
}
