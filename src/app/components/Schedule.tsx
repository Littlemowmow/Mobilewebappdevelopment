import { Plane, Home, Landmark, ChevronRight, Clock, ArrowLeft, Camera, Utensils, Music, ShoppingBag, Coffee, X, MapPin, GripVertical } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { Reorder, useDragControls } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface Activity {
  id: number;
  icon: LucideIcon;
  title: string;
  time: string;
  duration?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  price?: string;
  iconBg: string;
  iconColor: string;
  dotColor: string;
}

const TYPE_CONFIG: Record<string, { badge: string; badgeColor: string; icon: LucideIcon; iconBg: string; iconColor: string; dotColor: string }> = {
  SIDEQUEST: { badge: "SIDEQUEST", badgeColor: "bg-orange-500", icon: Camera, iconBg: "bg-orange-50 dark:bg-orange-900/30", iconColor: "text-orange-600 dark:text-orange-400", dotColor: "bg-orange-500" },
  "MUST DO": { badge: "MUST DO", badgeColor: "bg-pink-500", icon: Landmark, iconBg: "bg-pink-50 dark:bg-pink-900/30", iconColor: "text-pink-600 dark:text-pink-400", dotColor: "bg-pink-500" },
  LOCAL: { badge: "LOCAL", badgeColor: "bg-purple-500", icon: Coffee, iconBg: "bg-purple-50 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-400", dotColor: "bg-purple-500" },
};

function DraggableActivityCard({ activity, isDeletable, onDelete, onTap }: {
  activity: Activity;
  isDeletable: boolean;
  onDelete: () => void;
  onTap: () => void;
}) {
  const dragControls = useDragControls();
  const Icon = activity.icon;

  return (
    <Reorder.Item
      value={activity}
      dragListener={false}
      dragControls={dragControls}
      className="relative"
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
    >
      {/* Dot */}
      <div className="absolute left-0 top-7 w-[52px] flex justify-center z-10">
        <div className={`w-3 h-3 rounded-full ${activity.dotColor} border-[3px] border-zinc-50 dark:border-black shadow-lg`} />
      </div>

      {/* Card */}
      <div className="ml-[52px] bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[20px] p-5 shadow-md border border-zinc-200/50 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <div
            className="flex items-center justify-center w-6 h-12 cursor-grab active:cursor-grabbing touch-none shrink-0 -ml-1"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
          </div>

          <div
            className={`w-11 h-11 rounded-xl ${activity.iconBg} flex items-center justify-center flex-shrink-0 border border-zinc-100/50 dark:border-zinc-800`}
            onClick={onTap}
          >
            <Icon className={`w-5 h-5 ${activity.iconColor}`} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onTap}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 leading-tight">{activity.title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {activity.price && (
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{activity.price}</span>
                )}
                {isDeletable && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    aria-label={`Delete ${activity.title}`}
                    className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{activity.time}</span>
              </div>
              {activity.duration && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="font-medium">{activity.duration}</span>
                </>
              )}
              {activity.badge && (
                <span className={`${activity.badgeColor} text-white px-2.5 py-1 rounded-md text-xs font-bold tracking-wide shadow-sm`}>
                  {activity.badge}
                </span>
              )}
            </div>
            {activity.subtitle && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">{activity.subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

export function Schedule({ hideHeader }: { hideHeader?: boolean }) {
  const { activeTrip, setActiveTrip, approvedActivities, proposedActivities } = useTrip();
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [addedActivities, setAddedActivities] = useState<Record<string, Activity[]>>({});
  const [cityAttendance, setCityAttendance] = useState<Record<string, string[]>>({});

  // Add activity form state
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("10:00");
  const [formDuration, setFormDuration] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formType, setFormType] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);

  // Load persisted activities from Supabase on mount
  useEffect(() => {
    if (!activeTrip || !user) return;
    supabase
      .from("schedule_activities")
      .select("*")
      .eq("trip_id", String(activeTrip.id))
      .order("time", { ascending: true })
      .then(({ data }) => {
        if (data) {
          // Group loaded activities by city-day key
          const grouped: Record<string, Activity[]> = {};
          for (const row of data) {
            const k = `${row.city ?? 0}-${row.day ?? 0}`;
            if (!grouped[k]) grouped[k] = [];
            const config = row.badge ? TYPE_CONFIG[row.badge] : null;
            grouped[k].push({
              id: row.id ?? Date.now(),
              icon: config?.icon ?? Landmark,
              title: row.name,
              time: row.time,
              duration: row.duration || undefined,
              subtitle: row.notes || undefined,
              badge: config?.badge,
              badgeColor: config?.badgeColor,
              price: row.price ? `$${row.price}` : undefined,
              iconBg: config?.iconBg ?? "bg-zinc-100 dark:bg-zinc-800",
              iconColor: config?.iconColor ?? "text-zinc-600 dark:text-zinc-400",
              dotColor: config?.dotColor ?? "bg-zinc-400",
            });
          }
          setAddedActivities(grouped);
        }
      });
  }, [activeTrip?.id, user]);

  const resetForm = () => {
    setFormTitle("");
    setFormTime("10:00");
    setFormDuration("");
    setFormPrice("");
    setFormType("");
    setFormNotes("");
    setShowAddActivity(false);
  };

  const handleAddActivity = () => {
    if (!formTitle.trim() || !formTime.trim()) return;
    const config = formType ? TYPE_CONFIG[formType] : null;
    const newActivity: Activity = {
      id: Date.now(),
      icon: config?.icon ?? Landmark,
      title: formTitle.trim(),
      time: formTime.trim(),
      duration: formDuration.trim() || undefined,
      subtitle: formNotes.trim() || undefined,
      badge: config?.badge,
      badgeColor: config?.badgeColor,
      price: formPrice.trim() ? `$${formPrice.trim()}` : undefined,
      iconBg: config?.iconBg ?? "bg-zinc-100 dark:bg-zinc-800",
      iconColor: config?.iconColor ?? "text-zinc-600 dark:text-zinc-400",
      dotColor: config?.dotColor ?? "bg-zinc-400",
    };
    const key = `${selectedCity}-${selectedDay}`;
    setAddedActivities((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newActivity],
    }));

    // Persist to Supabase (fails silently if table doesn't exist yet)
    if (activeTrip && user) {
      const row = {
        trip_id: String(activeTrip.id),
        user_id: user.id,
        name: formTitle.trim(),
        time: formTime.trim(),
        duration: formDuration.trim() || null,
        notes: formNotes.trim() || null,
        badge: formType || null,
        price: formPrice.trim() || null,
        city: selectedCity,
        day: selectedDay,
      };
      supabase
        .from("schedule_activities")
        .insert(row)
        .then(({ error }) => {
          if (error) console.warn("Failed to save activity:", error.message);
        });
    }

    resetForm();
  };

  const handleDeleteActivity = (activityId: number) => {
    const key = `${selectedCity}-${selectedDay}`;
    setAddedActivities((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((a) => a.id !== activityId),
    }));
    // Remove from Supabase
    if (activeTrip && user) {
      supabase
        .from("schedule_activities")
        .delete()
        .eq("id", activityId)
        .then(({ error }) => {
          if (error) console.warn("Failed to delete activity:", error.message);
        });
    }
  };

  if (!activeTrip) {
    return (
      <div className="px-5 py-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-xl mb-2 font-semibold text-zinc-900 dark:text-white">No Active Trip</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] mb-6">Select a trip to view its schedule</p>
          <Link 
            to="/trips"
            className="inline-block bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            View Trips
          </Link>
        </div>
      </div>
    );
  }

  const currentCity = activeTrip.cities[selectedCity];
  const key = `${selectedCity}-${selectedDay}`;
  const extraActivities = addedActivities[key] || [];
  const currentActivities = [...(currentCity.activities[selectedDay] || []), ...extraActivities];
  const cityFilter = currentCity.name;
  const filteredApproved = approvedActivities.filter(
    (a) =>
      a.city?.toLowerCase().includes(cityFilter.toLowerCase()) ||
      a.location?.toLowerCase().includes(cityFilter.toLowerCase())
  );

  return (
    <div className="px-5 py-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto pb-24">
      {/* Header with back to trips */}
      {!hideHeader && (
      <div className="flex items-center gap-3 mb-5 pt-1">
        <button
          onClick={() => setActiveTrip(null)}
          aria-label="Back to trips"
          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </button>
        <h1 className="text-[22px] tracking-tight text-zinc-900 dark:text-white">{activeTrip.name}</h1>
      </div>
      )}

      {/* City Pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {activeTrip.cities.map((city, index) => (
          <div key={city.name} className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCity(index)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                index === selectedCity
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
              }`}
            >
              <span className="text-lg">{city.flag}</span>
              <span className="text-[15px] font-medium">{city.name}</span>
              <span className="text-xs opacity-60 font-medium">({city.days}d)</span>
            </button>
            {index < activeTrip.cities.length - 1 && (
              <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Who's joining this city — only show for group trips with multiple cities */}
      {activeTrip.members > 1 && activeTrip.cities.length > 1 && (
        <div className="bg-white dark:bg-zinc-950 rounded-[20px] p-4 mb-5 border border-zinc-200/50 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold tracking-wider uppercase">
              Who's joining in {currentCity?.name}?
            </span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
              {cityAttendance[currentCity?.name || ""]?.length || activeTrip.members}/{activeTrip.members}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeTrip.memberInitials.map((initial, idx) => {
              const cityName = currentCity?.name || "";
              const isJoining = (cityAttendance[cityName] || activeTrip.memberInitials).includes(initial);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCityAttendance(prev => {
                      const current = prev[cityName] || [...activeTrip.memberInitials];
                      const updated = isJoining
                        ? current.filter(i => i !== initial)
                        : [...current, initial];
                      return { ...prev, [cityName]: updated };
                    });
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    isJoining
                      ? `${activeTrip.memberColors[idx]} text-white border-white dark:border-zinc-950 shadow-md`
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-300 dark:border-zinc-700 opacity-50"
                  }`}
                >
                  {initial}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {activeTrip.days.map((day, index) => (
          <button
            key={day.day}
            onClick={() => setSelectedDay(index)}
            className={`px-5 py-3.5 rounded-2xl whitespace-nowrap transition-all ${
              index === selectedDay
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
            }`}
          >
            <div className="text-sm font-semibold mb-0.5">Day {day.day}</div>
            <div className="text-xs opacity-70 font-medium">{day.date}</div>
          </button>
        ))}
      </div>

      {/* Date Header */}
      <div className="mb-5">
        <h2 className="text-[18px] mb-1.5 font-semibold tracking-tight text-zinc-900 dark:text-white">{selectedDay === 0 ? "Arrival Day" : `Day ${selectedDay + 1}`}</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-[15px] font-medium">{activeTrip.days[selectedDay]?.date} · {currentCity.name}</p>
      </div>

      {/* Activities */}
      {currentActivities.length === 0 && filteredApproved.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No activities planned for this day</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] mb-6 max-w-[280px] mx-auto">
            Add one below or swipe in{" "}
            <Link to="/" className="text-orange-500 font-semibold hover:underline">Discover</Link>.
          </p>
        </div>
      ) : (
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[26px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-zinc-200 dark:from-zinc-800 via-zinc-200 dark:via-zinc-800 to-transparent" />

        {filteredApproved.map((activity) => (
          <div key={`approved-${activity.id}`} className="flex items-start gap-3 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 mt-2 shrink-0 ring-4 ring-teal-500/20" />
            <div className="flex-1 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-full">GROUP PICK</span>
              </div>
              <div className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100">{activity.name}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{activity.location}</div>
            </div>
          </div>
        ))}

        <Reorder.Group
          axis="y"
          values={currentActivities}
          onReorder={(reordered) => {
            // Split reordered list back into base + added
            const baseIds = new Set((currentCity.activities[selectedDay] || []).map(a => a.id));
            const newAdded = reordered.filter(a => !baseIds.has(a.id));
            setAddedActivities(prev => ({ ...prev, [key]: newAdded }));
          }}
          className="space-y-4"
        >
          {currentActivities.map((activity) => (
            <DraggableActivityCard
              key={activity.id}
              activity={activity}
              isDeletable={extraActivities.some(a => a.id === activity.id)}
              onDelete={() => handleDeleteActivity(activity.id)}
              onTap={() => setDetailActivity(activity)}
            />
          ))}
        </Reorder.Group>
      </div>
      )}

      {/* Saved from Discover — proposed activities you can add to this day */}
      {proposedActivities.length > 0 && (
        <div className="mt-6 mb-4">
          <h3 className="text-[11px] text-zinc-500 dark:text-zinc-500 tracking-widest font-bold mb-3 px-1">
            SAVED FROM DISCOVER ({proposedActivities.length})
          </h3>
          <div className="space-y-2">
            {proposedActivities.filter(a => a.status === "pending" || a.status === "approved").map((activity) => (
              <div
                key={`proposed-${activity.id}`}
                className="bg-white dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800 shadow-sm flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-800/30">
                  <span className="text-lg">{activity.tags?.[0] === "Food" ? "🍜" : activity.tags?.[0] === "Culture" ? "🏛️" : activity.tags?.[0] === "Nature" ? "🌿" : "📍"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] text-zinc-900 dark:text-zinc-100 truncate">{activity.name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{activity.location || activity.city}</div>
                </div>
                <button
                  onClick={() => {
                    const newActivity: Activity = {
                      id: activity.id,
                      icon: MapPin,
                      title: activity.name,
                      time: "TBD",
                      duration: activity.duration || "",
                      price: activity.price || "",
                      iconBg: "bg-orange-50 dark:bg-orange-900/30",
                      iconColor: "text-orange-600 dark:text-orange-400",
                      dotColor: "bg-orange-500",
                      subtitle: activity.location || activity.city,
                      badge: "DISCOVER",
                    };
                    const actKey = `${selectedCity}-${selectedDay}`;
                    setAddedActivities(prev => ({
                      ...prev,
                      [actKey]: [...(prev[actKey] || []), newActivity],
                    }));
                    // Also persist to Supabase
                    if (activeTrip && user) {
                      supabase.from("schedule_activities").insert({
                        trip_id: String(activeTrip.id),
                        user_id: user.id,
                        name: activity.name,
                        time: "TBD",
                        duration: activity.duration || "",
                        price: activity.price || "",
                        city: currentCity.name,
                        day: selectedDay,
                        badge: "DISCOVER",
                        notes: activity.location || activity.city,
                      }).then(({ error }) => {
                        if (error) console.warn("Failed to save:", error.message);
                      });
                    }
                  }}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-orange-600 transition-colors"
                >
                  + Day {selectedDay + 1}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Activity Button */}
      <button
        onClick={() => setShowAddActivity(true)}
        className="w-full mt-5 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl text-[15px] font-semibold transition-all border-2 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none"
      >
        + Add Activity
      </button>

      {/* Add Activity Modal */}
      {showAddActivity && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[20px] font-semibold text-zinc-900 dark:text-white">Add Activity</h2>
              <button onClick={resetForm} aria-label="Close add activity dialog" className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Title</label>
                <input
                  type="text"
                  placeholder="Activity name"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Time</label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Duration</label>
                <input
                  type="text"
                  placeholder="2h"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Price (Optional)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-[15px]">$</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                >
                  <option value="">None</option>
                  <option value="SIDEQUEST">SIDEQUEST</option>
                  <option value="MUST DO">MUST DO</option>
                  <option value="LOCAL">LOCAL</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Address, tips, etc."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleAddActivity}
                disabled={!formTitle.trim() || !formTime.trim()}
                className="w-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-2xl text-[15px] font-semibold transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Schedule
              </button>
              <button
                onClick={resetForm}
                className="w-full py-3 text-zinc-500 dark:text-zinc-400 text-[15px] font-semibold hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Detail Modal */}
      {detailActivity && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setDetailActivity(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-[28px] p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[20px] font-semibold text-zinc-900 dark:text-white">{detailActivity.title}</h2>
              <button onClick={() => setDetailActivity(null)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Clock className="w-4 h-4" />
                <span className="text-[15px] font-medium">{detailActivity.time}</span>
                {detailActivity.duration && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                    <span className="text-[15px] font-medium">{detailActivity.duration}</span>
                  </>
                )}
              </div>

              {detailActivity.price && (
                <div className="text-[15px] font-semibold text-zinc-900 dark:text-white">
                  Price: {detailActivity.price}
                </div>
              )}

              {detailActivity.badge && (
                <span className={`${detailActivity.badgeColor} text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm inline-block`}>
                  {detailActivity.badge}
                </span>
              )}

              {detailActivity.subtitle && (
                <p className="text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{detailActivity.subtitle}</p>
              )}
            </div>

            <button
              onClick={() => setDetailActivity(null)}
              className="w-full mt-6 py-3.5 rounded-2xl text-[15px] font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}