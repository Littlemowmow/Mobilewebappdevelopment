import { ArrowLeft, Plus, MapPin } from "lucide-react";
import { Link } from "react-router";

export function NewTrip() {
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
          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Start Date</label>
          <input
            type="date"
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-[15px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">End Date</label>
          <input
            type="date"
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-[15px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
          />
        </div>
      </div>

      {/* Destinations */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Destinations</label>
        <div className="space-y-2 mb-3">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm dark:shadow-none">
            <MapPin className="w-5 h-5 text-orange-500" />
            <input
              type="text"
              placeholder="Add a city"
              className="flex-1 bg-transparent text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
        </div>
        <button className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[14px] font-semibold transition-all border border-zinc-200 dark:border-zinc-800">
          + Add Another City
        </button>
      </div>

      {/* Budget */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Budget (Optional)</label>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-[15px]">$</span>
          <input
            type="number"
            placeholder="0"
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
          />
        </div>
      </div>

      {/* Invite Members */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Invite Members</label>
        <input
          type="email"
          placeholder="Enter email addresses"
          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm dark:shadow-none"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 ml-1">Separate multiple emails with commas</p>
      </div>

      {/* Create Button */}
      <button className="w-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-2xl text-[15px] font-semibold transition-all shadow-lg shadow-orange-600/30">
        Create Trip
      </button>
    </div>
  );
}
