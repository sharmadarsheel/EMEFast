"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";

export default function AppSplashProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const isRoot = pathname === "/";
    const isSplashRoute = pathname === "/splash";
    const alreadyShown = sessionStorage.getItem("emefast_v18_splash_shown");

    if (isRoot || isSplashRoute || !alreadyShown) {
      setShowSplash(true);
    }
  }, [pathname]);

  const handleComplete = () => {
    sessionStorage.setItem("emefast_v18_splash_shown", "1");
    setShowSplash(false);
    if (pathname === "/" || pathname === "/splash") {
      router.push("/ambulance/dashboard");
    }
  };

  return (
    <>
      {showSplash && (
        <SplashScreen onComplete={handleComplete} durationMs={2800} />
      )}
      {children}
    </>
  );
}
