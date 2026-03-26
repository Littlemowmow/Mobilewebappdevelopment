import { Settings, Bell, HelpCircle, LogOut, ChevronRight, User, Award, Map, BellOff, Check, X, Camera } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";

export function Profile() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const { trips } = useTrip();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [placesCount, setPlacesCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null);

  const emailPrefix = user?.email ? user.email.split("@")[0] : "";
  const displayName = localDisplayName || profile?.display_name || profile?.name || emailPrefix || "User";
  const displayEmail = profile?.email || user?.email || "—";

  // Build initials: first + last initial (e.g. "HM"), fallback to single letter
  const nameParts = displayName.trim().split(/\s+/);
  const displayInitials = nameParts.length >= 2
    ? (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
    : (displayName.charAt(0).toUpperCase() || (emailPrefix ? emailPrefix.charAt(0).toUpperCase() : "?"));

  const avatarUrl = localAvatarUrl || profile?.avatar_url || null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setAvatarUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      setLocalAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Derive real stats from trips
  const uniqueCities = new Set(trips.flatMap(t => t.cities.map(c => c.name)));
  const cityCount = uniqueCities.size;

  // Fetch real saved places count
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("saved_activities")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        setPlacesCount(count ?? 0);
      });
  }, [user?.id]);

  const handleLogOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleEditStart = () => {
    setEditName(displayName);
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    if (!user?.id || !editName.trim()) return;
    setEditSaving(true);
    await supabase
      .from("profiles")
      .update({ name: editName.trim(), display_name: editName.trim() })
      .eq("id", user.id);
    setLocalDisplayName(editName.trim());
    setEditSaving(false);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditName("");
  };

  return (
    <div className="px-5 py-4 max-w-md mx-auto pb-24">
      {/* Header */}
      <h1 className="text-[28px] tracking-tight mb-6 pt-1 text-zinc-900 dark:text-white">Profile</h1>

      {/* User Info */}
      <div className="flex items-center gap-4 mb-8 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800/50 p-5 rounded-[24px] border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleAvatarUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={avatarUploading}
          className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-orange-500/25 border-2 border-white/10 relative overflow-hidden cursor-pointer group"
        >
          <div className="absolute inset-0 rounded-[20px] shadow-[0_0_20px_rgba(249,115,22,0.2)]" />
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-[20px] relative z-10" />
          ) : (
            <span className="text-2xl font-bold relative z-10">{displayInitials}</span>
          )}
          {/* Camera overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-[20px] z-20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {/* Always-visible camera badge */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-md z-30 border-2 border-zinc-100 dark:border-zinc-700">
            {avatarUploading ? (
              <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
            )}
          </div>
        </button>
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-xl px-3 py-2 text-base text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") handleEditCancel(); }}
              />
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editName.trim()}
                className="w-8 h-8 rounded-lg bg-green-500 hover:bg-green-600 flex items-center justify-center text-white disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleEditCancel}
                className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 flex items-center justify-center text-zinc-600 dark:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h2 className="text-xl mb-0.5 font-semibold text-zinc-900 dark:text-white">{displayName}</h2>
          )}
          <p className="text-zinc-500 dark:text-zinc-400 text-[13px] font-medium">{displayEmail}</p>
        </div>
        {!isEditing && (
          <button onClick={handleEditStart} className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors border border-zinc-200/50 dark:border-transparent">
            <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/40 border border-orange-200/80 dark:border-orange-700/40 rounded-[20px] p-5 text-center shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-[1.02]">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-orange-200/80 dark:border-orange-500/30">
            <Map className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl mb-1 font-bold text-zinc-900 dark:text-white">{trips.length}</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Trips</div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/50 dark:to-teal-900/40 border border-teal-200/80 dark:border-teal-700/40 rounded-[20px] p-5 text-center shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-[1.02]">
          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-teal-200/80 dark:border-teal-500/30">
            <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl mb-1 font-bold text-zinc-900 dark:text-white">{cityCount}</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Cities</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/40 border border-purple-200/80 dark:border-purple-700/40 rounded-[20px] p-5 text-center shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-[1.02]">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-200/80 dark:border-purple-500/30">
            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl mb-1 font-bold text-zinc-900 dark:text-white">{placesCount}</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Places</div>
        </div>
      </div>

      {/* Section Title */}
      <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Settings</h3>

      {/* Menu Items */}
      <div className="space-y-2 mb-8">
        <button onClick={() => setShowSettings(!showSettings)} className="w-full bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 rounded-[20px] p-5 flex items-center gap-4 transition-all shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700">
            <Settings className="w-5 h-5 text-zinc-700 dark:text-zinc-300" strokeWidth={2} />
          </div>
          <span className="flex-1 text-left font-medium text-[15px] text-zinc-900 dark:text-white">Settings</span>
          <ChevronRight className={`w-5 h-5 text-zinc-400 dark:text-zinc-600 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
        </button>
        {showSettings && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 rounded-[20px] p-5 space-y-4 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between"
            >
              <span className="text-[15px] font-medium text-zinc-900 dark:text-white">Dark Mode</span>
              <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${theme === 'dark' ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
            <div className="border-t border-zinc-100 dark:border-zinc-800" />
            <p className="text-xs text-zinc-400 dark:text-zinc-500">More settings coming soon</p>
          </div>
        )}

        <button onClick={() => setShowNotifications(!showNotifications)} className="w-full bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 rounded-[20px] p-5 flex items-center gap-4 transition-all shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700">
            <Bell className="w-5 h-5 text-zinc-700 dark:text-zinc-300" strokeWidth={2} />
          </div>
          <span className="flex-1 text-left font-medium text-[15px] text-zinc-900 dark:text-white">Notifications</span>
          <ChevronRight className={`w-5 h-5 text-zinc-400 dark:text-zinc-600 transition-transform ${showNotifications ? 'rotate-90' : ''}`} />
        </button>
        {showNotifications && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 rounded-[20px] p-6 text-center shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
            <BellOff className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-[15px] font-medium text-zinc-500 dark:text-zinc-400">No new notifications</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">You're all caught up!</p>
          </div>
        )}

        <button onClick={() => window.open('mailto:support@weventr.com')} className="w-full bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 rounded-[20px] p-5 flex items-center gap-4 transition-all shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
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
      <button onClick={handleLogOut} className="w-full bg-gradient-to-br from-red-50 to-white dark:from-red-950/40 dark:to-red-900/40 border-2 border-red-200 dark:border-red-800/50 rounded-[20px] p-5 flex items-center gap-4 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-red-50 dark:hover:from-red-950/60 dark:hover:to-red-900/60 transition-all shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
        <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center border border-red-200/80 dark:border-red-700/50">
          <LogOut className="w-5 h-5" strokeWidth={2} />
        </div>
        <span className="flex-1 text-left font-semibold text-[15px]">Log Out</span>
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Version */}
      <div className="text-center mt-8 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
        Weventr v1.0.0
      </div>
    </div>
  );
}
