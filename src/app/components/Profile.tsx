import { Settings, Bell, HelpCircle, LogOut, ChevronRight, User, Award, Map, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import { useNavigate } from "react-router";

export function Profile() {
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const { trips } = useTrip();
  const navigate = useNavigate();

  const displayName = profile?.display_name || profile?.name || "User";
  const displayEmail = profile?.email || "—";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const handleLogOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="px-5 py-4 max-w-md mx-auto pb-24">
      {/* Header */}
      <h1 className="text-[28px] tracking-tight mb-6 pt-1 text-zinc-900 dark:text-white">Profile</h1>

      {/* User Info */}
      <div className="flex items-center gap-4 mb-8 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-950 p-5 rounded-[24px] border border-zinc-200/50 dark:border-zinc-800 shadow-sm dark:shadow-none">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-[20px] flex items-center justify-center text-white shadow-lg border-2 border-white/10">
          <span className="text-3xl font-bold">{displayInitial}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl mb-1 font-semibold text-zinc-900 dark:text-white">{displayName}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{displayEmail}</p>
        </div>
        <button onClick={() => alert('Edit profile coming soon!')} className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors border border-zinc-200/50 dark:border-transparent">
          <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/40 dark:to-orange-900/40 border border-orange-200/80 dark:border-orange-800/50 rounded-[20px] p-5 text-center shadow-sm dark:shadow-none">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-orange-200/80 dark:border-orange-500/30">
            <Map className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl mb-1 font-bold text-zinc-900 dark:text-white">{trips.length}</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Trips</div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/40 dark:to-teal-900/40 border border-teal-200/80 dark:border-teal-800/50 rounded-[20px] p-5 text-center shadow-sm dark:shadow-none">
          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-teal-200/80 dark:border-teal-500/30">
            <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl mb-1 font-bold text-zinc-900 dark:text-white">8</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Cities</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/40 dark:to-purple-900/40 border border-purple-200/80 dark:border-purple-800/50 rounded-[20px] p-5 text-center shadow-sm dark:shadow-none">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-200/80 dark:border-purple-500/30">
            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl mb-1 font-bold text-zinc-900 dark:text-white">24</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Places</div>
        </div>
      </div>

      {/* Section Title */}
      <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Settings</h3>

      {/* Menu Items */}
      <div className="space-y-2 mb-8">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-full bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[20px] p-5 flex items-center gap-4 transition-all shadow-sm dark:shadow-none"
        >
          <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700">
            {theme === "dark" ? (
              <Moon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" strokeWidth={2} fill="currentColor" />
            ) : (
              <Sun className="w-5 h-5 text-zinc-700 dark:text-zinc-300" strokeWidth={2} />
            )}
          </div>
          <span className="flex-1 text-left font-medium text-[15px] text-zinc-900 dark:text-white">
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
          <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide border border-orange-100 dark:border-transparent">
            {theme}
          </div>
        </button>

        <button onClick={() => alert('Coming soon!')} className="w-full bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[20px] p-5 flex items-center gap-4 transition-all shadow-sm dark:shadow-none">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700">
            <Settings className="w-5 h-5 text-zinc-700 dark:text-zinc-300" strokeWidth={2} />
          </div>
          <span className="flex-1 text-left font-medium text-[15px] text-zinc-900 dark:text-white">Settings</span>
          <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
        </button>
        
        <button onClick={() => alert('Coming soon!')} className="w-full bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[20px] p-5 flex items-center gap-4 transition-all shadow-sm dark:shadow-none">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700">
            <Bell className="w-5 h-5 text-zinc-700 dark:text-zinc-300" strokeWidth={2} />
          </div>
          <span className="flex-1 text-left font-medium text-[15px] text-zinc-900 dark:text-white">Notifications</span>
          <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">3</div>
          <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
        </button>
        
        <button onClick={() => alert('Coming soon!')} className="w-full bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[20px] p-5 flex items-center gap-4 transition-all shadow-sm dark:shadow-none">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700">
            <HelpCircle className="w-5 h-5 text-zinc-700 dark:text-zinc-300" strokeWidth={2} />
          </div>
          <span className="flex-1 text-left font-medium text-[15px] text-zinc-900 dark:text-white">Help & Support</span>
          <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
        </button>
      </div>

      {/* Section Title */}
      <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Account</h3>

      {/* Logout */}
      <button onClick={handleLogOut} className="w-full bg-gradient-to-br from-red-50 to-white dark:from-red-950/40 dark:to-red-900/40 border-2 border-red-200 dark:border-red-800/50 rounded-[20px] p-5 flex items-center gap-4 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-red-50 dark:hover:from-red-950/60 dark:hover:to-red-900/60 transition-all shadow-sm dark:shadow-none">
        <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center border border-red-200/80 dark:border-red-700/50">
          <LogOut className="w-5 h-5" strokeWidth={2} />
        </div>
        <span className="flex-1 text-left font-semibold text-[15px]">Log Out</span>
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Version */}
      <div className="text-center mt-8 text-xs text-zinc-400 dark:text-zinc-600 font-medium">
        Weventr v1.0.0
      </div>
    </div>
  );
}
