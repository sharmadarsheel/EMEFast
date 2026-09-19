"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Hospital, LayoutDashboard, Siren, Users } from "lucide-react";

interface FloatingDockProps {
  role?: "USER" | "HOSPITAL" | "ADMIN";
}

export default function FloatingDock({ role = "USER" }: FloatingDockProps) {
  const pathname = usePathname();
  const isHospital = pathname?.startsWith("/hospital");
  const isAdmin = pathname?.startsWith("/admin");
  const isAmbulance = pathname?.startsWith("/ambulance") || pathname?.startsWith("/user");
  const activeRole = isAdmin ? "ADMIN" : isHospital ? "HOSPITAL" : isAmbulance ? "USER" : role;

  const links = activeRole === "USER"
    ? [
        { label: "Overview", href: "/ambulance/dashboard", icon: LayoutDashboard },
        { label: "Cases", href: "/user/history", icon: Activity },
        { label: "Hospitals", href: "/user/hospitals", icon: Hospital },
      ]
    : activeRole === "HOSPITAL"
      ? [
          { label: "Inbox", href: "/hospital/dashboard", icon: Activity },
          { label: "Active cases", href: "/hospital/active-cases", icon: Siren },
          { label: "Resources", href: "/hospital/resources", icon: Hospital },
        ]
      : [
          { label: "Command", href: "/admin/dashboard", icon: LayoutDashboard },
          { label: "Hospitals", href: "/admin/hospitals", icon: Hospital },
          { label: "Emergencies", href: "/admin/emergencies", icon: Siren },
          { label: "Users", href: "/admin/users", icon: Users },
        ];

  return (
    <div className="floating-dock-container" aria-label="Secondary navigation dock">
      <nav className="floating-dock">
        {links.map(({ label, href, icon: Icon }) => {
          const active = href === "/ambulance/dashboard"
            ? pathname === "/ambulance/dashboard" || pathname === "/user/dashboard" || pathname === "/"
            : pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`floating-dock-item ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={14} strokeWidth={2.2} className="dock-icon" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
