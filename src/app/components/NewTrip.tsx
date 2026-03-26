import { ArrowLeft, Plus, MapPin, Users, Minus, X, Loader2, Search } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTrip } from "../context/TripContext";

interface CityResult {
  display: string; // "Tokyo, Japan"
  city: string;    // "Tokyo"
  country: string; // "Japan"
  flag: string;    // "🇯🇵"
}

const COUNTRY_FLAGS: Record<string, string> = {
  "Japan": "🇯🇵", "Spain": "🇪🇸", "France": "🇫🇷", "Italy": "🇮🇹", "Germany": "🇩🇪",
  "United Kingdom": "🇬🇧", "Portugal": "🇵🇹", "United States": "🇺🇸", "Netherlands": "🇳🇱",
  "Thailand": "🇹🇭", "Australia": "🇦🇺", "Mexico": "🇲🇽", "Brazil": "🇧🇷", "Canada": "🇨🇦",
  "Greece": "🇬🇷", "Turkey": "🇹🇷", "South Korea": "🇰🇷", "India": "🇮🇳", "Morocco": "🇲🇦",
  "Croatia": "🇭🇷", "Indonesia": "🇮🇩", "Vietnam": "🇻🇳", "Colombia": "🇨🇴", "Argentina": "🇦🇷",
  "Egypt": "🇪🇬", "Czech Republic": "🇨🇿", "Czechia": "🇨🇿", "Austria": "🇦🇹", "Switzerland": "🇨🇭",
  "Ireland": "🇮🇪", "Belgium": "🇧🇪", "Norway": "🇳🇴", "Sweden": "🇸🇪", "Denmark": "🇩🇰",
  "Finland": "🇫🇮", "Poland": "🇵🇱", "Hungary": "🇭🇺", "Iceland": "🇮🇸", "New Zealand": "🇳🇿",
  "Singapore": "🇸🇬", "Malaysia": "🇲🇾", "Philippines": "🇵🇭", "China": "🇨🇳", "Taiwan": "🇹🇼",
  "Israel": "🇮🇱", "Jordan": "🇯🇴", "Peru": "🇵🇪", "Chile": "🇨🇱", "Cuba": "🇨🇺",
  "Jamaica": "🇯🇲", "Dominican Republic": "🇩🇴", "Costa Rica": "🇨🇷", "Romania": "🇷🇴",
};

function useCitySearch() {
  const [results, setResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&featuretype=city`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        const cities: CityResult[] = data
          .filter((r: any) => r.address?.country)
          .map((r: any) => {
            const city = r.address?.city || r.address?.town || r.address?.village || r.name || query;
            const country = r.address?.country || "";
            return {
              display: `${city}, ${country}`,
              city,
              country,
              flag: COUNTRY_FLAGS[country] || "🌍",
            };
          })
          // Deduplicate by display name
          .filter((c: CityResult, i: number, arr: CityResult[]) => arr.findIndex(a => a.display === c.display) === i);
        setResults(cities);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 300);
  }, []);

  return { results, searching, search, clearResults: () => setResults([]) };
}

export function NewTrip() {
  const [tripName, setTripName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [destinations, setDestinations] = useState<string[]>([""]);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const { results, searching, search, clearResults } = useCitySearch();
  const [daysPerCity, setDaysPerCity] = useState<number[]>([2]);
  const [budget, setBudget] = useState("");
  const [groupSize, setGroupSize] = useState(1);
  const [budgetMode, setBudgetMode] = useState<"per-person" | "total">("per-person");
  const [tripVibe, setTripVibe] = useState<"luxury" | "modest" | "budget">("modest");
  const [submitting, setSubmitting] = useState(false);
  const { createTrip } = useTrip();
  const navigate = useNavigate();

  // Calculate total trip days from date range
  const tripDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  // Auto-distribute days when dates change or cities change
  useEffect(() => {
    if (tripDays <= 0) return;
    const cityCount = destinations.filter(d => d.trim()).length || destinations.length;
    if (cityCount === 1) {
      // Single city gets all the days
      setDaysPerCity([tripDays]);
    } else if (cityCount > 1) {
      // Only auto-distribute if current total doesn't match trip days
      const currentTotal = daysPerCity.reduce((s, d) => s + d, 0);
      if (currentTotal !== tripDays) {
        const base = Math.floor(tripDays / cityCount);
        const remainder = tripDays % cityCount;
        setDaysPerCity(destinations.map((_, i) => base + (i < remainder ? 1 : 0)));
      }
    }
  }, [tripDays, destinations.length]);

  const handleAddCity = () => {
    setDestinations([...destinations, ""]);
    // Split remaining days for the new city
    const usedDays = daysPerCity.reduce((s, d) => s + d, 0);
    const remaining = Math.max(1, tripDays - usedDays);
    setDaysPerCity([...daysPerCity, tripDays > 0 ? remaining : 2]);
  };

  const handleDestinationChange = (index: number, value: string) => {
    const updated = [...destinations];
    updated[index] = value;
    setDestinations(updated);
    setActiveSearchIndex(index);
    search(value);
  };

  const selectCity = (index: number, city: CityResult) => {
    const updated = [...destinations];
    updated[index] = city.display;
    setDestinations(updated);
    setActiveSearchIndex(null);
    clearResults();
  };

  const handleDaysChange = (index: number, delta: number) => {
    const updated = [...daysPerCity];
    updated[index] = Math.min(30, Math.max(1, (updated[index] || 2) + delta));
    setDaysPerCity(updated);
  };

  const handleCreateTrip = async () => {
    const filteredDests = destinations.filter((d) => d.trim() !== "");
    if (!tripName.trim() || filteredDests.length === 0) return;
    setSubmitting(true);
    const filteredDays = destinations.reduce<number[]>((acc, d, i) => {
      if (d.trim() !== "") acc.push(daysPerCity[i] || 2);
      return acc;
    }, []);
    // If no dates set, compute default duration from days-per-city
    let effectiveStart = startDate;
    let effectiveEnd = endDate;
    if (!effectiveStart || !effectiveEnd) {
      const totalDays = filteredDays.reduce((s, d) => s + d, 0);
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + totalDays - 1);
      effectiveStart = effectiveStart || start.toISOString().split("T")[0];
      effectiveEnd = effectiveEnd || end.toISOString().split("T")[0];
    }
    const { error, tripId } = await createTrip({
      title: tripName.trim(),
      destinations: filteredDests,
      daysPerCity: filteredDays,
      start_date: effectiveStart,
      end_date: effectiveEnd,
      budget: budget ? parseFloat(budget) : undefined,
      currency: "USD",
      trip_vibe: tripVibe,
      budget_mode: budgetMode,
      group_size: groupSize,
    });
    setSubmitting(false);
    if (!error && tripId) {
      navigate(`/trips/${tripId}/invite`);
    } else if (!error) {
      navigate("/trips");
    }
  };

  return (
    <div className="px-5 py-4 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pt-1">
        <Link to="/trips" className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent">
          <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </Link>
        <h1 className="text-[24px] tracking-tight font-semibold text-zinc-900 dark:text-white">Plan New Trip</h1>
      </div>

      {/* Trip Name */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Trip Name</label>
        <input
          type="text"
          placeholder="e.g., Europe Summer Adventure"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 mb-1">
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Start Date (optional)</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-[15px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">End Date (optional)</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`w-full bg-white dark:bg-zinc-950 border rounded-2xl px-4 py-4 text-[15px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none ${
              startDate && endDate && endDate <= startDate
                ? "border-red-400 dark:border-red-600"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          />
        </div>
      </div>
      {startDate && endDate && endDate <= startDate && (
        <p className="text-red-500 text-sm font-medium mb-4 px-1">End date must be after start date</p>
      )}
      {!(startDate && endDate && endDate <= startDate) && <div className="mb-5" />}

      {/* Destinations */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Destinations</label>
        <div className="space-y-2 mb-3">
          {destinations.map((dest, index) => (
            <div key={index} className="relative">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm dark:shadow-none">
                <MapPin className="w-5 h-5 text-orange-500" />
                <input
                  type="text"
                  placeholder="Search for a city..."
                  value={dest}
                  onChange={(e) => handleDestinationChange(index, e.target.value)}
                  onFocus={() => { setActiveSearchIndex(index); if (dest.length >= 2) search(dest); }}
                  onBlur={() => setTimeout(() => { setActiveSearchIndex(null); clearResults(); }, 200)}
                  className="flex-1 bg-transparent text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
                />
                {searching && activeSearchIndex === index && (
                  <Loader2 className="w-4 h-4 text-zinc-400 animate-spin flex-shrink-0" />
                )}
                {destinations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDestinations(destinations.filter((_, i) => i !== index));
                      setDaysPerCity(daysPerCity.filter((_, i) => i !== index));
                    }}
                    className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <X className="w-4 h-4 text-red-500 dark:text-red-400" />
                  </button>
                )}
              </div>
              {/* Autocomplete Dropdown */}
              {activeSearchIndex === index && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                  {results.map((city, ci) => (
                    <button
                      key={ci}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectCity(index, city)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                    >
                      <span className="text-xl">{city.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-medium text-zinc-900 dark:text-white truncate">{city.city}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{city.country}</div>
                      </div>
                      <MapPin className="w-4 h-4 text-zinc-400 dark:text-zinc-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={handleAddCity} type="button" className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[14px] font-semibold transition-all border border-zinc-200 dark:border-zinc-800">
          + Add Another City
        </button>
      </div>

      {/* Days per City */}
      {destinations.some((d) => d.trim() !== "") && (
        <div className="mb-5">
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Days per City</label>
          <div className="space-y-2 mb-3">
            {destinations.map((dest, index) =>
              dest.trim() ? (
                <div
                  key={index}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm dark:shadow-none"
                >
                  <span className="text-[15px] font-medium text-zinc-900 dark:text-white truncate mr-3">{dest.trim()}</span>
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDaysChange(index, -1)}
                      disabled={(daysPerCity[index] || 2) <= 1}
                      className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-semibold text-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      &minus;
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={daysPerCity[index] || 2}
                      onChange={(e) => {
                        const val = Math.min(30, Math.max(1, parseInt(e.target.value) || 1));
                        const updated = [...daysPerCity];
                        updated[index] = val;
                        setDaysPerCity(updated);
                      }}
                      className="w-12 text-center text-[15px] font-semibold text-zinc-900 dark:text-white tabular-nums bg-transparent border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleDaysChange(index, 1)}
                      disabled={(daysPerCity[index] || 2) >= 30}
                      className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-semibold text-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : null
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-1 font-medium">
            Total: {destinations.reduce((sum, d, i) => sum + (d.trim() ? (daysPerCity[i] || 2) : 0), 0)} days
          </p>
        </div>
      )}

      {/* Budget */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Budget (Optional)</label>
        {/* Per Person / Total toggle */}
        <div className="flex gap-2 mb-3">
          {([
            { key: "per-person" as const, label: "Per Person" },
            { key: "total" as const, label: "Total" },
          ]).map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setBudgetMode(mode.key)}
              className={`flex-1 py-2.5 rounded-2xl text-[14px] font-semibold transition-all ${
                budgetMode === mode.key
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-[15px]">$</span>
          <input
            type="number"
            placeholder="0"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
          />
        </div>
        {budgetMode === "total" && groupSize > 1 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 ml-1">
            Will be split equally among {groupSize} people
          </p>
        )}
      </div>

      {/* Group Size */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Group Size</label>
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center border border-orange-100/80 dark:border-orange-800/50">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <span className="text-[15px] font-medium text-zinc-900 dark:text-white">{groupSize} {groupSize === 1 ? "person" : "people"}</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Including you</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setGroupSize(Math.max(1, groupSize - 1))}
              disabled={groupSize <= 1}
              className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center text-[17px] font-bold text-zinc-900 dark:text-white tabular-nums">{groupSize}</span>
            <button
              type="button"
              onClick={() => setGroupSize(Math.min(20, groupSize + 1))}
              disabled={groupSize >= 20}
              className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 ml-1">You can add members by name later from the trip page</p>
      </div>

      {/* Trip Vibe */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Trip Vibe</label>
        <div className="flex gap-2 mb-3">
          {([
            { key: "luxury" as const, label: "Luxury", emoji: "\uD83D\uDC8E" },
            { key: "modest" as const, label: "Modest", emoji: "\u2728" },
            { key: "budget" as const, label: "Budget", emoji: "\uD83D\uDCB0" },
          ]).map((vibe) => (
            <button
              key={vibe.key}
              type="button"
              onClick={() => setTripVibe(vibe.key)}
              className={`flex-1 py-3 rounded-2xl text-[14px] font-semibold transition-all ${
                tripVibe === vibe.key
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {vibe.emoji} {vibe.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
          {tripVibe === "luxury" && "Fine dining, premium stays, VIP experiences"}
          {tripVibe === "modest" && "Great food, comfortable stays, popular spots"}
          {tripVibe === "budget" && "Street food, hostels, free activities"}
        </p>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreateTrip}
        disabled={submitting || !tripName.trim() || !destinations.some(d => d.trim() !== "") || (!!startDate && !!endDate && endDate <= startDate)}
        className="w-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-2xl text-[15px] font-semibold transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Creating..." : "Create Trip"}
      </button>
    </div>
  );
}
