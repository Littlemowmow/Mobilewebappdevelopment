import { Plane, Home, Landmark, Wine, ChevronRight, Clock, ArrowLeft } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { Link } from "react-router";
import { useState } from "react";

export function Schedule() {
  const { activeTrip, setActiveTrip } = useTrip();
  const [selectedCity, setSelectedCity] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);

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
  const currentActivities = currentCity.activities[selectedDay] || [];

  return (
    <div className="px-5 py-4 max-w-md mx-auto pb-24">
      {/* Header with back to trips */}
      <div className="flex items-center gap-3 mb-5 pt-1">
        <button 
          onClick={() => setActiveTrip(null)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </button>
        <h1 className="text-[28px] tracking-tight text-zinc-900 dark:text-white">{activeTrip.name}</h1>
      </div>

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
        {activeTrip.days.map((day) => (
          <button
            key={day.day}
            className={`px-5 py-3.5 rounded-2xl whitespace-nowrap transition-all ${
              day.active
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
        <h2 className="text-[24px] mb-1.5 font-semibold tracking-tight text-zinc-900 dark:text-white">Arrival Day</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-[15px] font-medium">Thursday, June 15 · Barcelona</p>
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
      <button className="w-full mt-5 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl text-[15px] font-semibold transition-all border-2 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
        + Add Activity
      </button>
    </div>
  );
}