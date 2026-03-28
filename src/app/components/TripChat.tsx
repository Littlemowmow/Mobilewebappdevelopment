import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Loader2, ArrowRight, Check, MapPin, Calendar, DollarSign, Users, Compass, Utensils } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { trackEvent } from "../../lib/analytics";
import { useNavigate } from "react-router";

// Fixed interview steps — no free-form chat
const STEPS = [
  { id: "destination", question: "Where do you want to go?", placeholder: "e.g., Chicago, Barcelona, Tokyo...", icon: MapPin, type: "text" as const },
  { id: "duration", question: "How many days?", placeholder: "e.g., 3, 5, 7...", icon: Calendar, type: "number" as const },
  { id: "budget", question: "What's your budget per person?", placeholder: "e.g., 500, 1000, 2000...", icon: DollarSign, type: "number" as const },
  { id: "group", question: "How many people?", placeholder: "e.g., 1, 2, 4...", icon: Users, type: "number" as const },
  { id: "vibe", question: "What's the vibe?", placeholder: "", icon: Compass, type: "choice" as const, choices: [
    { value: "luxury", label: "Luxury", emoji: "💎" },
    { value: "modest", label: "Balanced", emoji: "✨" },
    { value: "budget", label: "Budget", emoji: "💰" },
  ]},
  { id: "interests", question: "What are you into?", placeholder: "", icon: Utensils, type: "multi" as const, choices: [
    { value: "food", label: "Foodie", emoji: "🍜" },
    { value: "culture", label: "Culture", emoji: "🏛️" },
    { value: "nature", label: "Nature", emoji: "🌿" },
    { value: "adventure", label: "Adventure", emoji: "🧗" },
    { value: "shopping", label: "Shopping", emoji: "🛍️" },
    { value: "history", label: "History", emoji: "📜" },
    { value: "art", label: "Art", emoji: "🎨" },
    { value: "photo", label: "Photo Spots", emoji: "📸" },
    { value: "local", label: "Local Gems", emoji: "💎" },
  ]},
];

interface Answers {
  destination: string;
  duration: string;
  budget: string;
  group: string;
  vibe: string;
  interests: string[];
}

export function TripChat({ onClose }: { onClose: () => void }) {
  const { createTrip } = useTrip();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ destination: "", duration: "", budget: "", group: "1", vibe: "", interests: [] });
  const [inputVal, setInputVal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const allDone = step >= STEPS.length;

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [step, generatedPlan]);

  const goNext = () => {
    if (!current) return;

    // Save answer
    const key = current.id as keyof Answers;
    if (current.type === "text" || current.type === "number") {
      if (!inputVal.trim()) return;
      setAnswers((prev) => ({ ...prev, [key]: inputVal.trim() }));
      setInputVal("");
    }
    // Choice and multi are saved inline via their buttons

    if (isLastStep) {
      setStep(STEPS.length); // trigger generation
    } else {
      setStep((s) => s + 1);
    }
  };

  const selectChoice = (value: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
    if (isLastStep) {
      setStep(STEPS.length);
    } else {
      setStep((s) => s + 1);
    }
  };

  const toggleInterest = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((i) => i !== value)
        : [...prev.interests, value],
    }));
  };

  const confirmInterests = () => {
    if (answers.interests.length === 0) return;
    setStep(STEPS.length);
  };

  // Generate trip with ONE Claude API call
  useEffect(() => {
    if (!allDone || generating || generatedPlan) return;
    setGenerating(true);
    setError("");
    trackEvent("ai_trip_generation_started", { destination: answers.destination });

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Create a ${answers.duration}-day trip itinerary for ${answers.destination}. Budget: $${answers.budget} per person. Group size: ${answers.group}. Vibe: ${answers.vibe}. Interests: ${answers.interests.join(", ")}. Give me a day-by-day plan with specific activity names, times, and estimated costs. Keep it concise — 2-3 activities per day. Format each day as "Day X:" followed by bullet points.`,
        tripContext: {
          cities: [answers.destination],
          budget: parseInt(answers.budget) || 0,
          groupSize: parseInt(answers.group) || 1,
          vibe: answers.vibe,
          interests: answers.interests,
        },
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed" }));
          throw new Error(err.error || "Failed to generate");
        }
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/event-stream")) {
          const reader = res.body?.getReader();
          if (!reader) throw new Error("No body");
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.text) setGeneratedPlan((prev) => prev + data.text);
                } catch { /* skip */ }
              }
            }
          }
        } else {
          const data = await res.json();
          setGeneratedPlan(data.message || "Failed to generate plan");
        }
        setGenerating(false);
      })
      .catch((err) => {
        setError(err.message);
        setGenerating(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  // Create the actual trip from the generated plan
  const handleCreateTrip = async () => {
    setGenerating(true);
    const days = parseInt(answers.duration) || 3;
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + 7); // default to 1 week from now
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);

    const { error: createError, tripId } = await createTrip({
      title: `${answers.destination} Trip`,
      destinations: [answers.destination],
      daysPerCity: [days],
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
      budget: parseInt(answers.budget) || 0,
      trip_vibe: answers.vibe as "luxury" | "modest" | "budget",
      group_size: parseInt(answers.group) || 1,
      interests: answers.interests,
      dates_tbd: true,
    });

    if (createError) {
      setError(createError);
      setGenerating(false);
      return;
    }

    trackEvent("ai_trip_created", { destination: answers.destination, trip_id: tripId });
    onClose();
    if (tripId) navigate(`/trips/${tripId}`);
    else navigate("/trips");
  };

  // Render answered questions as chat bubbles
  const answeredSteps = STEPS.slice(0, step);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md md:max-w-lg bg-zinc-950 rounded-t-[24px] flex flex-col" style={{ height: "85dvh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white">Plan a Trip</h3>
              <p className="text-[11px] text-zinc-500">
                {allDone ? "Generating your itinerary..." : `Step ${step + 1} of ${STEPS.length}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Conversation */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Greeting */}
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-zinc-800 text-zinc-200 rounded-2xl rounded-bl-md px-4 py-3 text-[14px] leading-relaxed">
              Hey {profile?.name || ""}! Let's build your dream trip 🌍
            </div>
          </div>

          {/* Answered questions */}
          {answeredSteps.map((s, i) => {
            const Icon = s.icon;
            const answer = s.id === "interests"
              ? (answers.interests.join(", ") || "—")
              : (answers[s.id as keyof Answers] as string || "—");
            return (
              <div key={s.id}>
                {/* AI question */}
                <div className="flex justify-start mb-2">
                  <div className="max-w-[85%] bg-zinc-800 text-zinc-200 rounded-2xl rounded-bl-md px-4 py-3 text-[14px] leading-relaxed flex items-center gap-2">
                    <Icon className="w-4 h-4 text-orange-400 shrink-0" />
                    {s.question}
                  </div>
                </div>
                {/* User answer */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-orange-500 text-white rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed">
                    {s.id === "budget" ? `$${answer}` : s.id === "duration" ? `${answer} days` : s.id === "group" ? `${answer} people` : answer}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Current question */}
          {!allDone && current && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-zinc-800 text-zinc-200 rounded-2xl rounded-bl-md px-4 py-3 text-[14px] leading-relaxed flex items-center gap-2">
                <current.icon className="w-4 h-4 text-orange-400 shrink-0" />
                {current.question}
              </div>
            </div>
          )}

          {/* Generated plan */}
          {allDone && (generating || generatedPlan) && (
            <div className="flex justify-start">
              <div className="max-w-[90%] bg-zinc-800 text-zinc-200 rounded-2xl rounded-bl-md px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap">
                {generatedPlan || (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                    <span className="text-zinc-400">Building your itinerary...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-[13px] text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-zinc-800 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          {/* Text/number input */}
          {!allDone && current?.type !== "choice" && current?.type !== "multi" && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                {current?.id === "budget" && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                )}
                <input
                  ref={inputRef}
                  type={current?.type === "number" ? "number" : "text"}
                  placeholder={current?.placeholder}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") goNext(); }}
                  className={`w-full bg-zinc-800 border border-zinc-700 rounded-2xl ${current?.id === "budget" ? "pl-8" : "pl-4"} pr-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
              </div>
              <button
                onClick={goNext}
                disabled={!inputVal.trim()}
                className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40 shrink-0"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* Choice buttons (vibe) */}
          {!allDone && current?.type === "choice" && current.choices && (
            <div className="flex gap-2">
              {current.choices.map((c) => (
                <button
                  key={c.value}
                  onClick={() => selectChoice(c.value)}
                  className={`flex-1 py-3 rounded-2xl text-[14px] font-semibold transition-all ${
                    answers.vibe === c.value
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-orange-500/50"
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Multi-select (interests) */}
          {!allDone && current?.type === "multi" && current.choices && (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {current.choices.map((c) => {
                  const selected = answers.interests.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      onClick={() => toggleInterest(c.value)}
                      className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                        selected
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={confirmInterests}
                disabled={answers.interests.length === 0}
                className="w-full py-3 bg-orange-500 text-white rounded-2xl text-[14px] font-semibold disabled:opacity-40 transition-all"
              >
                Generate My Trip ({answers.interests.length} selected)
              </button>
            </div>
          )}

          {/* Create trip button after generation */}
          {allDone && generatedPlan && !generating && (
            <button
              onClick={handleCreateTrip}
              disabled={generating}
              className="w-full py-4 bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-2xl text-[15px] font-semibold shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Create This Trip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
