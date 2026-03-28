import { Plus, ChevronRight, Users, Bookmark, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTrip } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";

function TripCardSkeleton() {
  return (
    <div className="w-full rounded-[20px] overflow-hidden shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-zinc-200/50 dark:border-zinc-700/30 mb-5 animate-pulse">
      <div className="bg-gradient-to-br from-zinc-300 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 p-6 h-[100px]" />
      <div className="bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-10 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        </div>
        <div className="flex items-center gap-5">
          <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function Trips() {
  const { activeTrip, setActiveTrip, trips, loadTrips, loading } = useTrip();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoinTrip = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    if (!user) {
      setJoinError("You must be logged in");
      return;
    }
    setJoining(true);
    setJoinError("");

    const { data: trip, error: findError } = await supabase
      .from("trips")
      .select("*")
      .eq("invite_code", code)
      .single();

    if (findError || !trip) {
      setJoinError("Trip not found");
      setJoining(false);
      return;
    }

    const { error: joinErr } = await supabase
      .from("trip_members")
      .insert({ trip_id: trip.id, user_id: user.id, role: "member" });

    if (joinErr) {
      setJoinError(joinErr.message.includes("duplicate") ? "You're already in this trip!" : joinErr.message);
      setJoining(false);
      return;
    }

    await loadTrips();
    setJoining(false);
    setJoinCode("");
    navigate(`/trips/${trip.id}`);
  };

  const activeTrips = trips.filter(t => t.status === "Active");
  const planningTrips = trips.filter(t => t.status !== "Active" && t.status !== "Completed");
  const completedTrips = trips.filter(t => t.status === "Completed");

  const handleTripClick = (trip: typeof trips[0]) => {
    navigate(`/trips/${trip.id}`);
  };

  return (
    <div className="px-5 py-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pt-1">
        <h1 className="text-[22px] tracking-tight text-zinc-900 dark:text-white">My Trips</h1>
        <Link
          to="/trips/new"
          aria-label="Create new trip"
          className="bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 p-3 rounded-2xl transition-all shadow-lg shadow-orange-600/30"
        >
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </Link>
      </div>

      {/* Join Trip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl p-4 mb-5 flex gap-3 items-center shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <input
          type="text"
          placeholder="Enter trip code"
          aria-label="Trip invite code"
          value={joinCode}
          onChange={(e) => { setJoinCode(e.target.value); setJoinError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleJoinTrip(); }}
          className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors"
        />
        <button
          onClick={handleJoinTrip}
          disabled={joining}
          className="bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-orange-600/20 disabled:opacity-50"
        >
          {joining ? "Joining..." : "Join"}
        </button>
      </div>
      {joinError && (
        <p className="text-red-500 text-sm font-medium -mt-3 mb-4 px-1">{joinError}</p>
      )}

      {/* Loading Skeleton */}
      {loading && trips.length === 0 && (
        <div className="mb-5">
          <TripCardSkeleton />
          <TripCardSkeleton />
          <TripCardSkeleton />
        </div>
      )}

      {/* Empty state — shown only when done loading with no trips at all */}
      {!loading && trips.length === 0 && (
        <div className="text-center py-10 mb-5">
          <div className="text-5xl mb-4">✈️</div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">No trips yet</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] mb-6">Create your first trip or join one with a code above.</p>
        </div>
      )}

      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <div className="mb-5">
          {activeTrips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => handleTripClick(trip)}
              className="w-full rounded-[20px] overflow-hidden shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-zinc-200/50 dark:border-zinc-700/30 mb-5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)'}} />
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-[18px] mb-1.5 font-semibold tracking-tight text-white">{trip.name}</h2>
                    <p className="text-orange-50 text-[15px] font-medium">
                      {trip.dates} · {trip.duration}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg">
                      {trip.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-6">
                {/* Cities */}
                <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
                  {trip.cities.map((city, index) => (
                    <div key={city.name} className="flex items-center gap-2">
                      <div className="flex flex-col items-center min-w-[70px]">
                        <div className="bg-orange-50 dark:bg-orange-900/30 p-3.5 rounded-2xl mb-2 border border-orange-100/80 dark:border-orange-800/50">
                          <span className="text-2xl">{city.flag}</span>
                        </div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{city.name}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{city.days}d</span>
                      </div>
                      {index < trip.cities.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 mb-8 flex-shrink-0" strokeWidth={2} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5 mb-5 pb-5 border-b border-zinc-100 dark:border-zinc-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center border border-orange-100/50 dark:border-transparent">
                      <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{trip.members} members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center border border-teal-100/50 dark:border-transparent">
                      <Bookmark className="w-4 h-4 text-teal-600 dark:text-teal-400" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{trip.saved} saved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100/50 dark:border-transparent">
                      <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{trip.cityCount} cities</span>
                  </div>
                </div>

                {/* Members & Code */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {trip.memberInitials.map((initial, index) => (
                        <div
                          key={index}
                          className={`w-10 h-10 rounded-full ${trip.memberColors[index]} flex items-center justify-center text-white text-sm font-bold border-[3px] border-white dark:border-zinc-900 shadow-md`}
                        >
                          {initial}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-2 rounded-xl border border-orange-100/80 dark:border-orange-800/50">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Code:</span>
                      <span className="text-sm text-orange-600 dark:text-orange-400 font-bold tracking-wide">{trip.code}</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Planning Trips */}
      {planningTrips.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Planning</h3>
          {planningTrips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => handleTripClick(trip)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 rounded-[24px] p-5 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] mb-3 hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-2xl border border-orange-100/80 dark:border-orange-800/50">
                <span className="text-3xl">{trip.cities[0]?.flag || "🌍"}</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[17px] mb-1 font-semibold text-zinc-900 dark:text-white">{trip.name}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{trip.dates} · Planning</p>
              </div>
              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border border-blue-100 dark:border-transparent">PLANNING</span>
              <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
            </button>
          ))}
        </div>
      )}

      {/* Completed Trips */}
      {completedTrips.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Completed</h3>
          {completedTrips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => handleTripClick(trip)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 rounded-[24px] p-5 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] mb-3 hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50">
                <span className="text-3xl">{trip.cities[0]?.flag || "🌍"}</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[17px] mb-1 font-semibold text-zinc-900 dark:text-white">{trip.name}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{trip.dates} · {trip.status}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
            </button>
          ))}
        </div>
      )}

      {/* Plan New Trip */}
      <Link 
        to="/trips/new"
        className="block bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/80 border-2 border-zinc-200 dark:border-zinc-700/50 border-dashed rounded-[20px] p-10 text-center hover:border-orange-300 dark:hover:border-orange-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 flex items-center justify-center">
            <Plus className="w-8 h-8 text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
          </div>
        </div>
        <h3 className="text-xl mb-2 font-semibold text-zinc-900 dark:text-white">Plan a New Trip</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-[15px]">One city or many — we handle the route</p>
      </Link>
    </div>
  );
}