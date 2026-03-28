import { ArrowLeft, Lightbulb, Check, Clock, ThumbsUp, ThumbsDown, Sparkles, Compass, Plus, X, MapPin, Send } from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTrip } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { trackEvent } from "../../lib/analytics";

const MEMBER_COLORS = [
  "bg-gradient-to-br from-orange-500 to-orange-600",
  "bg-gradient-to-br from-teal-500 to-teal-600",
  "bg-gradient-to-br from-purple-500 to-purple-600",
  "bg-gradient-to-br from-blue-500 to-blue-600",
  "bg-gradient-to-br from-pink-500 to-pink-600",
  "bg-gradient-to-br from-amber-500 to-amber-600",
];

export function BlindMatch({ hideHeader }: { hideHeader?: boolean }) {
  const { activeTrip, proposedActivities, approveActivity, rejectActivity, proposeActivity } = useTrip();
  const { user, profile } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"voting" | "decided">("voting");
  const [itemVotes, setItemVotes] = useState<Record<number, 'up' | 'down' | null>>({});
  const [showPropose, setShowPropose] = useState(false);
  const [proposeName, setProposeName] = useState("");
  const [proposeLocation, setProposeLocation] = useState("");
  const [proposeDescription, setProposeDescription] = useState("");
  const [proposeTag, setProposeTag] = useState("Food");

  // Load existing votes from Supabase on mount
  useEffect(() => {
    if (!user || !activeTrip) return;
    supabase.from("blind_match_votes")
      .select("activity_id, vote")
      .eq("trip_id", String(activeTrip.id))
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          const loaded: Record<number, 'up' | 'down' | null> = {};
          data.forEach((v: any) => { loaded[v.activity_id] = v.vote; });
          setItemVotes(loaded);
        }
      });
  }, [activeTrip?.id, user?.id]);

  // Build members from trip data + current user
  const members = useMemo(() => {
    const currentUserName = profile?.name || profile?.email?.split("@")[0] || "You";
    const currentInitial = currentUserName.charAt(0).toUpperCase();

    const memberList = [
      { name: currentUserName, initial: currentInitial, color: MEMBER_COLORS[0], isYou: true },
    ];

    // Add trip members by index (not by initial match, which filters out same-initial members)
    if (activeTrip?.memberInitials) {
      activeTrip.memberInitials.forEach((initial, i) => {
        // Skip index 0 since that's the current user's slot
        if (i === 0) return;
        memberList.push({
          name: initial,
          initial,
          color: MEMBER_COLORS[i % MEMBER_COLORS.length],
          isYou: false,
        });
      });
    }
    return memberList;
  }, [activeTrip, profile]);

  // Your vote status: voted if you've voted on all pending items
  const pendingItems = proposedActivities.filter(a => a.status === "pending");
  const decidedItems = proposedActivities.filter(a => a.status !== "pending");
  const yourVoteCount = Object.values(itemVotes).filter(v => v !== null && v !== undefined).length;
  const youVoted = pendingItems.length > 0 && yourVoteCount >= pendingItems.length;

  const votedCount = youVoted ? 1 : 0;
  const waitingCount = members.length - votedCount;
  const allVoted = youVoted; // MVP: reveal results once you submit your votes

  const toggleItemVote = useCallback((itemId: number, direction: 'up' | 'down') => {
    setItemVotes(prev => ({
      ...prev,
      [itemId]: prev[itemId] === direction ? null : direction,
    }));
  }, []);

  // Persist votes to Supabase so they survive refresh
  const saveVotesToSupabase = useCallback(async () => {
    if (!user || !activeTrip) return;
    const votes = Object.entries(itemVotes).map(([id, vote]) => ({
      trip_id: String(activeTrip.id),
      activity_id: Number(id),
      user_id: user.id,
      vote: vote,
    }));
    if (votes.length > 0) {
      await supabase.from("blind_match_votes").upsert(votes, { onConflict: "trip_id,activity_id,user_id" }).then(({ error }) => {
        if (error && import.meta.env.DEV) console.warn("Failed to save votes:", error.message);
      });
    }
  }, [user, activeTrip, itemVotes]);

  // Submit all votes — save to Supabase first, then approve/reject locally
  const submitVotes = useCallback(async () => {
    await saveVotesToSupabase();
    trackEvent("votes_submitted", {
      count: Object.values(itemVotes).filter(v => v !== null && v !== undefined).length,
      trip_name: activeTrip?.name || "",
    });
    Object.entries(itemVotes).forEach(([id, vote]) => {
      const numId = Number(id);
      if (vote === 'up') approveActivity(numId);
      else if (vote === 'down') rejectActivity(numId);
    });
  }, [itemVotes, approveActivity, rejectActivity, saveVotesToSupabase]);

  const handlePropose = () => {
    if (!proposeName.trim() || !activeTrip) return;
    proposeActivity({
      id: Date.now() + Math.floor(Math.random() * 10000),
      name: proposeName.trim(),
      location: proposeLocation.trim() || "",
      city: activeTrip.cities[0]?.name || "",
      description: proposeDescription.trim() || "",
      tags: [proposeTag],
      price: "",
      duration: "",
    });
    trackEvent("activity_manually_proposed", { trip_name: activeTrip.name, activity: proposeName.trim() });
    setProposeName("");
    setProposeLocation("");
    setProposeDescription("");
    setProposeTag("Food");
    setShowPropose(false);
  };

  const tripName = activeTrip?.name || "Trip";
  const memberCount = members.length;

  // No proposed activities — show empty state
  if (proposedActivities.length === 0) {
    return (
      <div className="min-h-screen px-5 py-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
        {!hideHeader && (
          <div className="flex items-center gap-3 mb-8 pt-1">
            <Link to="/trips" className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent">
              <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </Link>
            <h1 className="text-[22px] tracking-tight font-semibold text-zinc-900 dark:text-white">Blind Match</h1>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900 rounded-[20px] flex items-center justify-center mb-6 border-2 border-purple-200 dark:border-purple-800/50 shadow-xl animate-bounce" style={{ animationDuration: '2s' }}>
            <Compass className="w-12 h-12 text-purple-500 dark:text-purple-400" />
          </div>
          <h2 className="text-[22px] font-semibold text-zinc-900 dark:text-white mb-3">Nothing to vote on yet</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] leading-relaxed mb-2 max-w-[280px]">
            Swipe right on activities in <span className="font-semibold text-orange-500">Discover</span> to propose them for your group.
          </p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-8">They'll show up here for everyone to vote on.</p>
          <div className="flex gap-3">
            <Link
              to="/"
              className="px-5 py-3 bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-2xl text-[14px] font-semibold shadow-lg shadow-orange-600/30"
            >
              Discover
            </Link>
            <button
              onClick={() => setShowPropose(true)}
              className="px-5 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl text-[14px] font-semibold border border-zinc-200 dark:border-zinc-700 shadow-sm"
            >
              <Plus className="w-4 h-4 inline mr-1.5 -mt-0.5" />Propose
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
      {/* Header */}
      {!hideHeader && (
      <div className="flex items-center gap-3 mb-8 pt-1">
        <Link to="/trips" className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent">
          <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </Link>
        <h1 className="text-[22px] tracking-tight font-semibold text-zinc-900 dark:text-white">Blind Match</h1>
      </div>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900 rounded-[20px] flex items-center justify-center border-2 border-purple-200 dark:border-purple-800/50 shadow-xl shadow-purple-200/50 dark:shadow-purple-900/50">
          <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </div>
      </div>

      {/* Propose Button */}
      <button
        onClick={() => setShowPropose(true)}
        className="w-full mb-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 border-dashed rounded-2xl text-[14px] font-semibold text-zinc-600 dark:text-zinc-400 hover:border-orange-300 dark:hover:border-orange-700/50 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Propose an Activity
      </button>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-1">
        <button
          onClick={() => setSelectedTab("voting")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            selectedTab === "voting"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Voting ({pendingItems.length})
        </button>
        <button
          onClick={() => setSelectedTab("decided")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            selectedTab === "decided"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Decided ({decidedItems.length})
        </button>
      </div>

      {selectedTab === "voting" && (
        <>
          {/* Title */}
          {!allVoted && (
            <div className="text-center mb-8">
              <h2 className="text-[20px] mb-3 font-semibold tracking-tight leading-tight text-zinc-900 dark:text-white">
                Vote on activities and<br />submit to see group decisions.
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-[15px] font-medium">
                Swipe through and lock in your picks.
              </p>
            </div>
          )}

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">{votedCount} of {members.length} voted</span>
              <span className="text-teal-600 dark:text-teal-400 font-semibold">{members.length > 0 ? Math.round((votedCount / members.length) * 100) : 0}%</span>
            </div>
            <div className="h-2.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-300/50 dark:border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all duration-500 shadow-lg shadow-teal-500/50"
                style={{ width: `${members.length > 0 ? (votedCount / members.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Members Card */}
          <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[20px] p-6 mb-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-500 tracking-widest font-bold">
                {tripName.toUpperCase()} · {memberCount} MEMBER{memberCount !== 1 ? "S" : ""}
              </div>
              <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg border border-teal-100/80 dark:border-transparent">
                <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" strokeWidth={3} />
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{votedCount} VOTED</span>
              </div>
            </div>

            <div className="space-y-4">
              {members.map((member, i) => {
                const memberVoted = member.isYou ? youVoted : (allVoted);
                return (
                  <div key={member.name + i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl ${member.color} flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-zinc-950`}>
                        <span className="text-lg font-bold">{member.initial}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100">
                          {member.isYou ? member.name : member.initial}
                          {member.isYou && <span className="text-zinc-500 dark:text-zinc-500 font-normal"> (You)</span>}
                        </div>
                      </div>
                    </div>
                    {memberVoted ? (
                      <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-xl border border-teal-100/80 dark:border-teal-800/50">
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tracking-wide">VOTED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                        <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wide">WAITING</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nudge Card */}
          {waitingCount > 0 && !youVoted && (
            <div className="w-full bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-950/30 border-2 border-yellow-200 dark:border-yellow-700/50 rounded-[20px] p-5 flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-yellow-200 dark:border-yellow-700/50">
                <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-500" fill="currentColor" />
              </div>
              <div className="text-left flex-1">
                <div className="text-yellow-700 dark:text-yellow-500 text-sm font-semibold">
                  Vote on all activities below
                </div>
                <div className="text-yellow-600 dark:text-yellow-600/80 text-xs font-medium">
                  {pendingItems.length - yourVoteCount} left to vote on
                </div>
              </div>
            </div>
          )}

          {/* Vote Items */}
          <div className="mt-4">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-500 tracking-widest font-bold mb-4 px-1">
              PROPOSED ACTIVITIES ({pendingItems.length})
            </div>
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-950 rounded-[20px] p-5 shadow-md border border-zinc-200/50 dark:border-zinc-800 mb-3"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 flex-1">
                    {item.name}
                  </div>
                  {item.tags[0] && (
                    <span className="bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ml-2">
                      {item.tags[0]}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-2">
                  {item.location} {item.city && `· ${item.city}`}
                </div>
                {item.description && (
                  <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleItemVote(item.id, 'up')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all ${
                        itemVotes[item.id] === 'up'
                          ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800/50 text-teal-600 dark:text-teal-400'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" strokeWidth={2.5} />
                      <span className="text-xs font-bold">Yes</span>
                    </button>
                    <button
                      onClick={() => toggleItemVote(item.id, 'down')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all ${
                        itemVotes[item.id] === 'down'
                          ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" strokeWidth={2.5} />
                      <span className="text-xs font-bold">No</span>
                    </button>
                  </div>
                  {itemVotes[item.id] && (
                    <span className={`text-xs font-semibold ${itemVotes[item.id] === 'up' ? 'text-teal-500' : 'text-red-500'}`}>
                      {itemVotes[item.id] === 'up' ? '✓ Approved' : '✗ Passed'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit votes button */}
          {yourVoteCount > 0 && (
            <button
              onClick={submitVotes}
              className="w-full mt-4 py-4 bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-2xl text-[15px] font-bold shadow-lg shadow-purple-600/30 hover:shadow-xl transition-all"
            >
              Submit Votes ({yourVoteCount}/{pendingItems.length})
            </button>
          )}
        </>
      )}

      {/* Decided Tab */}
      {selectedTab === "decided" && (
        <div className="mt-4">
          {decidedItems.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-5xl mb-4">🗳️</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No decisions yet</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[14px]">
                Vote on proposed activities and submit to see results here.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-white mb-1">
                  Results <Sparkles className="inline w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-500 tracking-widest font-bold mb-4 px-1">
                DECIDED ({decidedItems.length})
              </div>
              {decidedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-950 rounded-[20px] p-5 shadow-md border border-zinc-200/50 dark:border-zinc-800 mb-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </div>
                    {item.status === "approved" && (
                      <span className="text-[11px] font-bold tracking-wide bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-3 py-1.5 rounded-lg border border-teal-100/80 dark:border-teal-800/50">
                        APPROVED
                      </span>
                    )}
                    {item.status === "rejected" && (
                      <span className="text-[11px] font-bold tracking-wide bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-100/80 dark:border-red-800/50">
                        REJECTED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-2">
                    {item.location} {item.city && `· ${item.city}`}
                  </div>
                  <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 mb-8 p-5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm dark:shadow-none">
        <h4 className="text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">How it works</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
          Propose activities from Discover or add your own. Everyone votes privately — thumbs up or down. Submit to see group decisions.
        </p>
      </div>

      {/* Propose Activity Modal */}
      {showPropose && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowPropose(false)}>
          <div className="w-full max-w-md bg-zinc-950 rounded-t-[24px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-semibold text-white">Propose an Activity</h3>
              <button onClick={() => setShowPropose(false)} className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Activity name *</label>
                <input
                  type="text"
                  placeholder="e.g., Deep dish pizza at Lou Malnati's"
                  value={proposeName}
                  onChange={(e) => setProposeName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    placeholder="e.g., River North, Chicago"
                    value={proposeLocation}
                    onChange={(e) => setProposeLocation(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-3 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Why should we go? <span className="text-zinc-600">(optional)</span></label>
                <textarea
                  placeholder="Sell it to the group..."
                  value={proposeDescription}
                  onChange={(e) => setProposeDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {["Food", "Culture", "Nightlife", "Nature", "Shopping", "Adventure"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setProposeTag(tag)}
                      className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                        proposeTag === tag
                          ? "bg-orange-500 text-white"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePropose}
                disabled={!proposeName.trim()}
                className="w-full py-4 bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-2xl text-[15px] font-semibold shadow-lg shadow-orange-600/30 disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
              >
                <Send className="w-4 h-4" />
                Propose to Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
