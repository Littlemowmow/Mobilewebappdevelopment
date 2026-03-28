import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Globe, ArrowRight, Check, MapPin, Compass, Plane, ThumbsUp, DollarSign, GripVertical } from "lucide-react";
import { trackEvent } from "../../lib/analytics";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";

const INTEREST_TAGS = [
  { value: "food", label: "Foodie", emoji: "🍜" },
  { value: "culture", label: "Culture", emoji: "🏛️" },
  { value: "nightlife", label: "Nightlife", emoji: "🌙" },
  { value: "nature", label: "Nature", emoji: "🌿" },
  { value: "adventure", label: "Adventure", emoji: "🧗" },
  { value: "shopping", label: "Shopping", emoji: "🛍️" },
  { value: "history", label: "History", emoji: "📜" },
  { value: "art", label: "Art", emoji: "🎨" },
  { value: "photo", label: "Photo Spots", emoji: "📸" },
  { value: "local", label: "Local Gems", emoji: "💎" },
];

const TOTAL_STEPS = 6;

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.name || profile?.display_name || "");
  const [interests, setInterests] = useState<string[]>([]);
  const [dreamCity, setDreamCity] = useState("");
  const touchStartXRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    trackEvent("onboarding_step_viewed", { step });
  }, [step]);

  useEffect(() => {
    if (step === 1 || step === 3) inputRef.current?.focus();
  }, [step]);

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      // Save preferences to Supabase profile
      if (user) {
        supabase.from("profiles").update({
          display_name: name.trim() || profile?.display_name,
          preferences: {
            interests,
            dream_destination: dreamCity.trim(),
          },
        }).eq("id", user.id).then(() => {});
      }
      trackEvent("onboarding_completed", { interests_count: interests.length, dream_city: dreamCity });
      onComplete();
    }
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return interests.length > 0;
    if (step === 3) return dreamCity.trim().length > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Skip */}
      <div className="flex items-center justify-between px-6 pt-4">
        <span className="text-zinc-600 text-[13px] font-medium">{step + 1}/{TOTAL_STEPS}</span>
        <button
          onClick={() => { trackEvent("onboarding_skipped", { step }); onComplete(); }}
          className="text-zinc-500 text-sm font-medium hover:text-zinc-300 transition-colors px-2 py-1"
        >
          Skip
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 mt-2">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-orange-500 rounded-full"
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto"
        onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartXRef.current == null) return;
          const diff = e.changedTouches[0].clientX - touchStartXRef.current;
          touchStartXRef.current = null;
          if (diff < -50 && canProceed()) goNext();
          else if (diff > 50 && step > 0) setStep((s) => s - 1);
        }}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center w-full max-w-sm"
        >
          {/* Step 0: Welcome */}
          {step === 0 && (
            <>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-8 shadow-2xl"
              >
                <Globe className="w-12 h-12 text-white" strokeWidth={1.5} />
              </motion.div>
              <h2 className="text-white text-[26px] font-bold tracking-tight mb-3">Welcome to Weventr</h2>
              <p className="text-zinc-400 text-[16px] leading-relaxed max-w-[300px]">
                Plan group trips without the chaos. Let's set you up in 30 seconds.
              </p>
            </>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <>
              <div className="text-5xl mb-6">👋</div>
              <h2 className="text-white text-[22px] font-bold tracking-tight mb-2">What should we call you?</h2>
              <p className="text-zinc-500 text-[14px] mb-6">This is how your group sees you</p>
              <input
                ref={inputRef}
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canProceed()) goNext(); }}
                className="w-full max-w-[280px] bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-[16px] text-white text-center placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <>
              <div className="text-5xl mb-6">✨</div>
              <h2 className="text-white text-[22px] font-bold tracking-tight mb-2">What are you into?</h2>
              <p className="text-zinc-500 text-[14px] mb-6">Pick what excites you — we'll customize your feed</p>
              <div className="flex flex-wrap justify-center gap-2.5 max-w-[340px]">
                {INTEREST_TAGS.map((tag) => {
                  const selected = interests.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      onClick={() => setInterests((prev) => selected ? prev.filter((i) => i !== tag.value) : [...prev, tag.value])}
                      className={`px-4 py-2.5 rounded-2xl text-[13px] font-semibold transition-all ${
                        selected
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105"
                          : "bg-zinc-900 text-zinc-400 border border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  );
                })}
              </div>
              {interests.length > 0 && (
                <p className="text-orange-400 text-[13px] font-medium mt-4">{interests.length} selected</p>
              )}
            </>
          )}

          {/* Step 3: Dream destination */}
          {step === 3 && (
            <>
              <div className="text-5xl mb-6">🌍</div>
              <h2 className="text-white text-[22px] font-bold tracking-tight mb-2">Dream destination?</h2>
              <p className="text-zinc-500 text-[14px] mb-6">If you could go anywhere right now</p>
              <div className="relative w-full max-w-[280px]">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Tokyo, Barcelona, Bali..."
                  value={dreamCity}
                  onChange={(e) => setDreamCity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && canProceed()) goNext(); }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl pl-12 pr-5 py-4 text-[16px] text-white text-center placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </>
          )}

          {/* Step 4: How it works — Discover */}
          {step === 4 && (
            <>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-6 shadow-2xl"
              >
                <motion.div animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Compass className="w-12 h-12 text-white" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
              <h2 className="text-white text-[22px] font-bold tracking-tight mb-3">Discover & Swipe</h2>
              <div className="space-y-3 text-left w-full max-w-[300px]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                  </div>
                  <p className="text-zinc-400 text-[14px]"><span className="text-white font-medium">Swipe right</span> to propose activities to your group</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <ThumbsUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-zinc-400 text-[14px]"><span className="text-white font-medium">Vote together</span> in Blind Match — no peer pressure</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <GripVertical className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-zinc-400 text-[14px]"><span className="text-white font-medium">Drag & drop</span> approved activities into your schedule</p>
                </div>
              </div>
            </>
          )}

          {/* Step 5: Trips & Budget */}
          {step === 5 && (
            <>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-6 shadow-2xl"
              >
                <Plane className="w-12 h-12 text-white" strokeWidth={1.5} />
              </motion.div>
              <h2 className="text-white text-[22px] font-bold tracking-tight mb-3">You're all set!</h2>
              <div className="space-y-3 text-left w-full max-w-[300px]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Plane className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-zinc-400 text-[14px]"><span className="text-white font-medium">Create a trip</span> → add cities, dates, invite friends</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <DollarSign className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-zinc-400 text-[14px]"><span className="text-white font-medium">Budget Lock</span> splits hotel & flights automatically</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-pink-400" />
                  </div>
                  <p className="text-zinc-400 text-[14px]"><span className="text-white font-medium">Share the code</span> — friends join in seconds</p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom button */}
      <div className="px-8 pb-8">
        <button
          onClick={goNext}
          disabled={!canProceed()}
          className="w-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-2xl text-[16px] font-semibold transition-all shadow-lg shadow-orange-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {step === 0 ? "Let's go" : step === TOTAL_STEPS - 1 ? (
            <><Check className="w-5 h-5" /> Start Planning</>
          ) : (
            <><ArrowRight className="w-5 h-5" /> Continue</>
          )}
        </button>
      </div>
    </div>
  );
}
