import { ArrowLeft, Plus, MapPin, Users, Minus, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { useTrip } from "../context/TripContext";

export function NewTrip() {
  const [tripName, setTripName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [destinations, setDestinations] = useState<string[]>([""]);
  const [daysPerCity, setDaysPerCity] = useState<number[]>([2]);
  const [budget, setBudget] = useState("");
  const [groupSize, setGroupSize] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { createTrip } = useTrip();
  const navigate = useNavigate();

  const handleAddCity = () => {
    setDestinations([...destinations, ""]);
    setDaysPerCity([...daysPerCity, 2]);
  };

  const handleDestinationChange = (index: number, value: string) => {
    const updated = [...destinations];
    updated[index] = value;
    setDestinations(updated);
  };

  const handleDaysChange = (index: number, delta: number) => {
    const updated = [...daysPerCity];
    updated[index] = Math.min(14, Math.max(1, (updated[index] || 2) + delta));
    setDaysPerCity(updated);
  };

  const handleCreateTrip = async () => {
    if (!tripName.trim() || !startDate || !endDate) return;
    setSubmitting(true);
    const { error } = await createTrip({
      title: tripName.trim(),
      destinations: destinations.filter((d) => d.trim() !== ""),
      start_date: startDate,
      end_date: endDate,
      budget: budget ? parseFloat(budget) : undefined,
      currency: "USD",
    });
    setSubmitting(false);
    if (!error) {
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
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-[15px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-[15px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
          />
        </div>
      </div>

      {/* Destinations */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Destinations</label>
        <div className="space-y-2 mb-3">
          {destinations.map((dest, index) => (
            <div key={index} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm dark:shadow-none">
              <MapPin className="w-5 h-5 text-orange-500" />
              <input
                type="text"
                placeholder="Add a city"
                value={dest}
                onChange={(e) => handleDestinationChange(index, e.target.value)}
                className="flex-1 bg-transparent text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
              />
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
                    <span className="w-10 text-center text-[15px] font-semibold text-zinc-900 dark:text-white tabular-nums">
                      {daysPerCity[index] || 2}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDaysChange(index, 1)}
                      disabled={(daysPerCity[index] || 2) >= 14}
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

      {/* Create Button */}
      <button
        onClick={handleCreateTrip}
        disabled={submitting || !tripName.trim() || !startDate || !endDate}
        className="w-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-2xl text-[15px] font-semibold transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Creating..." : "Create Trip"}
      </button>
    </div>
  );
}
