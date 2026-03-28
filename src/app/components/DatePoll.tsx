import { useState, useEffect, useMemo } from "react";
import { Calendar, Check, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";

interface MemberAvailability {
  member_id: string;
  name: string;
  color: string;
  available_from: string;
  available_to: string;
  submitted_at: string;
}

interface DatePollProps {
  tripId: string;
  members: { initial: string; color: string; name?: string }[];
  onSetFinalDates?: (start: string, end: string) => void;
  isCreator?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDaysBetween(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function findBestOverlap(availabilities: MemberAvailability[]): { start: string; end: string; count: number } | null {
  if (availabilities.length === 0) return null;

  // Collect all unique dates across all ranges
  const allDates = new Set<string>();
  for (const a of availabilities) {
    const start = new Date(a.available_from + "T00:00:00");
    const end = new Date(a.available_to + "T00:00:00");
    const current = new Date(start);
    while (current <= end) {
      allDates.add(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
  }

  const sortedDates = Array.from(allDates).sort();
  if (sortedDates.length === 0) return null;

  // For each date, count how many members are available
  const dateCounts: Record<string, number> = {};
  for (const date of sortedDates) {
    dateCounts[date] = 0;
    for (const a of availabilities) {
      if (date >= a.available_from && date <= a.available_to) {
        dateCounts[date]++;
      }
    }
  }

  // Find the max overlap count
  const maxCount = Math.max(...Object.values(dateCounts));
  if (maxCount === 0) return null;

  // Find the longest contiguous window with max overlap
  let bestStart = "";
  let bestEnd = "";
  let bestLength = 0;
  let currentStart = "";
  let currentLength = 0;

  for (const date of sortedDates) {
    if (dateCounts[date] === maxCount) {
      if (!currentStart) currentStart = date;
      currentLength++;
      if (currentLength > bestLength) {
        bestStart = currentStart;
        bestEnd = date;
        bestLength = currentLength;
      }
    } else {
      currentStart = "";
      currentLength = 0;
    }
  }

  return { start: bestStart, end: bestEnd, count: maxCount };
}

export function DatePoll({ tripId, members, onSetFinalDates, isCreator }: DatePollProps) {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<MemberAvailability[]>([]);
  const [myFrom, setMyFrom] = useState("");
  const [myTo, setMyTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing submissions
  useEffect(() => {
    if (!tripId) return;

    async function loadAvailabilities() {
      setLoading(true);
      const { data: memberRows } = await supabase
        .from("trip_members")
        .select("id, user_id, metadata")
        .eq("trip_id", tripId);

      if (memberRows) {
        const loaded: MemberAvailability[] = [];
        const memberColors = ["bg-orange-500", "bg-teal-500", "bg-purple-500", "bg-blue-500", "bg-pink-500", "bg-amber-500"];

        for (let i = 0; i < memberRows.length; i++) {
          const row = memberRows[i];
          const meta = (row.metadata as Record<string, unknown>) || {};
          if (meta.available_from && meta.available_to) {
            loaded.push({
              member_id: row.id,
              name: (meta.name as string) || "Member",
              color: memberColors[i % memberColors.length],
              available_from: meta.available_from as string,
              available_to: meta.available_to as string,
              submitted_at: (meta.submitted_at as string) || "",
            });
          }

          // Pre-fill current user's dates if they already submitted
          if (row.user_id === user?.id && meta.available_from) {
            setMyFrom(meta.available_from as string);
            setMyTo(meta.available_to as string);
          }
        }
        setAvailabilities(loaded);
      }
      setLoading(false);
    }

    loadAvailabilities();
  }, [tripId, user?.id]);

  const bestOverlap = useMemo(() => findBestOverlap(availabilities), [availabilities]);

  // Compute the overall date range for the visual timeline
  const timelineRange = useMemo(() => {
    if (availabilities.length === 0) return null;
    let earliest = availabilities[0].available_from;
    let latest = availabilities[0].available_to;
    for (const a of availabilities) {
      if (a.available_from < earliest) earliest = a.available_from;
      if (a.available_to > latest) latest = a.available_to;
    }
    return { start: earliest, end: latest, days: getDaysBetween(earliest, latest) };
  }, [availabilities]);

  const handleSubmit = async () => {
    if (!myFrom || !myTo || !user) return;
    setSaving(true);

    // Find the current user's trip_members row
    const { data: myMembership } = await supabase
      .from("trip_members")
      .select("id, metadata")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .single();

    if (myMembership) {
      const existingMeta = (myMembership.metadata as Record<string, unknown>) || {};
      await supabase
        .from("trip_members")
        .update({
          metadata: {
            ...existingMeta,
            available_from: myFrom,
            available_to: myTo,
            submitted_at: new Date().toISOString(),
          },
        })
        .eq("id", myMembership.id);
    } else {
      // User is the trip owner but not in trip_members, insert a row
      await supabase.from("trip_members").insert({
        trip_id: tripId,
        user_id: user.id,
        role: "owner",
        metadata: {
          available_from: myFrom,
          available_to: myTo,
          submitted_at: new Date().toISOString(),
        },
      });
    }

    // Refresh availabilities
    const { data: memberRows } = await supabase
      .from("trip_members")
      .select("id, user_id, metadata")
      .eq("trip_id", tripId);

    if (memberRows) {
      const loaded: MemberAvailability[] = [];
      const memberColors = ["bg-orange-500", "bg-teal-500", "bg-purple-500", "bg-blue-500", "bg-pink-500", "bg-amber-500"];
      for (let i = 0; i < memberRows.length; i++) {
        const row = memberRows[i];
        const meta = (row.metadata as Record<string, unknown>) || {};
        if (meta.available_from && meta.available_to) {
          loaded.push({
            member_id: row.id,
            name: (meta.name as string) || "Member",
            color: memberColors[i % memberColors.length],
            available_from: meta.available_from as string,
            available_to: meta.available_to as string,
            submitted_at: (meta.submitted_at as string) || "",
          });
        }
      }
      setAvailabilities(loaded);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="px-5 py-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex-1 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center border border-orange-100/80 dark:border-orange-800/50">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-white">Date Poll</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Submit when you're available</p>
            </div>
          </div>
        </div>

        {/* My Availability Input */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Your availability</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Earliest date</label>
              <input
                type="date"
                value={myFrom}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setMyFrom(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Latest date</label>
              <input
                type="date"
                value={myTo}
                min={myFrom || new Date().toISOString().split("T")[0]}
                onChange={(e) => setMyTo(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!myFrom || !myTo || myTo < myFrom || saving}
            className="w-full py-3 rounded-2xl text-[14px] font-semibold transition-all bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Submit Availability"}
          </button>
        </div>

        {/* Availability Timeline */}
        {availabilities.length > 0 && timelineRange && (
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              {availabilities.length} of {members.length} submitted
            </p>

            <div className="space-y-2.5">
              {availabilities.map((a, i) => {
                const totalDays = timelineRange.days;
                const startOffset = getDaysBetween(timelineRange.start, a.available_from) - 1;
                const barWidth = getDaysBetween(a.available_from, a.available_to);
                const leftPercent = Math.max(0, (startOffset / totalDays) * 100);
                const widthPercent = Math.min(100 - leftPercent, (barWidth / totalDays) * 100);

                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{a.name}</span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {formatDate(a.available_from)} - {formatDate(a.available_to)}
                      </span>
                    </div>
                    <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full rounded-full ${a.color.replace("bg-", "bg-")} opacity-80`}
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline labels */}
            <div className="flex justify-between mt-2">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{formatDate(timelineRange.start)}</span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{formatDate(timelineRange.end)}</span>
            </div>
          </div>
        )}

        {/* Best Overlap */}
        {bestOverlap && (
          <div className="px-5 py-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-800 dark:text-green-300">Best dates found</span>
              </div>
              <p className="text-[15px] font-bold text-green-900 dark:text-green-200 mb-1">
                {formatDate(bestOverlap.start)} - {formatDate(bestOverlap.end)}
              </p>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                  {bestOverlap.count} of {members.length} members available
                </span>
              </div>

              {isCreator && onSetFinalDates && (
                <button
                  onClick={() => onSetFinalDates(bestOverlap.start, bestOverlap.end)}
                  className="mt-3 w-full py-2.5 rounded-xl text-[13px] font-semibold bg-green-600 hover:bg-green-500 text-white transition-all shadow-md"
                >
                  Set Final Dates
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {availabilities.length === 0 && (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No one has submitted dates yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Be the first to share your availability above</p>
          </div>
        )}
      </div>
    </div>
  );
}
