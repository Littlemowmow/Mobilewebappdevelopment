import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTrip } from "../context/TripContext";
import { Plane, Home, DollarSign, ArrowRight, Check, X, HelpCircle } from "lucide-react";

type Answer = "yes" | "no" | "not-sure";

interface Question {
  id: string;
  icon: typeof Plane;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  followUp?: {
    yes?: string;
    no?: string;
  };
}

const QUESTIONS: Question[] = [
  {
    id: "flights",
    icon: Plane,
    iconBg: "bg-teal-50 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    title: "Are flights booked?",
    subtitle: "Or still looking for the best deals",
    followUp: {
      yes: "How much were flights per person?",
      no: "No worries — we'll estimate flight costs for you.",
    },
  },
  {
    id: "hotels",
    icon: Home,
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Hotels or Airbnb sorted?",
    subtitle: "Accommodation for the group",
    followUp: {
      yes: "How much per night?",
      no: "We'll estimate accommodation costs per city.",
    },
  },
  {
    id: "budget",
    icon: DollarSign,
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    title: "Have a budget in mind?",
    subtitle: "Per person, roughly",
    followUp: {
      yes: "We'll help you stay within it.",
      no: "That's fine — we'll calculate one based on what your group picks.",
    },
  },
];

export function TripSetup() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trips } = useTrip();
  const trip = trips.find(t => String(t.id) === String(tripId));

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [budgetInput, setBudgetInput] = useState("");
  const [flightCost, setFlightCost] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [hotelCostPerNight, setHotelCostPerNight] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);

  if (!trip) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-zinc-500">Trip not found</p>
      </div>
    );
  }

  const question = QUESTIONS[currentQ];
  const isLast = currentQ === QUESTIONS.length - 1;
  const currentAnswer = answers[question.id];

  const handleAnswer = (answer: Answer) => {
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
    setShowFollowUp(true);
  };

  const handleNext = () => {
    setShowFollowUp(false);
    if (isLast) {
      // Done — go to trip detail
      navigate(`/trips/${tripId}`);
    } else {
      setCurrentQ(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-5 py-6 max-w-md mx-auto flex flex-col">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              i < currentQ ? "bg-orange-500"
              : i === currentQ ? "bg-orange-500"
              : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          />
        ))}
      </div>

      {/* Trip Name */}
      <div className="mb-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Setting up</span>
      </div>
      <h2 className="text-lg text-orange-500 font-semibold mb-8">{trip.name}</h2>

      {/* Question Card */}
      <div className="flex-1 flex flex-col justify-center -mt-16">
        <div className="flex justify-center mb-8">
          <div className={`w-20 h-20 rounded-[24px] ${question.iconBg} flex items-center justify-center border-2 border-zinc-200/50 dark:border-zinc-800 shadow-xl`}>
            <question.icon className={`w-10 h-10 ${question.iconColor}`} />
          </div>
        </div>

        <h1 className="text-[28px] text-center font-semibold text-zinc-900 dark:text-white mb-3 tracking-tight">
          {question.title}
        </h1>
        <p className="text-center text-zinc-500 dark:text-zinc-400 text-[15px] mb-10">
          {question.subtitle}
        </p>

        {/* Flight cost + flight number input */}
        {question.id === "flights" && currentAnswer === "yes" && showFollowUp && (
          <div className="mb-6 space-y-3">
            <div className="relative max-w-[220px] mx-auto">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg font-medium">$</span>
              <input
                type="number"
                value={flightCost}
                onChange={(e) => setFlightCost(e.target.value)}
                placeholder="0"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-9 pr-4 py-4 text-center text-2xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">per person, round trip</p>
            <div className="max-w-[260px] mx-auto">
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="Flight # (e.g. AA 432)"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-center text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">We'll track it and text you updates</p>
            </div>
          </div>
        )}

        {/* Hotel cost per night input */}
        {question.id === "hotels" && currentAnswer === "yes" && showFollowUp && (
          <div className="mb-6">
            <div className="relative max-w-[220px] mx-auto">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg font-medium">$</span>
              <input
                type="number"
                value={hotelCostPerNight}
                onChange={(e) => setHotelCostPerNight(e.target.value)}
                placeholder="0"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-9 pr-4 py-4 text-center text-2xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">per night, total (we'll split per person)</p>
            {trip && (
              <p className="text-center text-xs text-orange-500 font-medium mt-2">
                {trip.duration} = ~${hotelCostPerNight ? (parseFloat(hotelCostPerNight) * parseInt(trip.duration)).toLocaleString() : '0'} total
              </p>
            )}
          </div>
        )}

        {/* Budget input for the budget question */}
        {question.id === "budget" && currentAnswer === "yes" && showFollowUp && (
          <div className="mb-6">
            <div className="relative max-w-[200px] mx-auto">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg font-medium">$</span>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="0"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-9 pr-4 py-4 text-center text-2xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-2">per person</p>
          </div>
        )}

        {/* Follow-up message */}
        {showFollowUp && currentAnswer && currentAnswer !== "not-sure" && question.followUp && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl px-5 py-3 mb-6 text-center">
            <p className="text-sm text-orange-500 font-medium">
              {question.followUp[currentAnswer]}
            </p>
          </div>
        )}

        {showFollowUp && currentAnswer === "not-sure" && (
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 mb-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              No problem — you can always update this later.
            </p>
          </div>
        )}

        {/* Answer Buttons */}
        {!showFollowUp ? (
          <div className="space-y-3">
            <button
              onClick={() => handleAnswer("yes")}
              className={`w-full flex items-center gap-4 p-5 rounded-[20px] border transition-all ${
                currentAnswer === "yes"
                  ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800"
                  : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center border border-teal-100 dark:border-teal-800/50">
                <Check className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-white">Yes</span>
            </button>

            <button
              onClick={() => handleAnswer("no")}
              className={`w-full flex items-center gap-4 p-5 rounded-[20px] border transition-all ${
                currentAnswer === "no"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center border border-red-100 dark:border-red-800/50">
                <X className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-white">Not yet</span>
            </button>

            <button
              onClick={() => handleAnswer("not-sure")}
              className="w-full flex items-center gap-4 p-5 rounded-[20px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700">
                <HelpCircle className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-white">Not sure yet</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-2xl text-[15px] font-semibold transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2"
          >
            {isLast ? "Start Planning" : "Next"}
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Skip */}
      <button
        onClick={() => navigate(`/trips/${tripId}`)}
        className="text-center text-zinc-500 dark:text-zinc-400 text-sm font-medium hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mt-6"
      >
        Skip for now
      </button>
    </div>
  );
}
