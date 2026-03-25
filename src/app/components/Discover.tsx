"use client";

import { Filter, MapPin, Star, X, Heart, Plane } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, animate, type PanInfo } from "motion/react";
import { useTrip } from "../context/TripContext";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Fetch activities directly from free APIs (no serverless function needed)
async function fetchLiveActivities(cityName: string): Promise<Place[]> {
  const results: Place[] = [];

  // Step 1: Geocode city
  let lat = 0, lon = 0;
  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`, {
      headers: { "Accept-Language": "en", "User-Agent": "Weventr/1.0" },
    });
    const geoData = await geoRes.json();
    if (geoData.length === 0) return [];
    lat = parseFloat(geoData[0].lat);
    lon = parseFloat(geoData[0].lon);
  } catch { return []; }

  // Step 2: Fetch from OpenTripMap (free, no key, CORS-friendly)
  try {
    const kinds = "interesting_places,cultural,natural,foods,sport";
    const listRes = await fetch(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=10000&lon=${lon}&lat=${lat}&kinds=${kinds}&rate=2&limit=15&format=json`
    );
    if (listRes.ok) {
      const places = await listRes.json();
      for (const place of places.slice(0, 10)) {
        if (!place.name) continue;
        try {
          const dRes = await fetch(`https://api.opentripmap.com/0.1/en/places/xid/${place.xid}`);
          if (!dRes.ok) continue;
          const d = await dRes.json();
          if (!d.name) continue;

          const k = (d.kinds || "").split(",");
          const category = k.includes("foods") ? "Food" : k.includes("cultural") ? "Culture" : k.includes("natural") ? "Nature" : "SideQuest";

          results.push({
            id: `otm_${place.xid}`,
            name: d.name,
            location: cityName,
            description: d.wikipedia_extracts?.text?.slice(0, 200) || `A popular ${category.toLowerCase()} spot in ${cityName}.`,
            price: "",
            duration: "",
            rating: place.rate ? Math.min(10, place.rate + 5) : 8.5,
            tags: [category, "SideQuest"],
            image: d.preview?.source || d.image || "",
            city: cityName,
          });
        } catch { continue; }
      }
    }
  } catch { /* silent */ }

  // Step 3: Fetch from Overpass/OpenStreetMap (free, no key)
  try {
    const query = `[out:json][timeout:8];(node["tourism"~"attraction|museum|viewpoint"](around:8000,${lat},${lon});node["leisure"~"park|garden"](around:8000,${lat},${lon}););out body 10;`;
    const osmRes = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (osmRes.ok) {
      const osmData = await osmRes.json();
      for (const el of (osmData.elements || [])) {
        if (!el.tags?.name) continue;
        const t = el.tags;
        const cat = t.tourism === "museum" ? "Culture" : t.tourism === "viewpoint" ? "Views" : "Nature";
        results.push({
          id: `osm_${el.id}`,
          name: t.name,
          location: cityName,
          description: t.description || `A ${cat.toLowerCase()} spot in ${cityName}.`,
          price: "",
          duration: "",
          rating: 8.5,
          tags: [cat, "SideQuest"],
          image: t.image || "",
          city: cityName,
        });
      }
    }
  } catch { /* silent */ }

  return results;
}

interface Place {
  id: string;
  name: string;
  location: string;
  description: string;
  price: string;
  duration: string;
  rating: number;
  tags: string[];
  image: string;
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
  }
  return `${minutes}min`;
}

function formatCostTier(costTier: number | string | null | undefined): string {
  if (!costTier) return "$";
  if (typeof costTier === "string") return costTier;
  return "$".repeat(Math.max(1, Math.min(4, costTier)));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapActivityToPlace(activity: any): Place {
  const location = [activity.neighborhood, activity.city]
    .filter(Boolean)
    .join(", ");

  const tags: string[] = Array.isArray(activity.tags) && activity.tags.length > 0
    ? activity.tags.slice(0, 2)
    : ["SideQuest", activity.experience_tag || "Adventure"].slice(0, 2);

  const image =
    (Array.isArray(activity.images) && activity.images.length > 0 && activity.images[0]) ||
    activity.image_url ||
    "";

  return {
    id: activity.id,
    name: activity.name || "Untitled",
    location: location || "Unknown location",
    description: activity.description || "",
    price: formatCostTier(activity.cost_tier),
    duration: formatDuration(activity.duration_minutes),
    rating: activity.sidequest_score ?? 9.0,
    tags,
    image,
  };
}

/** Calculate intensity score (1-10) from normalized drag distance (0.65-1.0) */
function calcIntensityScore(normalizedDrag: number): number {
  const abs = Math.abs(normalizedDrag);
  if (abs < 0.65) return 0;
  if (abs <= 0.75) {
    // Slight drag -> 4-5
    const t = (abs - 0.65) / 0.1;
    return Math.round(4 + t);
  }
  if (abs <= 0.85) {
    // Medium drag -> 6-7
    const t = (abs - 0.75) / 0.1;
    return Math.round(6 + t);
  }
  // Full drag -> 8-10
  const t = (abs - 0.85) / 0.15;
  return Math.round(8 + t * 2);
}

export function Discover() {
  const { activeTrip, proposeActivity } = useTrip();
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [intensity, setIntensity] = useState(0);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const sliderX = useMotionValue(0);
  // Track whether a swipe action is in progress to prevent double-fires
  const isSwipingRef = useRef(false);
  // Key to force-remount the slider draggable, clearing stale drag offset
  const [sliderKey, setSliderKey] = useState(0);

  // Fetch activities — from Supabase first, fall back to live API for trip cities
  useEffect(() => {
    let cancelled = false;

    async function fetchActivities() {
      setLoading(true);
      setFetchError(false);

      // Get cities to fetch for (from active trip or all)
      const tripCities = activeTrip?.cities.map(c => c.name) || [];

      // Fetch from Supabase
      let query = supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(50);
      if (tripCities.length > 0) {
        // Filter to trip cities
        query = query.in("city", tripCities);
      }
      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        console.error("Failed to fetch activities:", error);
        setFetchError(true);
        setPlaces([]);
        setLoading(false);
        return;
      }

      let activities = (data || []).map(mapActivityToPlace);

      // If Supabase has few results, fetch directly from free APIs (client-side, no serverless)
      const citiesToFetch = tripCities.length > 0
        ? tripCities
        : activities.length < 10
          ? ["Barcelona", "Paris", "Rome", "Istanbul", "Seoul", "Bali"].sort(() => Math.random() - 0.5).slice(0, 3)
          : [];

      if (activities.length < 10 && citiesToFetch.length > 0) {
        for (const city of citiesToFetch) {
          if (cancelled) break;
          const liveResults = await fetchLiveActivities(city);
          activities = [...activities, ...liveResults];
          if (activities.length >= 25) break;
        }
      }

      if (!cancelled) {
        // Shuffle for variety
        setPlaces(activities.sort(() => Math.random() - 0.5));
        setLoading(false);
      }
    }

    fetchActivities();
    return () => { cancelled = true; };
  }, [activeTrip?.id]);

  const refetchActivities = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch activities:", error);
      setPlaces([]);
      setFetchError(true);
    } else {
      setPlaces((data || []).map(mapActivityToPlace));
    }
    setLoading(false);
  }, []);

  // Auto-select first trip city when activeTrip changes
  useEffect(() => {
    if (activeTrip && activeTrip.cities.length > 0) {
      setActiveCity(activeTrip.cities[0].name);
      setCurrentIndex(0);
      setIntensity(0);
      sliderX.set(0);
    }
  }, [activeTrip, sliderX]);

  // City pills only show when there's an active trip — no random city pills
  const cities = activeTrip
    ? activeTrip.cities.map((city, index) => ({
        name: city.name,
        flag: city.flag,
        active: activeCity ? activeCity === city.name : index === 0,
      }))
    : [];

  // Filter places by active city
  const activeCityName = cities.find((c) => c.active)?.name;
  const filteredPlaces = activeCityName
    ? places.filter((p) => p.location.includes(activeCityName))
    : places;

  const resetSlider = useCallback(() => {
    setIntensity(0);
    sliderX.set(0);
    // Remount the draggable to clear internal drag offset
    setSliderKey((k) => k + 1);
  }, [sliderX]);

  const handleCityClick = (cityName: string) => {
    setActiveCity(cityName);
    setCurrentIndex(0);
    resetSlider();
  };

  const saveActivity = useCallback(
    async (activityId: string, intensityScore: number) => {
      if (!user) return;
      const { error } = await supabase.from("saved_activities").upsert({
        user_id: user.id,
        activity_id: activityId,
        is_super_like: intensityScore >= 8,
      });
      if (error) {
        console.error("Failed to save activity:", error);
      }
    },
    [user]
  );

  const removeCard = useCallback(
    (direction: "left" | "right", intensityAtSwipe: number) => {
      if (isSwipingRef.current) return;
      isSwipingRef.current = true;

      const currentPlace = filteredPlaces[currentIndex];
      const score = calcIntensityScore(intensityAtSwipe);

      if (direction === "right" && currentPlace) {
        saveActivity(currentPlace.id, score);
        // If there's an active trip, propose this activity for group voting
        if (activeTrip) {
          const cityParts = currentPlace.location.split(", ");
          const city = cityParts[cityParts.length - 1] || "";
          proposeActivity({
            id: typeof currentPlace.id === "string" ? parseInt(currentPlace.id, 10) || Date.now() : Number(currentPlace.id),
            name: currentPlace.name,
            location: currentPlace.location,
            city,
            description: currentPlace.description,
            tags: currentPlace.tags,
            price: currentPlace.price,
            duration: currentPlace.duration,
          });
        }
      }

      // Advance index — AnimatePresence handles the exit animation via the key change
      setCurrentIndex((prev) => prev + 1);
      resetSlider();

      // Allow next swipe after exit animation completes
      setTimeout(() => {
        isSwipingRef.current = false;
      }, 400);
    },
    [currentIndex, filteredPlaces, saveActivity, resetSlider, activeTrip, proposeActivity]
  );

  const handleSliderDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const sliderWidth = 280;
    const maxOffset = sliderWidth / 2 - 24;
    const normalizedValue = Math.max(-1, Math.min(1, info.offset.x / maxOffset));
    setIntensity(normalizedValue);
  };

  const handleSliderDragEnd = () => {
    if (intensity < -0.65) {
      removeCard("left", intensity);
    } else if (intensity > 0.65) {
      removeCard("right", intensity);
    } else {
      // Below threshold — dragSnapToOrigin handles the spring back
      setIntensity(0);
    }
  };

  const currentPlace = filteredPlaces[currentIndex];
  const remainingCards = filteredPlaces.length - currentIndex;

  return (
    <div className="px-5 py-4 h-screen flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pt-1">
        <h1 className="text-[28px] tracking-tight text-zinc-900 dark:text-white">Discover</h1>
        <button className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent">
          <Filter className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </button>
      </div>

      {/* Trip Mode Banner */}
      {activeTrip && (
        <button className="w-full bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2 text-left transition-colors hover:bg-orange-500/15">
          <Plane className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-[14px] font-medium text-orange-600 dark:text-orange-400">
            Proposing for {activeTrip.name}
          </span>
        </button>
      )}

      {/* City Pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {cities.map((city) => (
          <button
            key={city.name}
            onClick={() => handleCityClick(city.name)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
              city.active
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
            }`}
          >
            {city.flag && <span className="text-lg">{city.flag}</span>}
            <span className="text-[15px] font-medium">{city.name}</span>
          </button>
        ))}
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative mb-5 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-8">
              <div className="w-10 h-10 border-4 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400 text-[15px]">Finding adventures...</p>
            </div>
          </div>
        ) : fetchError ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-8">
              <div className="text-5xl mb-4">😕</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Couldn't load activities</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[14px] mb-5">Something went wrong. Please try again.</p>
              <button
                onClick={refetchActivities}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[15px] font-semibold transition-colors shadow-md"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : remainingCards > 0 && currentPlace ? (
          <>
            {/* Background cards */}
            {currentIndex + 1 < filteredPlaces.length && (
              <div
                className="absolute inset-0 rounded-[28px] bg-zinc-200 dark:bg-zinc-900/80"
                style={{
                  transform: 'scale(0.95) translateY(8px)',
                  zIndex: 1,
                }}
              />
            )}
            {currentIndex + 2 < filteredPlaces.length && (
              <div
                className="absolute inset-0 rounded-[28px] bg-zinc-300/25 dark:bg-zinc-800/40"
                style={{
                  transform: 'scale(0.90) translateY(16px)',
                  zIndex: 0,
                }}
              />
            )}

            {/* Current Card with AnimatePresence for smooth enter/exit */}
            <AnimatePresence mode="wait">
              <SwipeCard
                place={currentPlace}
                onSwipe={(dir) => removeCard(dir, intensity)}
                intensity={intensity}
                key={currentPlace.id + "-" + currentIndex}
              />
            </AnimatePresence>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-8">
              <div className="text-6xl mb-4">{activeTrip && activeCityName ? "🗺️" : "✨"}</div>
              <h3 className="text-xl text-zinc-900 dark:text-white mb-2">
                {activeTrip && activeCityName
                  ? `You've seen everything in ${activeCityName}`
                  : "All Caught Up!"}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[15px]">
                {activeTrip && activeCityName
                  ? "Try another city or check back later"
                  : "Check back later for more recommendations"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Intensity Slider */}
      <div className="pb-1">
        <div className="flex justify-between items-center text-[13px] text-zinc-600 dark:text-zinc-400 mb-3 px-1 font-medium">
          <div className="flex items-center gap-1.5">
            <X className="w-4 h-4 text-red-500 dark:text-red-400" />
            <span>Pass</span>
          </div>
          <span className="text-zinc-400 dark:text-zinc-500 tracking-wider text-[11px] uppercase">Intensity</span>
          <div className="flex items-center gap-1.5">
            <span>Save</span>
            <Heart className="w-4 h-4 text-teal-500 dark:text-teal-400" />
          </div>
        </div>

        {/* Gradient Slider */}
        <div className="relative h-[60px] rounded-full bg-gradient-to-r from-red-50 dark:from-red-950/30 via-zinc-100 dark:via-zinc-900 to-teal-50 dark:to-teal-950/30 border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg dark:shadow-xl">
          {/* Active gradient overlay */}
          <div
            className="absolute inset-0 transition-all duration-150"
            style={{
              background: intensity < 0
                ? `linear-gradient(to right, rgba(239, 68, 68, ${Math.abs(intensity) * 0.5}), transparent 60%)`
                : intensity > 0
                ? `linear-gradient(to left, rgba(20, 184, 166, ${intensity * 0.5}), transparent 60%)`
                : 'transparent'
            }}
          />

          {/* Center indicator line */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-zinc-300 dark:bg-zinc-700/50" />

          {/* Draggable Circle — key forces remount so drag offset resets cleanly */}
          <motion.div
            key={sliderKey}
            drag="x"
            dragConstraints={{ left: -130, right: 130 }}
            dragElastic={0.05}
            dragMomentum={false}
            dragSnapToOrigin
            onDrag={handleSliderDrag}
            onDragEnd={handleSliderDragEnd}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-zinc-900 dark:bg-white shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
            animate={{
              scale: Math.abs(intensity) > 0.4 ? 1.15 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {intensity < -0.3 && <X className="w-6 h-6 text-white dark:text-red-500" strokeWidth={2.5} />}
            {intensity > 0.3 && <Heart className="w-6 h-6 text-white dark:text-teal-500 fill-current" />}
            {Math.abs(intensity) <= 0.3 && (
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-white dark:bg-zinc-300" />
                <div className="w-1 h-1 rounded-full bg-white dark:bg-zinc-300" />
                <div className="w-1 h-1 rounded-full bg-white dark:bg-zinc-300" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface SwipeCardProps {
  place: Place;
  onSwipe?: (direction: "left" | "right") => void;
  intensity: number;
}

function SwipeCard({ place, onSwipe, intensity }: SwipeCardProps) {
  // Determine image src
  const imageSrc = place.image && (place.image.startsWith("http://") || place.image.startsWith("https://"))
    ? place.image
    : place.image
    ? `https://source.unsplash.com/featured/?${place.image}`
    : "";

  return (
    <motion.div
      className="absolute inset-0 z-10"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        x: intensity * 60,
        rotate: intensity * 10,
        opacity: 1,
        scale: 1,
      }}
      exit={{
        x: intensity < 0 ? -400 : 400,
        rotate: intensity < 0 ? -25 : 25,
        opacity: 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="h-full rounded-[28px] overflow-hidden bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/50 dark:border-transparent flex flex-col">
        {/* Image */}
        <div className="relative flex-1 min-h-0 bg-gradient-to-br from-orange-900 to-orange-700">
          {imageSrc && (
            <ImageWithFallback
              src={imageSrc}
              alt={place.name}
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

          {/* Swipe Indicators */}
          <motion.div
            className="absolute top-6 left-6 bg-red-500 text-white px-5 py-2.5 rounded-xl text-lg font-bold rotate-[-15deg] border-[3px] border-white shadow-2xl"
            animate={{ opacity: intensity < -0.3 ? 1 : 0, scale: intensity < -0.3 ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            PASS
          </motion.div>
          <motion.div
            className="absolute top-6 right-6 bg-teal-500 text-white px-5 py-2.5 rounded-xl text-lg font-bold rotate-[15deg] border-[3px] border-white shadow-2xl"
            animate={{ opacity: intensity > 0.3 ? 1 : 0, scale: intensity > 0.3 ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            SAVE
          </motion.div>

          {/* Tags */}
          <div className="absolute top-5 left-5 right-5 flex justify-between">
            <span className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md shadow-lg">
              {place.tags[0]}
            </span>
            <span className="bg-white/95 text-black px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md shadow-lg">
              {place.tags[1]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-6">
          <div className="mb-4">
            <h3 className="text-[22px] leading-tight mb-2 font-semibold text-zinc-900 dark:text-white">{place.name}</h3>

            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-3">
              <MapPin className="w-4 h-4" strokeWidth={2} />
              <span className="text-[15px]">{place.location}</span>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400 text-[15px] leading-relaxed">
              {place.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <span className="text-zinc-700 dark:text-zinc-300 text-[15px] font-medium">{place.price}</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-[14px]">{place.duration}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-100 dark:border-transparent">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-amber-400">{place.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
