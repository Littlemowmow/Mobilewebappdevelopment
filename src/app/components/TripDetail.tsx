import { ArrowLeft, Users, Bookmark, MapPin, DollarSign, Calendar, Vote, Plus, X, Check, Send } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router";
import { useTrip } from "../context/TripContext";
import { useState, useEffect } from "react";
import { sendTripInvite } from "../../lib/sms";
import { supabase } from "../../lib/supabase";
import { Schedule } from "./Schedule";
import { Budget } from "./Budget";
import { BlindMatch } from "./BlindMatch";
import { DatePoll } from "./DatePoll";

const MEMBER_COLOR_OPTIONS = [
  { label: "Orange", value: "bg-orange-500" },
  { label: "Teal", value: "bg-teal-500" },
  { label: "Pink", value: "bg-pink-500" },
  { label: "Blue", value: "bg-blue-500" },
  { label: "Purple", value: "bg-purple-500" },
];

const EMOJI_OPTIONS = ["😎", "🤠", "🥳", "😈", "🦊", "🐸", "🌸", "⚡", "🔥", "💎", "🎯", "🌊", "🍕", "✈️", "🎒"];

export function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trips, activeTrip, setActiveTrip, addMember, updateTripStatus } = useTrip();
  const [activeTab, setActiveTab] = useState<"schedule" | "budget" | "votes">("schedule");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberEmoji, setNewMemberEmoji] = useState("😎");
  const [newMemberColor, setNewMemberColor] = useState(MEMBER_COLOR_OPTIONS[0].value);
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"Active" | "Completed">("Active");

  const trip = trips.find(t => String(t.id) === String(tripId));
  const isSolo = trip ? trip.members <= 1 : false;
  const isDatesTBD = !!(trip?.metadata as Record<string, unknown>)?.dates_tbd;

  const handleSetFinalDates = async (start: string, end: string) => {
    if (!trip) return;
    // Update the trip's start_date, end_date in Supabase and clear dates_tbd
    const tripIdStr = String(trip.id);
    if (tripIdStr.includes("-")) {
      const { data: currentTrip } = await supabase
        .from("trips")
        .select("metadata")
        .eq("id", tripIdStr)
        .single();
      const existingMeta = (currentTrip?.metadata as Record<string, unknown>) || {};
      await supabase
        .from("trips")
        .update({
          start_date: start,
          end_date: end,
          metadata: { ...existingMeta, dates_tbd: false },
        })
        .eq("id", tripIdStr);
      // Reload to reflect changes
      window.location.reload();
    }
  };

  // Set this as active trip when viewing — compare by ID only to avoid infinite loops
  useEffect(() => {
    if (trip && (!activeTrip || String(activeTrip.id) !== String(trip.id))) {
      setActiveTrip(trip);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, activeTrip?.id, setActiveTrip]);

  if (!trip) {
    return (
      <div className="px-5 py-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto min-h-screen flex items-center justify-center">
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
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 px-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)'}} />
        <div className="flex items-center gap-3 mb-6 pt-1">
          <button 
            onClick={() => {
              setActiveTrip(null);
              navigate("/trips");
            }}
            aria-label="Back to trips"
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-md"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-[20px] tracking-tight text-white font-semibold">{trip.name}</h1>
        </div>

        <div className="mb-4">
          <p className="text-orange-50 text-[15px] font-medium mb-1">
            {isDatesTBD ? "Dates TBD — Vote below" : `${trip.dates} · ${trip.duration}`}
          </p>
          <button
            onClick={() => {
              const next = trip.status === "Active" ? "Completed" : "Active";
              setPendingStatus(next);
              setShowStatusConfirm(true);
            }}
            className="bg-white text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg inline-block hover:bg-orange-50 transition-colors"
          >
            {trip.status.toUpperCase()} ▾
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-2 bg-white/25 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/30 shadow-lg">
            <Users className="w-4 h-4 text-white" strokeWidth={2} />
            <span className="text-sm font-semibold text-white">{trip.members}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/25 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/30 shadow-lg">
            <MapPin className="w-4 h-4 text-white" strokeWidth={2} />
            <span className="text-sm font-semibold text-white">{trip.cityCount} cities</span>
          </div>
          <div className="flex items-center gap-2 bg-white/25 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/30 shadow-lg">
            <Bookmark className="w-4 h-4 text-white" strokeWidth={2} />
            <span className="text-sm font-semibold text-white">{trip.saved}</span>
          </div>
        </div>

        {/* Trip Setup Info */}
        {trip.metadata && (
          <div className="flex flex-wrap gap-2 mb-4">
            {trip.metadata.transport_mode && trip.metadata.transport_mode !== "not-decided" && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
                <span className="text-sm">
                  {trip.metadata.transport_mode === "flying" ? "✈️" : trip.metadata.transport_mode === "train" ? "🚆" : trip.metadata.transport_mode === "driving" ? "🚗" : trip.metadata.transport_mode === "bus" ? "🚌" : "🚢"}
                </span>
                <span className="text-xs font-semibold text-white capitalize">{trip.metadata.transport_mode}</span>
                {trip.metadata.transport_cost && <span className="text-xs text-white/70">${trip.metadata.transport_cost}</span>}
              </div>
            )}
            {trip.metadata.hotel_sorted === "yes" && trip.metadata.hotel_cost_per_night && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
                <span className="text-sm">🏨</span>
                <span className="text-xs font-semibold text-white">${trip.metadata.hotel_cost_per_night}/night</span>
              </div>
            )}
            {trip.metadata.personal_budget && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
                <span className="text-sm">💰</span>
                <span className="text-xs font-semibold text-white">${trip.metadata.personal_budget} spending</span>
              </div>
            )}
            {trip.metadata.booking_code && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
                <span className="text-sm">🎫</span>
                <span className="text-xs font-semibold text-white">{trip.metadata.booking_code}</span>
              </div>
            )}
            {(trip.metadata as Record<string, unknown>).trip_vibe && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
                <span className="text-sm">{(trip.metadata as Record<string, unknown>).trip_vibe === "luxury" ? "✨" : (trip.metadata as Record<string, unknown>).trip_vibe === "budget" ? "💡" : "🎯"}</span>
                <span className="text-xs font-semibold text-white capitalize">{String((trip.metadata as Record<string, unknown>).trip_vibe)} vibe</span>
              </div>
            )}
          </div>
        )}

        {/* Members */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {trip.memberInitials.map((initial, index) => {
              const emoji = trip.memberEmojis?.[index];
              return (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-full ${trip.memberColors[index]} flex items-center justify-center text-white text-sm font-bold border-[3px] border-white/50 shadow-md`}
                >
                  {emoji || initial}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            aria-label="Add member"
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-md border-[3px] border-white/50 shadow-md"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
          {!isSolo && (
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/30">
              <span className="text-xs text-white/80 font-medium">Code:</span>
              <span className="text-sm text-white font-bold tracking-wide">{trip.code}</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Poll — shown when dates are TBD */}
      {isDatesTBD && typeof trip.id === "string" && (
        <DatePoll
          tripId={String(trip.id)}
          members={trip.memberInitials.map((initial, i) => ({
            initial,
            color: trip.memberColors[i] || "bg-zinc-500",
            name: initial,
          }))}
          onSetFinalDates={handleSetFinalDates}
          isCreator={true}
        />
      )}

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-zinc-50 dark:bg-black px-5 pt-4 pb-3 border-b border-zinc-200/60 dark:border-zinc-700/50">
        <div className="flex gap-2 bg-white dark:bg-zinc-900 rounded-2xl p-1 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] border border-zinc-200 dark:border-zinc-700/50">
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
          {!isSolo && (
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
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "schedule" && <ScheduleTab />}
        {activeTab === "budget" && <BudgetTab />}
        {activeTab === "votes" && !isSolo && <VotesTab />}
      </div>

      {/* Status Confirm Modal */}
      {showStatusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowStatusConfirm(false)}
          />
          <div className="relative w-[90%] max-w-sm bg-white dark:bg-zinc-900 rounded-[24px] p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Change Status</h2>
            <p className="text-[15px] text-zinc-600 dark:text-zinc-400 mb-6">
              Change trip status to <span className="font-semibold text-orange-500">{pendingStatus}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusConfirm(false)}
                className="flex-1 py-3 rounded-2xl text-[15px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateTripStatus(trip.id, pendingStatus);
                  setShowStatusConfirm(false);
                }}
                className="flex-1 py-3 rounded-2xl text-[15px] font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAddMember(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[20px] p-6 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Add Member</h2>
              <button
                onClick={() => setShowAddMember(false)}
                aria-label="Close add member dialog"
                className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Name</label>
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Their name"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
            </div>

            {/* Phone Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
            </div>

            {/* Emoji Avatar */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewMemberEmoji(e)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                      newMemberEmoji === e
                        ? "bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-500 shadow-md scale-110"
                        : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Color</label>
              <div className="flex items-center gap-3">
                {MEMBER_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewMemberColor(color.value)}
                    className={`w-10 h-10 rounded-full ${color.value} border-2 border-white dark:border-zinc-950 shadow-md flex items-center justify-center transition-transform ${
                      newMemberColor === color.value ? "scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ring-zinc-400" : "hover:scale-105"
                    }`}
                  >
                    {newMemberColor === color.value && (
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Send Code Option */}
            {newMemberPhone.trim() && trip && (
              <div className="mb-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Send them the invite code?</span>
                  </div>
                  <button
                    onClick={async () => {
                      setCodeSent(true);
                      const result = await sendTripInvite(
                        newMemberPhone.trim(),
                        trip.name,
                        trip.code,
                        trip.memberInitials[0] || "Someone"
                      );
                      if (!result.success) {
                        // Fallback to native SMS if Sendblue fails
                        const msg = `Join our trip "${trip.name}" on Weventr! Code: ${trip.code}\n${window.location.origin}/join/${trip.code}`;
                        window.open(`sms:${newMemberPhone.trim()}?body=${encodeURIComponent(msg)}`, '_blank');
                      }
                      setTimeout(() => setCodeSent(false), 3000);
                    }}
                    disabled={codeSent}
                    className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      codeSent
                        ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                        : "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                    }`}
                  >
                    {codeSent ? "✓ Sent!" : "Send Invite"}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 ml-6">Sends an iMessage with the trip invite link</p>
              </div>
            )}

            {/* Add Button */}
            <button
              onClick={() => {
                if (newMemberName.trim()) {
                  addMember(trip.id, newMemberName.trim(), newMemberColor, newMemberEmoji);
                  setNewMemberName("");
                  setNewMemberPhone("");
                  setNewMemberEmoji("😎");
                  setNewMemberColor(MEMBER_COLOR_OPTIONS[0].value);
                  setCodeSent(false);
                  setShowAddMember(false);
                }
              }}
              disabled={!newMemberName.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold text-[15px] shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Member
            </button>
          </div>
        </div>
      )}
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