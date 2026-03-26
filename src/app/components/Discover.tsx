"use client";

import { Filter, MapPin, Star, X, Heart, Plane, ChevronUp } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, AnimatePresence, type PanInfo } from "motion/react";
import { useTrip } from "../context/TripContext";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Cache for fetched activities per city — avoids refetching on city switch
const activityCache: Record<string, Place[]> = {};

// Fetch activities directly from free APIs (no serverless function needed)
async function fetchLiveActivities(cityName: string): Promise<Place[]> {
  // Return cached if available
  if (activityCache[cityName]?.length > 0) return activityCache[cityName];

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

  // Fetch Overpass + Wikipedia in PARALLEL for speed
  const [osmResults, wikiResults] = await Promise.all([
    fetchOverpassPlaces(lat, lon, cityName),
    fetchWikipediaPlaces(lat, lon, cityName),
  ]);
  results.push(...osmResults, ...wikiResults);

  // Fetch real images from Wikimedia Commons for activities missing them
  const needImages = results.filter(r => !r.image);
  if (needImages.length > 0) {
    await Promise.all(needImages.slice(0, 8).map(async (place) => {
      try {
        const res = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(place.name + " " + cityName)}&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json&origin=*`
        );
        if (res.ok) {
          const data = await res.json();
          const pages = data.query?.pages;
          if (pages) {
            const page = Object.values(pages)[0] as any;
            const url = page?.imageinfo?.[0]?.thumburl;
            if (url && !url.includes(".svg")) place.image = url;
          }
        }
      } catch { /* silent */ }
    }));
  }

  // Cache and return
  activityCache[cityName] = results;

  // Persist to Supabase so they're not lost next session
  if (results.length > 0) {
    const rows = results.map(r => ({
      name: r.name,
      city: cityName,
      description: r.description,
      cost_tier: r.price === "$$" ? 2 : r.price === "$" ? 1 : 0,
      duration_minutes: r.duration.includes("h") ? parseInt(r.duration) * 60 : parseInt(r.duration) || null,
      tags: r.tags,
      image_url: r.image || null,
      experience_tag: r.tags[0] || "Explore",
      neighborhood: r.location !== cityName ? r.location : null,
    }));
    // Upsert by name+city to avoid duplicates
    supabase.from("activities").upsert(rows, { onConflict: "name,city", ignoreDuplicates: true }).then(({ error }) => {
      if (error) console.warn("Failed to persist activities:", error.message);
    });
  }

  return results;
}

async function fetchOverpassPlaces(lat: number, lon: number, cityName: string): Promise<Place[]> {
  const results: Place[] = [];
  try {
    const query = `[out:json][timeout:15];(
      node["tourism"~"attraction|museum|viewpoint|artwork|gallery|theme_park|zoo|aquarium"](around:12000,${lat},${lon});
      node["historic"~"temple|shrine|castle|monument|memorial|ruins|fort|archaeological_site"](around:12000,${lat},${lon});
      node["amenity"~"restaurant|cafe|marketplace|theatre|cinema|community_centre|ice_cream"](around:12000,${lat},${lon});
      node["leisure"~"park|garden|nature_reserve|stadium|water_park|beach_resort|sports_centre"](around:12000,${lat},${lon});
      node["shop"~"mall|department_store"](around:12000,${lat},${lon});
      way["tourism"~"attraction|museum|theme_park|zoo|aquarium"](around:12000,${lat},${lon});
      way["leisure"~"park|garden|stadium|beach_resort"](around:12000,${lat},${lon});
    );out body 50;`;
    const osmRes = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (osmRes.ok) {
      const osmData = await osmRes.json();
      const seen = new Set<string>();
      for (const el of (osmData.elements || [])) {
        // Prefer English name, fall back to local name
        const name = el.tags?.["name:en"] || el.tags?.name;
        if (!name || name.length < 3 || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        const t = el.tags;
        const tourism = t.tourism || "";
        const historic = t.historic || "";
        const amenity = t.amenity || "";
        const leisure = t.leisure || "";

        // Categorize
        const shop = t.shop || "";
        const cat = historic ? "Culture"
          : tourism === "museum" || tourism === "gallery" || tourism === "artwork" ? "Culture"
          : tourism === "viewpoint" ? "Views"
          : tourism === "theme_park" || tourism === "zoo" || tourism === "aquarium" ? "Entertainment"
          : amenity === "restaurant" || amenity === "cafe" || amenity === "ice_cream" ? "Food"
          : amenity === "marketplace" ? "Food"
          : amenity === "theatre" || amenity === "cinema" ? "Entertainment"
          : leisure === "park" || leisure === "garden" || leisure === "nature_reserve" ? "Nature"
          : leisure === "stadium" || leisure === "sports_centre" || leisure === "water_park" ? "Entertainment"
          : shop === "mall" || shop === "department_store" ? "Shopping"
          : tourism === "attraction" ? "Must See"
          : "Explore";

        const description = t.description
          || t["description:en"]
          || (historic ? `A historic ${historic} in ${cityName}.` : "")
          || (tourism === "museum" ? `A museum in ${cityName}.` : "")
          || (amenity === "restaurant" ? `A restaurant in ${cityName}.` : "")
          || `A ${cat.toLowerCase()} spot in ${cityName}.`;

        // Skip blocked content (haram: bars, pubs, alcohol, gambling)
        const fullCheck = `${name} ${description} ${amenity}`.toLowerCase();
        const blocked = ["bar", "pub", "nightclub", "brewery", "winery", "wine", "beer", "cocktail", "alcohol", "liquor", "tavern", "saloon", "lounge", "hookah", "casino", "gambling", "strip"];
        if (blocked.some(kw => fullCheck.includes(kw))) continue;

        results.push({
          id: `osm_${el.id}`,
          name,
          location: cityName,
          description,
          price: amenity === "restaurant" ? "$$" : t.fee === "yes" ? "$" : "",
          duration: tourism === "museum" ? "1-2h" : historic ? "30min-1h" : "",
          rating: 0,
          tags: [cat, (() => {
            // Human-readable second tag from raw OSM data
            const raw = tourism || historic || amenity || leisure || shop || "";
            const labelMap: Record<string, string> = {
              attraction: "Popular", museum: "Museum", viewpoint: "Viewpoint", artwork: "Art",
              gallery: "Gallery", theme_park: "Theme Park", zoo: "Zoo", aquarium: "Aquarium",
              temple: "Temple", shrine: "Shrine", castle: "Castle", monument: "Monument",
              memorial: "Memorial", ruins: "Ruins", fort: "Fort", archaeological_site: "Historic",
              restaurant: "Restaurant", cafe: "Café", marketplace: "Market", theatre: "Theatre",
              cinema: "Cinema", ice_cream: "Dessert", community_centre: "Community",
              park: "Park", garden: "Garden", nature_reserve: "Nature", stadium: "Stadium",
              water_park: "Water Park", sports_centre: "Sports", beach_resort: "Beach",
              mall: "Shopping Mall", department_store: "Shopping",
            };
            return labelMap[raw] || "Activity";
          })()],
          image: t.image || t.wikimedia_commons || "",
          city: cityName,
        });
      }
    }
  } catch { /* silent */ }
  return results;
}

async function fetchWikipediaPlaces(lat: number, lon: number, cityName: string): Promise<Place[]> {
  const results: Place[] = [];
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=10000&gslimit=15&format=json&origin=*`
    );
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const pages = wikiData.query?.geosearch || [];

      // Filter to likely tourist spots (skip battles, administrative stuff)
      const skipWords = ["battle", "siege", "rebellion", "district", "ward", "prefecture", "station", "line"];
      const validPages = pages.filter((p: any) =>
        !skipWords.some(w => p.title.toLowerCase().includes(w))
      );

      // Fetch extracts for valid pages
      if (validPages.length > 0) {
        const pageIds = validPages.slice(0, 8).map((p: any) => p.pageid).join("|");
        const extractRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds}&prop=extracts|pageimages&exintro=1&explaintext=1&exsentences=2&piprop=thumbnail&pithumbsize=400&format=json&origin=*`
        );
        if (extractRes.ok) {
          const extractData = await extractRes.json();
          const pagesMap = extractData.query?.pages || {};
          const existing = new Set(results.map(r => r.name.toLowerCase()));

          for (const page of Object.values(pagesMap) as any[]) {
            if (!page.title || existing.has(page.title.toLowerCase())) continue;
            if (!page.extract || page.extract.length < 20) continue;
            existing.add(page.title.toLowerCase());

            results.push({
              id: `wiki_${page.pageid}`,
              name: page.title,
              location: cityName,
              description: page.extract.slice(0, 200),
              price: "",
              duration: "",
              rating: 0,
              tags: ["Culture", "Landmark"],
              image: page.thumbnail?.source || "",
              city: cityName,
            });
          }
        }
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
  city?: string;
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
    : [activity.experience_tag || "Explore", "Activity"].slice(0, 2);

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
    rating: activity.sidequest_score ?? 0,
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

/** Truncate description to max 80 chars for card front */
function truncateDescription(desc: string, max = 80): string {
  if (!desc || desc.length <= max) return desc;
  return desc.slice(0, max).replace(/\s+\S*$/, "") + "...";
}


export function Discover() {
  const { activeTrip, setActiveTrip, trips, proposeActivity } = useTrip();
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
  const [showDetail, setShowDetail] = useState(false);
  const [showTripPicker, setShowTripPicker] = useState(false);

  // Fetch activities — from Supabase first, fall back to live API for trip cities
  useEffect(() => {
    let cancelled = false;

    async function fetchActivities() {
      setLoading(true);
      setFetchError(false);

      // Get cities to fetch for (from active trip or all)
      // Extract just city name (before comma) for DB matching — "Tokyo, Japan" → "Tokyo"
      const tripCities = activeTrip?.cities.map(c => c.name.split(",")[0].trim()) || [];

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

      // Filter haram content from Supabase results
      const BLOCKED = ["bar", "pub", "nightclub", "brewery", "winery", "wine", "beer", "cocktail", "alcohol", "liquor", "tavern", "saloon", "lounge", "hookah", "casino", "gambling", "strip", "pork"];
      const cleanData = (data || []).filter(a => {
        const text = `${a.name || ""} ${a.description || ""} ${a.experience_tag || ""} ${(a.tags || []).join(" ")}`.toLowerCase();
        return !BLOCKED.some(kw => text.includes(kw));
      });
      let activities = cleanData.map(mapActivityToPlace);

      // Always fetch live activities for trip cities (Supabase may be stale/empty)
      // Free swiping = bucket-list destinations, epic adventures, world wonders
      const BUCKET_LIST_CITIES = [
        "Interlaken", "Zermatt", "Queenstown", "Reykjavik", "Cusco",
        "Marrakech", "Cappadocia", "Santorini", "Dubrovnik", "Kyoto",
        "Banff", "Patagonia", "Zanzibar", "Kathmandu", "Siem Reap",
        "Petra", "Luang Prabang", "Amalfi", "Tromsø", "Hallstatt",
        "Machu Picchu", "Lauterbrunnen", "Bagan", "Chefchaouen", "Kotor",
      ];
      const citiesToFetch = tripCities.length > 0
        ? tripCities
        : BUCKET_LIST_CITIES.sort(() => Math.random() - 0.5).slice(0, 4);

      // Always try live APIs — even if Supabase had some results, fill gaps
      if (citiesToFetch.length > 0) {
        const existingNames = new Set(activities.map(a => a.name.toLowerCase()));
        for (const city of citiesToFetch) {
          if (cancelled) break;
          const liveResults = await fetchLiveActivities(city);
          // Deduplicate against what Supabase already returned
          const fresh = liveResults.filter(r => !existingNames.has(r.name.toLowerCase()));
          fresh.forEach(r => existingNames.add(r.name.toLowerCase()));
          activities = [...activities, ...fresh];
          if (activities.length >= 30) break;
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
  // Extract just the city name (before comma) for matching — "Tokyo, Japan" → "Tokyo"
  const cityMatchName = activeCityName?.split(",")[0]?.trim();
  const filteredPlaces = cityMatchName
    ? places.filter((p) => p.location.toLowerCase().includes(cityMatchName.toLowerCase()) || p.city?.toLowerCase().includes(cityMatchName.toLowerCase()))
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
            id: Date.now() + Math.floor(Math.random() * 10000),
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
    <div className="px-5 pt-4 pb-0 flex flex-col max-w-md mx-auto" style={{ height: 'calc(100dvh - 5rem)' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pt-1">
        <h1 className="text-[28px] tracking-tight text-zinc-900 dark:text-white">Discover</h1>
        <button className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-zinc-200/50 dark:border-zinc-700/50 hover:scale-105">
          <Filter className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </button>
      </div>

      {/* Trip Mode Banner / Trip Picker */}
      {trips.length > 0 && (
        <div className="relative mb-4">
          <button
            onClick={() => setShowTripPicker(!showTripPicker)}
            className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between text-left transition-colors ${
              activeTrip
                ? "bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/15"
                : "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Plane className={`w-4 h-4 shrink-0 ${activeTrip ? "text-orange-500" : "text-zinc-500"}`} />
              <span className={`text-[14px] font-medium ${activeTrip ? "text-orange-600 dark:text-orange-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                {activeTrip ? `Swiping for ${activeTrip.name}` : "Free swiping — tap to pick a trip"}
              </span>
            </div>
            <span className="text-zinc-400 text-xs">▾</span>
          </button>

          {showTripPicker && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Free swipe option */}
              <button
                onClick={() => { setActiveTrip(null); setShowTripPicker(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-b border-zinc-100 dark:border-zinc-800 ${!activeTrip ? "bg-zinc-50 dark:bg-zinc-900" : ""}`}
              >
                <span className="text-lg">🌍</span>
                <div>
                  <div className="text-[14px] font-medium text-zinc-900 dark:text-white">Free swiping</div>
                  <div className="text-xs text-zinc-500">Save to personal wishlist</div>
                </div>
              </button>
              {/* Trip options */}
              {trips.filter(t => t.status === "Active").map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTrip(t); setShowTripPicker(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 ${activeTrip?.id === t.id ? "bg-orange-50 dark:bg-orange-900/20" : ""}`}
                >
                  <span className="text-lg">{t.cities[0]?.flag || "🌍"}</span>
                  <div>
                    <div className="text-[14px] font-medium text-zinc-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-zinc-500">{t.cities.map(c => c.name).join(" → ")}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
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
      <div className="flex-1 relative mb-3 min-h-0">
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
                onTap={() => setShowDetail(true)}
                key={currentPlace.id + "-" + currentIndex}
              />
            </AnimatePresence>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 flex items-center justify-center mx-auto mb-4 border border-orange-200/50 dark:border-orange-800/30">
                <span className="text-4xl">{activeTrip && activeCityName ? "🗺️" : "✨"}</span>
              </div>
              <h3 className="text-xl text-zinc-900 dark:text-white mb-2 font-semibold">
                {activeTrip && activeCityName
                  ? `You've seen everything in ${activeCityName}`
                  : "All Caught Up!"}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-300 text-[15px]">
                {activeTrip && activeCityName
                  ? "Try another city or check back later"
                  : "Check back later for more recommendations"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Intensity Slider */}
      <div className="pb-2 shrink-0">
        <div className="flex justify-between items-center text-[13px] text-zinc-600 dark:text-zinc-400 mb-3 px-1 font-medium">
          <div className="flex items-center gap-1.5">
            <X className="w-4 h-4 text-red-500 dark:text-red-400" />
            <span className="font-semibold text-red-500/80 dark:text-red-400/80">Pass</span>
          </div>
          <span className="text-zinc-400 dark:text-zinc-500 tracking-wider text-[11px] uppercase font-semibold">Intensity</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-teal-500/80 dark:text-teal-400/80">Save</span>
            <Heart className="w-4 h-4 text-teal-500 dark:text-teal-400" />
          </div>
        </div>

        {/* Gradient Slider */}
        <div className="relative h-[60px] rounded-full bg-gradient-to-r from-red-100/80 dark:from-red-950/50 via-zinc-100 dark:via-zinc-800/60 to-teal-100/80 dark:to-teal-950/50 border-2 border-zinc-200/80 dark:border-zinc-700/60 overflow-hidden shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
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

      {/* Activity Detail Modal */}
      {showDetail && currentPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowDetail(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-[28px] max-h-[85dvh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowDetail(false)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Image */}
            {currentPlace.image && (currentPlace.image.startsWith("http")) && (
              <div className="h-52 w-full overflow-hidden rounded-t-[28px]">
                <img src={currentPlace.image} alt={currentPlace.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6">
              {/* Tags */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {currentPlace.tags.map((tag) => (
                  <span key={tag} className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-xs font-semibold">{tag}</span>
                ))}
              </div>

              <h2 className="text-[24px] font-semibold text-zinc-900 dark:text-white mb-2">{currentPlace.name}</h2>

              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-4">
                <MapPin className="w-4 h-4" />
                <span className="text-[15px]">{currentPlace.location}</span>
              </div>

              <p className="text-zinc-600 dark:text-zinc-400 text-[15px] leading-relaxed mb-5">
                {currentPlace.description}
              </p>

              {/* Quick Info Chips */}
              <div className="flex gap-2 flex-wrap mb-5">
                {currentPlace.price && (
                  <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-full text-xs font-medium">{currentPlace.price}</span>
                )}
                {currentPlace.duration && (
                  <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-full text-xs font-medium">{currentPlace.duration}</span>
                )}
                {currentPlace.rating > 0 && (
                  <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> {currentPlace.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetail(false)}
                  className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                >
                  Back to Swiping
                </button>
                <button
                  onClick={() => {
                    removeCard("right", 0.8);
                    setShowDetail(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-600/30 transition-all"
                >
                  Save Activity
                </button>
              </div>

              {/* Add to Trip button — only when there's an active trip */}
              {activeTrip && (
                <button
                  onClick={() => {
                    removeCard("right", 0.8);
                    setShowDetail(false);
                  }}
                  className="w-full mt-3 py-3.5 rounded-2xl text-[15px] font-semibold bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-600/20 transition-all hover:shadow-xl"
                >
                  Save to {activeTrip.name}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SwipeCardProps {
  place: Place;
  onSwipe?: (direction: "left" | "right") => void;
  intensity: number;
  onTap?: () => void;
}

function getNoImageStyle(tags: string[]): { gradient: string; emoji: string } {
  const primary = tags[0] || "";
  if (primary === "Culture") return { gradient: "from-indigo-600 to-purple-700", emoji: "🏛️" };
  if (primary === "Food") return { gradient: "from-orange-600 to-red-600", emoji: "🍜" };
  if (primary === "Nature") return { gradient: "from-emerald-600 to-teal-700", emoji: "🌿" };
  if (primary === "Views") return { gradient: "from-sky-500 to-blue-700", emoji: "🌅" };
  if (primary === "Entertainment") return { gradient: "from-pink-600 to-rose-700", emoji: "🎭" };
  if (primary === "Shopping") return { gradient: "from-fuchsia-600 to-purple-700", emoji: "🛍️" };
  if (primary === "Must See") return { gradient: "from-amber-500 to-orange-600", emoji: "⭐" };
  return { gradient: "from-zinc-700 to-zinc-900", emoji: "📍" };
}

function SwipeCard({ place, onSwipe, intensity, onTap }: SwipeCardProps) {
  // Determine image src
  const imageSrc = place.image && (place.image.startsWith("http://") || place.image.startsWith("https://"))
    ? place.image
    : place.image
    ? `https://source.unsplash.com/featured/?${place.image}`
    : "";

  const noImageStyle = getNoImageStyle(place.tags);

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
      <div className="h-full rounded-[28px] overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl dark:shadow-[0_8px_50px_rgba(0,0,0,0.6)] border border-zinc-200/50 dark:border-zinc-700/40 flex flex-col">
        {/* Image */}
        <div className={`relative flex-1 min-h-0 bg-gradient-to-br ${!imageSrc ? noImageStyle.gradient : "from-orange-600 via-rose-500 to-amber-500"}`}>
          {!imageSrc && (
            <div className={`absolute inset-0 bg-gradient-to-br ${noImageStyle.gradient} flex items-center justify-center`}>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-[120px] opacity-20">{noImageStyle.emoji}</span>
              </div>
              <div className="relative z-10 text-center px-8">
                <h2 className="text-white text-[28px] font-bold leading-tight drop-shadow-lg">{place.name}</h2>
              </div>
            </div>
          )}
          {imageSrc && (
            <ImageWithFallback
              src={imageSrc}
              alt={place.name}
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay gradient — premium depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/20" />
          <div className="absolute inset-0 shadow-[inset_0_-60px_60px_-30px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)]" />

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

        {/* Content — tappable for details */}
        <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-6 cursor-pointer active:bg-zinc-50 dark:active:bg-zinc-800 transition-all duration-200" onClick={onTap}>
          <div className="mb-4">
            <h3 className="text-[22px] leading-tight mb-2 font-semibold text-zinc-900 dark:text-white">{place.name}</h3>

            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-3">
              <MapPin className="w-4 h-4" strokeWidth={2} />
              <span className="text-[15px]">{place.location}</span>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400 text-[15px] leading-relaxed line-clamp-2">
              {truncateDescription(place.description)}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-700/50">
            <div className="flex items-center gap-4">
              <span className="text-zinc-700 dark:text-zinc-300 text-[15px] font-medium">{place.price}</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-[14px]">{place.duration}</span>
            </div>
            {place.rating > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-100 dark:border-transparent">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-[15px] font-semibold text-zinc-900 dark:text-amber-400">{place.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Tap for more indicator */}
          <div className="flex flex-col items-center pt-2 gap-0.5">
            <ChevronUp className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <span className="text-xs text-zinc-500 dark:text-zinc-500">Tap for more →</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
