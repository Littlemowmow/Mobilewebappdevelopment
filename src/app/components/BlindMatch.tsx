import { ArrowLeft, Lightbulb, Check, Clock } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";

const members = [
  { name: "Hadi", initial: "H", status: "Voted", color: "bg-gradient-to-br from-orange-500 to-orange-600", isYou: true },
  { name: "Sara", initial: "S", status: "Voted", color: "bg-gradient-to-br from-teal-500 to-teal-600", isYou: false },
  { name: "Zayd", initial: "Z", status: "Waiting", color: "bg-gradient-to-br from-pink-500 to-pink-600", isYou: false },
  { name: "Alex", initial: "A", status: "Waiting", color: "bg-gradient-to-br from-blue-500 to-blue-600", isYou: false },
];

const votingItems = [
  {
    id: 1,
    title: "Bunkers del Carmel Sunset",
    location: "Barcelona",
    city: "🇪🇸",
    description: "360° city views + wine at golden hour",
    status: "voting",
    votedCount: 2,
    totalCount: 4,
  },
  {
    id: 2,
    title: "Skip Sagrada Familia?",
    location: "Barcelona", 
    city: "🇪🇸",
    description: "It's crowded and expensive. Maybe just photos outside?",
    status: "voting",
    votedCount: 3,
    totalCount: 4,
  },
  {
    id: 3,
    title: "Add Toledo Day Trip",
    location: "Madrid",
    city: "🇪🇸",
    description: "Medieval city 30min from Madrid. Game of Thrones vibes.",
    status: "voting",
    votedCount: 1,
    totalCount: 4,
  },
  {
    id: 4,
    title: "Change Lisbon to 3 Days",
    location: "Lisbon",
    city: "🇵🇹",
    description: "2 days feels rushed. Add Sintra day trip?",
    status: "voting",
    votedCount: 2,
    totalCount: 4,
  },
];

export function BlindMatch() {
  const [selectedTab, setSelectedTab] = useState<"voting" | "decided">("voting");
  const votedCount = members.filter(m => m.status === "Voted").length;
  const waitingCount = members.filter(m => m.status === "Waiting").length;

  return (
    <div className="min-h-screen px-5 py-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pt-1">
        <Link to="/trips" className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent">
          <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </Link>
        <h1 className="text-[24px] tracking-tight font-semibold text-zinc-900 dark:text-white">Blind Match</h1>
      </div>

      {/* Icon */}
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900 rounded-[28px] flex items-center justify-center border-2 border-purple-200 dark:border-purple-800/50 shadow-xl shadow-purple-200/50 dark:shadow-purple-900/50">
          <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-[26px] mb-3 font-semibold tracking-tight leading-tight text-zinc-900 dark:text-white">
          Votes hidden until<br />everyone's in.
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-[15px] font-medium">
          No awkward "who's actually coming?" energy.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">{votedCount} of {members.length} voted</span>
          <span className="text-teal-600 dark:text-teal-400 font-semibold">{Math.round((votedCount / members.length) * 100)}%</span>
        </div>
        <div className="h-2.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-300/50 dark:border-zinc-800">
          <div 
            className="h-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all duration-500 shadow-lg shadow-teal-500/50"
            style={{ width: `${(votedCount / members.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Members Card */}
      <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[28px] p-6 mb-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-500 tracking-widest font-bold">
            BARCELONA · 4 INVITED
          </div>
          <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg border border-teal-100/80 dark:border-transparent">
            <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" strokeWidth={3} />
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{votedCount} VOTED</span>
          </div>
        </div>

        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl ${member.color} flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-zinc-950`}>
                  <span className="text-lg font-bold">{member.initial}</span>
                </div>
                <div>
                  <div className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100">
                    {member.name} {member.isYou && <span className="text-zinc-500 dark:text-zinc-500 font-normal">(You)</span>}
                  </div>
                </div>
              </div>
              {member.status === "Voted" ? (
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
          ))}
        </div>
      </div>

      {/* Nudge Card */}
      {waitingCount > 0 && (
        <button className="w-full bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-950/30 border-2 border-yellow-200 dark:border-yellow-700/50 rounded-[20px] p-5 flex items-center gap-3 hover:from-yellow-100 hover:to-yellow-50 dark:hover:from-yellow-900/40 dark:hover:to-yellow-950/40 transition-all shadow-sm dark:shadow-none">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-yellow-200 dark:border-yellow-700/50">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-500" fill="currentColor" />
          </div>
          <div className="text-left flex-1">
            <div className="text-yellow-700 dark:text-yellow-500 text-sm font-semibold">
              {waitingCount} more vote{waitingCount !== 1 ? 's' : ''} needed
            </div>
            <div className="text-yellow-600 dark:text-yellow-600/80 text-xs font-medium">
              Send a friendly reminder
            </div>
          </div>
          <div className="text-yellow-600 dark:text-yellow-500 font-bold">→</div>
        </button>
      )}

      {/* Info */}
      <div className="mt-8 p-5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm dark:shadow-none">
        <h4 className="text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">How it works</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
          Everyone votes on dates privately. Results reveal only when all members submit their availability—ensuring genuine input without peer pressure.
        </p>
      </div>
    </div>
  );
}