import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Plane, Home, Landmark, Wine, Coffee, Camera, Utensils, ShoppingBag, Train, Music, type LucideIcon } from "lucide-react";
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
  start_date: string;
  end_date: string;
  budget?: number;
  currency?: string;
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
  addMember: (tripId: number, name: string, color: string) => void;
  removeMember: (tripId: number, memberIndex: number) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

// Barcelona Activities
const barcelonaDay1: Activity[] = [
  {
    id: 1,
    icon: Plane,
    title: "You + Sara arriving",
    time: "12:30 PM",
    subtitle: "AA 432 • Terminal 1",
    badge: "ON TIME",
    badgeColor: "bg-teal-500",
    iconBg: "bg-teal-50 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    dotColor: "bg-teal-500",
  },
  {
    id: 2,
    icon: Home,
    title: "Check into Airbnb",
    time: "2:00 PM",
    duration: "1h",
    subtitle: "Gothic Quarter, Barcelona",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    id: 3,
    icon: Landmark,
    title: "Gothic Quarter Walk",
    time: "4:00 PM",
    duration: "2h",
    badge: "SIDEQUEST",
    badgeColor: "bg-orange-500",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 4,
    icon: Wine,
    title: "Tapas at Bar Cañete",
    time: "7:30 PM",
    duration: "2h",
    badge: "LOCAL",
    badgeColor: "bg-purple-500",
    price: "€35",
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
];

const barcelonaDay2: Activity[] = [
  {
    id: 5,
    icon: Coffee,
    title: "Brunch at Federal Café",
    time: "10:00 AM",
    duration: "1.5h",
    price: "€18",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  {
    id: 6,
    icon: Camera,
    title: "Park Güell Tour",
    time: "12:00 PM",
    duration: "3h",
    badge: "SIDEQUEST",
    badgeColor: "bg-orange-500",
    price: "€13",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 7,
    icon: Landmark,
    title: "Sagrada Familia Visit",
    time: "4:00 PM",
    duration: "2h",
    badge: "MUST DO",
    badgeColor: "bg-pink-500",
    price: "€26",
    iconBg: "bg-pink-50 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    dotColor: "bg-pink-500",
  },
  {
    id: 8,
    icon: Utensils,
    title: "Dinner at Cervecería Catalana",
    time: "8:00 PM",
    duration: "2h",
    price: "€42",
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
];

const barcelonaDay3: Activity[] = [
  {
    id: 9,
    icon: ShoppingBag,
    title: "La Boqueria Market",
    time: "9:30 AM",
    duration: "2h",
    badge: "LOCAL",
    badgeColor: "bg-purple-500",
    price: "€25",
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
  {
    id: 10,
    icon: Camera,
    title: "Barcelona Beach Walk",
    time: "12:00 PM",
    duration: "3h",
    badge: "SIDEQUEST",
    badgeColor: "bg-orange-500",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 11,
    icon: Music,
    title: "Flamenco Show at Tablao",
    time: "8:00 PM",
    duration: "2.5h",
    badge: "MUST DO",
    badgeColor: "bg-pink-500",
    price: "€55",
    iconBg: "bg-pink-50 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    dotColor: "bg-pink-500",
  },
];

const barcelonaDay4: Activity[] = [
  {
    id: 12,
    icon: Coffee,
    title: "Breakfast at Milk Bar",
    time: "9:00 AM",
    duration: "1h",
    price: "€15",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  {
    id: 13,
    icon: Landmark,
    title: "Montjuïc Castle & Views",
    time: "11:00 AM",
    duration: "3h",
    badge: "SIDEQUEST",
    badgeColor: "bg-orange-500",
    price: "€8",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 14,
    icon: Train,
    title: "Travel to Madrid",
    time: "5:00 PM",
    duration: "3h",
    subtitle: "High-speed AVE train",
    price: "€85",
    iconBg: "bg-teal-50 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    dotColor: "bg-teal-500",
  },
];

// Madrid Activities
const madridDay1: Activity[] = [
  {
    id: 15,
    icon: Home,
    title: "Check into Hotel",
    time: "8:30 PM",
    duration: "30m",
    subtitle: "Gran Vía district",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    id: 16,
    icon: Wine,
    title: "Tapas Crawl in Malasaña",
    time: "9:30 PM",
    duration: "2.5h",
    badge: "LOCAL",
    badgeColor: "bg-purple-500",
    price: "€38",
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
];

const madridDay2: Activity[] = [
  {
    id: 17,
    icon: Coffee,
    title: "Churros at San Ginés",
    time: "10:00 AM",
    duration: "1h",
    badge: "MUST DO",
    badgeColor: "bg-pink-500",
    price: "€8",
    iconBg: "bg-pink-50 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    dotColor: "bg-pink-500",
  },
  {
    id: 18,
    icon: Landmark,
    title: "Prado Museum",
    time: "11:30 AM",
    duration: "3h",
    badge: "MUST DO",
    badgeColor: "bg-pink-500",
    price: "€15",
    iconBg: "bg-pink-50 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    dotColor: "bg-pink-500",
  },
  {
    id: 19,
    icon: Camera,
    title: "Retiro Park Stroll",
    time: "3:00 PM",
    duration: "2h",
    badge: "SIDEQUEST",
    badgeColor: "bg-orange-500",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 20,
    icon: Utensils,
    title: "Dinner at Sobrino de Botín",
    time: "8:00 PM",
    duration: "2h",
    badge: "LOCAL",
    badgeColor: "bg-purple-500",
    price: "€65",
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
];

const madridDay3: Activity[] = [
  {
    id: 21,
    icon: Landmark,
    title: "Royal Palace Tour",
    time: "10:00 AM",
    duration: "2.5h",
    price: "€13",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    id: 22,
    icon: ShoppingBag,
    title: "Mercado de San Miguel",
    time: "1:00 PM",
    duration: "2h",
    badge: "LOCAL",
    badgeColor: "bg-purple-500",
    price: "€30",
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
  {
    id: 23,
    icon: Train,
    title: "Travel to Lisbon",
    time: "6:00 PM",
    duration: "9h",
    subtitle: "Overnight train",
    price: "€120",
    iconBg: "bg-teal-50 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    dotColor: "bg-teal-500",
  },
];

// Lisbon Activities
const lisbonDay1: Activity[] = [
  {
    id: 24,
    icon: Home,
    title: "Check into Airbnb",
    time: "8:00 AM",
    duration: "1h",
    subtitle: "Alfama district",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    id: 25,
    icon: Coffee,
    title: "Pastéis de Belém",
    time: "10:00 AM",
    duration: "1h",
    badge: "MUST DO",
    badgeColor: "bg-pink-500",
    price: "€6",
    iconBg: "bg-pink-50 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    dotColor: "bg-pink-500",
  },
  {
    id: 26,
    icon: Landmark,
    title: "Jerónimos Monastery",
    time: "11:30 AM",
    duration: "2h",
    price: "€10",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 27,
    icon: Camera,
    title: "Tram 28 Ride",
    time: "3:00 PM",
    duration: "2h",
    badge: "SIDEQUEST",
    badgeColor: "bg-orange-500",
    price: "€3",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 28,
    icon: Music,
    title: "Fado Night in Alfama",
    time: "9:00 PM",
    duration: "2.5h",
    badge: "MUST DO",
    badgeColor: "bg-pink-500",
    price: "€45",
    iconBg: "bg-pink-50 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    dotColor: "bg-pink-500",
  },
];

const lisbonDay2: Activity[] = [
  {
    id: 29,
    icon: Camera,
    title: "Sunrise at Miradouro",
    time: "6:30 AM",
    duration: "1h",
    badge: "SIDEQUEST",
    badgeColor: "bg-orange-500",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 30,
    icon: Coffee,
    title: "Brunch at The Mill",
    time: "9:00 AM",
    duration: "1.5h",
    price: "€22",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  {
    id: 31,
    icon: ShoppingBag,
    title: "Time Out Market",
    time: "1:00 PM",
    duration: "2h",
    badge: "LOCAL",
    badgeColor: "bg-purple-500",
    price: "€28",
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
  {
    id: 32,
    icon: Camera,
    title: "Sunset at LX Factory",
    time: "7:00 PM",
    duration: "2h",
    badge: "SIDEQUEST",
    badgeColor: "bg-orange-500",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 33,
    icon: Plane,
    title: "Flight Home",
    time: "11:30 PM",
    subtitle: "TAP 1234 • All group members",
    badge: "CHECK-IN",
    badgeColor: "bg-teal-500",
    iconBg: "bg-teal-50 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    dotColor: "bg-teal-500",
  },
];

// London trip activities
const londonDay1: Activity[] = [
  {
    id: 34,
    icon: Plane,
    title: "Arrive in London",
    time: "2:00 PM",
    subtitle: "Heathrow Airport",
    iconBg: "bg-teal-50 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    dotColor: "bg-teal-500",
  },
  {
    id: 35,
    icon: Landmark,
    title: "Tower Bridge Walk",
    time: "5:00 PM",
    duration: "2h",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  {
    id: 36,
    icon: Utensils,
    title: "Dinner at Borough Market",
    time: "8:00 PM",
    duration: "2h",
    price: "£35",
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
];

const mockTrips: Trip[] = [
  {
    id: 1,
    name: "Europe Spring Break",
    dates: "Jun 15 – Jun 23",
    duration: "9 days",
    status: "Active",
    cities: [
      { 
        name: "Barcelona", 
        flag: "🇪🇸", 
        days: 4, 
        activities: [barcelonaDay1, barcelonaDay2, barcelonaDay3, barcelonaDay4] 
      },
      { 
        name: "Madrid", 
        flag: "🇪🇸", 
        days: 3, 
        activities: [madridDay1, madridDay2, madridDay3] 
      },
      { 
        name: "Lisbon", 
        flag: "🇵🇹", 
        days: 2, 
        activities: [lisbonDay1, lisbonDay2] 
      },
    ],
    days: [
      { day: 1, date: "Jun 15", active: true },
      { day: 2, date: "Jun 16", active: false },
      { day: 3, date: "Jun 17", active: false },
      { day: 4, date: "Jun 18", active: false },
    ],
    members: 4,
    saved: 18,
    cityCount: 3,
    code: "EURO26",
    memberColors: ["bg-orange-500", "bg-teal-500", "bg-pink-500", "bg-blue-500"],
    memberInitials: ["H", "S", "Z", "A"],
  },
  {
    id: 2,
    name: "London Weekend",
    dates: "Dec 2025",
    duration: "3 days",
    status: "Completed",
    cities: [
      { 
        name: "London", 
        flag: "🇬🇧", 
        days: 3, 
        activities: [londonDay1, [], []] 
      }
    ],
    days: [
      { day: 1, date: "Dec 20", active: true },
      { day: 2, date: "Dec 21", active: false },
      { day: 3, date: "Dec 22", active: false },
    ],
    members: 2,
    saved: 8,
    cityCount: 1,
    code: "LOND25",
    memberColors: ["bg-orange-500", "bg-teal-500"],
    memberInitials: ["H", "S"],
  },
];

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function mapSupabaseTripToTrip(dbTrip: Record<string, unknown>, index: number): Trip {
  const destinations = (dbTrip.destinations as string[]) || [];
  const startDate = dbTrip.start_date ? new Date(dbTrip.start_date as string) : new Date();
  const endDate = dbTrip.end_date ? new Date(dbTrip.end_date as string) : new Date();
  const diffDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const flagMap: Record<string, string> = {
    spain: "\u{1F1EA}\u{1F1F8}", france: "\u{1F1EB}\u{1F1F7}", italy: "\u{1F1EE}\u{1F1F9}", germany: "\u{1F1E9}\u{1F1EA}",
    uk: "\u{1F1EC}\u{1F1E7}", portugal: "\u{1F1F5}\u{1F1F9}", japan: "\u{1F1EF}\u{1F1F5}", usa: "\u{1F1FA}\u{1F1F8}",
  };
  const defaultFlag = "\u{1F30D}";

  const daysPerCity = destinations.length > 0 ? Math.max(1, Math.floor(diffDays / destinations.length)) : diffDays;

  const cities: City[] = destinations.map((dest) => ({
    name: dest,
    flag: flagMap[dest.toLowerCase()] || defaultFlag,
    days: daysPerCity,
    activities: [[]],
  }));

  const days: Day[] = Array.from({ length: Math.min(diffDays, 14) }, (_, i) => {
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
    duration: `${diffDays} days`,
    status: (dbTrip.status as string) === "completed" ? "Completed" : "Active",
    cities,
    days,
    members: 1,
    saved: 0,
    cityCount: cities.length,
    code: (dbTrip.invite_code as string) || "------",
    memberColors: ["bg-orange-500"],
    memberInitials: ["Y"],
  };
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [supabaseTrips, setSupabaseTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposedActivities, setProposedActivities] = useState<ProposedActivity[]>([]);
  const [localMockTrips, setLocalMockTrips] = useState<Trip[]>(mockTrips);
  const { user } = useAuth();

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

  const addMember = useCallback((tripId: number, name: string, color: string) => {
    const initial = name.charAt(0).toUpperCase();
    const updateTrips = (prev: Trip[]) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              memberInitials: [...t.memberInitials, initial],
              memberColors: [...t.memberColors, color],
              members: t.members + 1,
            }
          : t
      );
    setLocalMockTrips(updateTrips);
    setSupabaseTrips(updateTrips);
    // Also update activeTrip if it matches
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

  const removeMember = useCallback((tripId: number, memberIndex: number) => {
    const updateTrips = (prev: Trip[]) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              memberInitials: t.memberInitials.filter((_, i) => i !== memberIndex),
              memberColors: t.memberColors.filter((_, i) => i !== memberIndex),
              members: Math.max(0, t.members - 1),
            }
          : t
      );
    setLocalMockTrips(updateTrips);
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

  const loadTrips = useCallback(async () => {
    if (!user) {
      setSupabaseTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      setSupabaseTrips(data.map((t, i) => mapSupabaseTripToTrip(t, i)));
    } else {
      setSupabaseTrips([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const createTrip = async (data: CreateTripData): Promise<{ error: string | null; tripId?: string | number }> => {
    if (!user) return { error: "You must be logged in to create a trip" };

    const inviteCode = generateInviteCode();
    const { data: created, error } = await supabase.from("trips").insert({
      title: data.title,
      destinations: data.destinations.filter((d) => d.trim() !== ""),
      start_date: data.start_date,
      end_date: data.end_date,
      budget: data.budget || 0,
      currency: data.currency || "USD",
      owner_id: user.id,
      mode: "planning",
      status: "active",
      invite_code: inviteCode,
    }).select().single();

    if (error) {
      console.error("Create trip error:", error);
      // Even if Supabase fails, add locally so user sees it
      const localId = Date.now();
      const localTrip = mapSupabaseTripToTrip({
        id: localId,
        title: data.title,
        destinations: data.destinations.filter((d) => d.trim() !== ""),
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
      return { error: null, tripId: created.id };
    }
    return { error: null };
  };

  // Show Supabase trips first, then mock trips as demos
  const trips = user ? [...supabaseTrips, ...localMockTrips] : localMockTrips;

  return (
    <TripContext.Provider value={{ activeTrip, setActiveTrip, trips, loading, createTrip, loadTrips, proposedActivities, approvedActivities, proposeActivity, approveActivity, rejectActivity, addMember, removeMember }}>
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
