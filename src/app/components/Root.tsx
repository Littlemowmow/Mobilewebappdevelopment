import { Outlet, Link, useLocation, Navigate, useNavigate } from "react-router";
import { Compass, Plane, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTrip } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { OnboardingFlow } from "./Onboarding";
import { trackEvent } from "../../lib/analytics";

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTrip, trips, loading: tripsLoading } = useTrip();
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(
    () => { try { return !localStorage.getItem("weventr-onboarding-done"); } catch { return true; } }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          try { localStorage.setItem("weventr-onboarding-done", "true"); } catch {}
          setShowOnboarding(false);
          if (user) {
            supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id).then(() => {});
          }
          if (!tripsLoading && trips.length === 0) {
            trackEvent("onboarding_redirect", { to: "/trips/new" });
            navigate("/trips/new");
          }
        }}
      />
    );
  }

  const navItems = [
    { path: "/", label: "Discover", icon: Compass },
    { 
      path: "/trips", 
      label: activeTrip ? activeTrip.name : "Trips", 
      icon: Plane,
      isContextual: true 
    },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
      {/* Main Content */}
      <main className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-900/85 border-t border-zinc-200/50 dark:border-zinc-700/40 backdrop-blur-2xl backdrop-saturate-[1.8] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_40px_rgba(0,0,0,0.6)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === "/trips" && location.pathname.startsWith("/trips"));

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all duration-200 relative group"
              >
                {isActive && (
                  <>
                    <div className="absolute -top-[1px] left-2 right-2 h-[2.5px] bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/12 to-orange-500/5 dark:from-orange-500/20 dark:to-orange-500/8 rounded-2xl" />
                  </>
                )}
                <Icon
                  className={`w-5 h-5 transition-all duration-200 relative z-10 ${
                    isActive ? 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className={`text-[10px] font-semibold transition-all duration-200 relative z-10 truncate max-w-[80px] text-center block ${
                  isActive ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}