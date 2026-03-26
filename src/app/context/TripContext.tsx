import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthContext";

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

interface City {
  name: string;
  flag: string;
  days: number;
  activities: Activity[][];
}

interface Day {
  day: number;
  date: string;
  active: boolean;
}

interface Trip {
  id: number | string;
  name: string;
  dates: string;
  duration: string;
  status: "Active" | "Completed";
  cities: City[];
  days: Day[];
  members: number;
  saved: number;
  cityCount: number;
  code: string;
  memberColors: string[];
  memberInitials: string[];
  metadata?: {
    transport_mode?: string;
    booking_code?: string;
    transport_cost?: number;
    hotel_sorted?: string;
    hotel_cost_per_night?: number;
    personal_budget?: number;
  };
}

interface ProposedActivity {
  id: number;
  name: string;
  location: string;
  city: string;
  description: string;
  tags: string[];
  price: string;
  duration: string;
  status: "pending" | "approved" | "rejected";
}

interface CreateTripData {
  title: string;
  destinations: string[];
  daysPerCity?: number[];
  start_date: string;
  end_date: string;
  budget?: number;
  currency?: string;
  trip_vibe?: string;
  budget_mode?: string;
  group_size?: number;
}

interface TripContextType {
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
  trips: Trip[];
  loading: boolean;
  createTrip: (data: CreateTripData) => Promise<{ error: string | null; tripId?: string | number }>;
  loadTrips: () => Promise<void>;
  proposedActivities: ProposedActivity[];
  approvedActivities: ProposedActivity[];
  proposeActivity: (activity: Omit<ProposedActivity, "status">) => void;
  approveActivity: (id: number) => void;
  rejectActivity: (id: number) => void;
  addMember: (tripId: number | string, name: string, color: string) => void;
  removeMember: (tripId: number | string, memberIndex: number) => void;
  updateTripStatus: (tripId: number | string, status: "Active" | "Completed") => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function mapSupabaseTripToTrip(dbTrip: Record<string, unknown>, index: number): Trip {
  const rawDestinations = (dbTrip.destinations as string[]) || [];
  const startDate = dbTrip.start_date ? new Date(dbTrip.start_date as string) : new Date();
  const endDate = dbTrip.end_date ? new Date(dbTrip.end_date as string) : new Date();
  const diffDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const flagMap: Record<string, string> = {
    spain: "\u{1F1EA}\u{1F1F8}", france: "\u{1F1EB}\u{1F1F7}", italy: "\u{1F1EE}\u{1F1F9}", germany: "\u{1F1E9}\u{1F1EA}",
    uk: "\u{1F1EC}\u{1F1E7}", portugal: "\u{1F1F5}\u{1F1F9}", japan: "\u{1F1EF}\u{1F1F5}", usa: "\u{1F1FA}\u{1F1F8}",
    barcelona: "\u{1F1EA}\u{1F1F8}", madrid: "\u{1F1EA}\u{1F1F8}", lisbon: "\u{1F1F5}\u{1F1F9}",
    paris: "\u{1F1EB}\u{1F1F7}", rome: "\u{1F1EE}\u{1F1F9}", london: "\u{1F1EC}\u{1F1E7}",
    tokyo: "\u{1F1EF}\u{1F1F5}", berlin: "\u{1F1E9}\u{1F1EA}", amsterdam: "\u{1F1F3}\u{1F1F1}",
  };
  const defaultFlag = "\u{1F30D}";

  const parsed = rawDestinations.map((raw) => {
    const parts = raw.split(":");
    if (parts.length >= 2) {
      const days = parseInt(parts[parts.length - 1], 10);
      const name = parts.slice(0, -1).join(":");
      return { name: name.trim(), days: isNaN(days) ? 2 : days };
    }
    return { name: raw.trim(), days: Math.max(1, Math.floor(diffDays / (rawDestinations.length || 1))) };
  });

  const cities: City[] = parsed.map(({ name, days }) => ({
    name,
    flag: flagMap[name.toLowerCase()] || defaultFlag,
    days,
    activities: Array.from({ length: days }, () => []),
  }));

  const totalCityDays = cities.reduce((sum, c) => sum + c.days, 0);
  const actualDays = totalCityDays > 0 ? totalCityDays : diffDays;

  const days: Day[] = Array.from({ length: Math.min(actualDays, 30) }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return {
      day: i + 1,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      active: i === 0,
    };
  });

  const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return {
    id: dbTrip.id as string | number,
    name: (dbTrip.title as string) || "Untitled Trip",
    dates: `${startStr} \u2013 ${endStr}`,
    duration: `${actualDays} days`,
    status: (dbTrip.status as string) === "completed" ? "Completed" : "Active",
    cities,
    days,
    members: 1,
    saved: 0,
    cityCount: cities.length,
    code: (dbTrip.invite_code as string) || "------",
    memberColors: ["bg-orange-500"],
    memberInitials: ["Y"],
    metadata: (dbTrip.metadata as Trip["metadata"]) || undefined,
  };
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [supabaseTrips, setSupabaseTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposedActivities, setProposedActivities] = useState<ProposedActivity[]>([]);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setActiveTrip(null);
      setSupabaseTrips([]);
      setProposedActivities([]);
    }
  }, [user]);

  const proposeActivity = useCallback((activity: Omit<ProposedActivity, "status">) => {
    setProposedActivities((prev) => {
      if (prev.some((a) => a.id === activity.id)) return prev;
      return [...prev, { ...activity, status: "pending" as const }];
    });
  }, []);

  const approveActivity = useCallback((id: number) => {
    setProposedActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "approved" as const } : a))
    );
  }, []);

  const rejectActivity = useCallback((id: number) => {
    setProposedActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a))
    );
  }, []);

  const approvedActivities = proposedActivities.filter((a) => a.status === "approved");

  const addMember = useCallback((tripId: number | string, name: string, color: string) => {
    const initial = name.charAt(0).toUpperCase();
    const updateTrips = (prev: Trip[]) =>
      prev.map((t) =>
        String(t.id) === String(tripId)
          ? {
              ...t,
              memberInitials: [...t.memberInitials, initial],
              memberColors: [...t.memberColors, color],
              members: t.members + 1,
            }
          : t
      );
    setSupabaseTrips(updateTrips);
    setActiveTrip((prev) => {
      if (prev && prev.id === tripId) {
        return {
          ...prev,
          memberInitials: [...prev.memberInitials, initial],
          memberColors: [...prev.memberColors, color],
          members: prev.members + 1,
        };
      }
      return prev;
    });
  }, []);

  const removeMember = useCallback((tripId: number | string, memberIndex: number) => {
    const updateTrips = (prev: Trip[]) =>
      prev.map((t) =>
        String(t.id) === String(tripId)
          ? {
              ...t,
              memberInitials: t.memberInitials.filter((_, i) => i !== memberIndex),
              memberColors: t.memberColors.filter((_, i) => i !== memberIndex),
              members: Math.max(0, t.members - 1),
            }
          : t
      );
    setSupabaseTrips(updateTrips);
    setActiveTrip((prev) => {
      if (prev && prev.id === tripId) {
        return {
          ...prev,
          memberInitials: prev.memberInitials.filter((_, i) => i !== memberIndex),
          memberColors: prev.memberColors.filter((_, i) => i !== memberIndex),
          members: Math.max(0, prev.members - 1),
        };
      }
      return prev;
    });
  }, []);

  const updateTripStatus = useCallback((tripId: number | string, status: "Active" | "Completed") => {
    const updateTrips = (prev: Trip[]) =>
      prev.map((t) => String(t.id) === String(tripId) ? { ...t, status } : t);
    setSupabaseTrips(updateTrips);
    setActiveTrip((prev) => {
      if (prev && String(prev.id) === String(tripId)) return { ...prev, status };
      return prev;
    });
    if (typeof tripId === "string" && tripId.includes("-")) {
      supabase.from("trips").update({ status: status.toLowerCase() }).eq("id", tripId).then(() => {});
    }
  }, []);

  const loadTrips = useCallback(async () => {
    if (!user) {
      setSupabaseTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: ownedTrips, error: ownedError } = await supabase
      .from("trips")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    const { data: memberRows } = await supabase
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", user.id);

    let allTrips = ownedTrips || [];

    if (memberRows && memberRows.length > 0) {
      const ownedIds = new Set(allTrips.map(t => t.id));
      const joinedIds = memberRows.map(m => m.trip_id).filter(id => !ownedIds.has(id));
      if (joinedIds.length > 0) {
        const { data: joinedTrips } = await supabase
          .from("trips")
          .select("*")
          .in("id", joinedIds);
        if (joinedTrips) allTrips = [...allTrips, ...joinedTrips];
      }
    }

    if (!ownedError && allTrips.length > 0) {
      setSupabaseTrips(allTrips.map((t, i) => mapSupabaseTripToTrip(t, i)));
    } else if (ownedError) {
      console.error("Failed to load trips:", ownedError);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const createTrip = async (data: CreateTripData): Promise<{ error: string | null; tripId?: string | number }> => {
    if (!user) return { error: "You must be logged in to create a trip" };
    if (isCreatingTrip) return { error: "Already creating a trip, please wait..." };

    setIsCreatingTrip(true);
    try {
      const inviteCode = generateInviteCode();
      const filteredDests = data.destinations.filter((d) => d.trim() !== "");
      const encodedDests = filteredDests.map((dest, i) => {
        const days = data.daysPerCity?.[i] || 2;
        return `${dest.trim()}:${days}`;
      });
      const { data: created, error } = await supabase.from("trips").insert({
        title: data.title,
        destinations: encodedDests,
        start_date: data.start_date,
        end_date: data.end_date,
        budget: data.budget || 0,
        currency: data.currency || "USD",
        owner_id: user.id,
        mode: "planning",
        status: "active",
        invite_code: inviteCode,
        metadata: {
          trip_vibe: data.trip_vibe || null,
          budget_mode: data.budget_mode || null,
          group_size: data.group_size || null,
        },
      }).select().single();

      if (error) {
        console.error("Create trip error:", error);
        const localId = Date.now();
        const localTrip = mapSupabaseTripToTrip({
          id: localId,
          title: data.title,
          destinations: encodedDests,
          start_date: data.start_date,
          end_date: data.end_date,
          budget: data.budget || 0,
          currency: data.currency || "USD",
          mode: "planning",
          status: "active",
          invite_code: inviteCode,
        }, 0);
        setSupabaseTrips(prev => [localTrip, ...prev]);
        return { error: null, tripId: localId };
      }

      if (created) {
        const newTrip = mapSupabaseTripToTrip(created, 0);
        setSupabaseTrips(prev => [newTrip, ...prev]);

        const dests = (created.destinations as string[]) || [];
        for (const dest of dests) {
          const cityName = dest.includes(":") ? dest.split(":").slice(0, -1).join(":") : dest;
          fetch("/api/sync-activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ city: cityName.trim() }),
          }).catch(() => {});
        }

        return { error: null, tripId: created.id };
      }
      return { error: null };
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // Only show real Supabase trips — no mock/demo data
  const trips = supabaseTrips;

  return (
    <TripContext.Provider value={{ activeTrip, setActiveTrip, trips, loading, createTrip, loadTrips, proposedActivities, approvedActivities, proposeActivity, approveActivity, rejectActivity, addMember, removeMember, updateTripStatus }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
}
