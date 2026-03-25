import { Plane, Home, Landmark, UtensilsCrossed, ChevronRight, Clock, ArrowLeft, Camera, Utensils, Music, ShoppingBag, Coffee, X } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { Link } from "react-router";
import { useState } from "react";
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

export function Schedule({ hideHeader }: { hideHeader?: boolean }) {
  const { activeTrip, setActiveTrip } = useTrip();
  const [selectedCity, setSelectedCity] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [addedActivities, setAddedActivities] = useState<Record<string, Activity[]>>({});

  // Add activity form state
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formType, setFormType] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => {
    setFormTitle("");
    setFormTime("");
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
      price: formPrice.trim() ? `€${formPrice.trim()}` : undefined,
      iconBg: config?.iconBg ?? "bg-zinc-100 dark:bg-zinc-800",
      iconColor: config?.iconColor ?? "text-zinc-600 dark:text-zinc-400",
      dotColor: config?.dotColor ?? "bg-zinc-400",
    };
    const key = `${selectedCity}-${selectedDay}`;
    setAddedActivities((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newActivity],
    }));
    resetForm();
  };

  if (!activeTrip) {
    return (
      <div className="px-5 py-4 max-w-md mx-auto min-h-screen flex items-center justify-center">
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

  return (
    <div className="px-5 py-4 max-w-md mx-auto pb-24">
      {/* Header with back to trips */}
      {!hideHeader && (
      <div className="flex items-center gap-3 mb-5 pt-1">
        <button
          onClick={() => setActiveTrip(null)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </button>
        <h1 className="text-[28px] tracking-tight text-zinc-900 dark:text-white">{activeTrip.name}</h1>
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
        <h2 className="text-[24px] mb-1.5 font-semibold tracking-tight text-zinc-900 dark:text-white">{selectedDay === 0 ? "Arrival Day" : `Day ${selectedDay + 1}`}</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-[15px] font-medium">{activeTrip.days[selectedDay]?.date} · {currentCity.name}</p>
      </div>

      {/* Activities */}
      <div className="space-y-4 relative">
        {/* Timeline line */}
        <div className="absolute left-[26px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-zinc-200 dark:from-zinc-800 via-zinc-200 dark:via-zinc-800 to-transparent" />

        {currentActivities.map((activity, index) => {
          const Icon = activity.icon;
          const isLast = index === currentActivities.length - 1;
          
          return (
            <div key={activity.id} className="relative">
              {/* Dot */}
              <div className="absolute left-0 top-7 w-[52px] flex justify-center z-10">
                <div className={`w-3 h-3 rounded-full ${activity.dotColor} border-[3px] border-zinc-50 dark:border-black shadow-lg`} />
              </div>

              {/* Card */}
              <div className="ml-[52px] bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[20px] p-5 shadow-md hover:shadow-lg transition-shadow border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${activity.iconBg} flex items-center justify-center flex-shrink-0 border border-zinc-100/50 dark:border-zinc-800`}>
                    <Icon className={`w-6 h-6 ${activity.iconColor}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-[16px] text-zinc-900 dark:text-zinc-100 leading-tight">{activity.title}</h3>
                      {activity.price && (
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex-shrink-0">{activity.price}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-2 flex-wrap">
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
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{activity.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
              <button onClick={resetForm} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
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
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-[15px]">&euro;</span>
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
    </div>
  );
}