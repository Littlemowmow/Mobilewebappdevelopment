import { ArrowLeft, Users, Bookmark, MapPin, DollarSign, Calendar, Vote } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router";
import { useTrip } from "../context/TripContext";
import { useState, useEffect } from "react";
import { Schedule } from "./Schedule";
import { Budget } from "./Budget";
import { BlindMatch } from "./BlindMatch";

export function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trips, activeTrip, setActiveTrip } = useTrip();
  const [activeTab, setActiveTab] = useState<"schedule" | "budget" | "votes">("schedule");

  const trip = trips.find(t => t.id === Number(tripId));

  // Set this as active trip when viewing
  useEffect(() => {
    if (trip && (!activeTrip || activeTrip.id !== trip.id)) {
      setActiveTrip(trip);
    }
  }, [trip, activeTrip, setActiveTrip]);

  if (!trip) {
    return (
      <div className="px-5 py-4 max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h2 className="text-xl mb-2 font-semibold text-zinc-900 dark:text-white">Trip Not Found</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] mb-6">This trip doesn't exist</p>
          <Link 
            to="/trips"
            className="inline-block bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-600 px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-6 pt-1">
          <button 
            onClick={() => {
              setActiveTrip(null);
              navigate("/trips");
            }}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-md"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-[24px] tracking-tight text-white font-semibold">{trip.name}</h1>
        </div>

        <div className="mb-4">
          <p className="text-orange-50 text-[15px] font-medium mb-1">
            {trip.dates} · {trip.duration}
          </p>
          <span className="bg-white text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg inline-block">
            {trip.status.toUpperCase()}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
            <Users className="w-4 h-4 text-white" strokeWidth={2} />
            <span className="text-sm font-medium text-white">{trip.members}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
            <MapPin className="w-4 h-4 text-white" strokeWidth={2} />
            <span className="text-sm font-medium text-white">{trip.cityCount} cities</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
            <Bookmark className="w-4 h-4 text-white" strokeWidth={2} />
            <span className="text-sm font-medium text-white">{trip.saved}</span>
          </div>
        </div>

        {/* Members */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {trip.memberInitials.map((initial, index) => (
              <div
                key={index}
                className={`w-10 h-10 rounded-full ${trip.memberColors[index]} flex items-center justify-center text-white text-sm font-bold border-[3px] border-white/50 shadow-md`}
              >
                {initial}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
            <span className="text-xs text-white/80 font-medium">Code:</span>
            <span className="text-sm text-white font-bold tracking-wide">{trip.code}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-zinc-50 dark:bg-black px-5 pt-4 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
        <div className="flex gap-2 bg-white dark:bg-zinc-900 rounded-2xl p-1 shadow-sm dark:shadow-none border border-zinc-200 dark:border-transparent">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold transition-all ${
              activeTab === "schedule"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold transition-all ${
              activeTab === "budget"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Budget
          </button>
          <button
            onClick={() => setActiveTab("votes")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold transition-all ${
              activeTab === "votes"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Vote className="w-4 h-4" />
            Votes
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "schedule" && <ScheduleTab />}
        {activeTab === "budget" && <BudgetTab />}
        {activeTab === "votes" && <VotesTab />}
      </div>
    </div>
  );
}

// Schedule Tab Content (simplified, no header)
function ScheduleTab() {
  return <Schedule hideHeader />;
}

// Budget Tab Content (simplified, no header)
function BudgetTab() {
  return <Budget hideHeader />;
}

// Votes Tab Content (simplified, no header)
function VotesTab() {
  return <BlindMatch hideHeader />;
}