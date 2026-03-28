import { useState, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { Compass, Plane, Calendar, ThumbsUp, ThumbsDown, Users, GripVertical, DollarSign } from "lucide-react";

const STEPS = [
  {
    icon: Compass,
    iconBg: "from-orange-500 to-amber-500",
    emoji: "👆",
    title: "Swipe Right to Propose",
    body: "Activities you like get proposed to your group — not just saved for you.",
    hint: "Swipe left to pass, right to propose",
  },
  {
    icon: Plane,
    iconBg: "from-teal-500 to-cyan-500",
    emoji: "✈️",
    title: "Create a Trip, Invite Friends",
    body: "Tap Trips, hit +, pick your cities. Share the invite code and plan together.",
    hint: "Multi-city routes with day-by-day planning",
  },
  {
    icon: Calendar,
    iconBg: "from-purple-500 to-violet-500",
    emoji: "📋",
    title: "Schedule & Budget, Sorted",
    body: "Drag activities into your schedule. Budget Lock splits costs automatically.",
    hint: "Hotel, flights, and activities — all tracked",
  },
  {
    icon: ThumbsUp,
    iconBg: "from-pink-500 to-rose-500",
    emoji: "🗳️",
    title: "Blind Match Decides",
    body: "Can't agree? Everyone votes blind. Top picks make the cut.",
    hint: "No peer pressure — votes are private",
  },
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) goNext();
    else if (info.offset.x > 50) goPrev();
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Skip */}
      <div className="flex justify-end px-6 pt-4">
        <button
          onClick={onComplete}
          className="text-zinc-500 text-sm font-medium hover:text-zinc-300 transition-colors px-2 py-1"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="flex flex-col items-center text-center w-full max-w-sm"
          >
            {/* Illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
              className={`w-28 h-28 rounded-[32px] bg-gradient-to-br ${current.iconBg} flex items-center justify-center mb-8 shadow-2xl`}
            >
              {step === 0 && (
                <motion.div
                  animate={{ rotate: [0, 12, -12, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Icon className="w-14 h-14 text-white" strokeWidth={1.5} />
                </motion.div>
              )}
              {step === 1 && (
                <div className="relative">
                  <Icon className="w-14 h-14 text-white" strokeWidth={1.5} />
                  <div className="absolute -bottom-1 -right-1 flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-orange-400 border-2 border-teal-500" />
                    <div className="w-5 h-5 rounded-full bg-pink-400 border-2 border-teal-500" />
                    <div className="w-5 h-5 rounded-full bg-purple-400 border-2 border-teal-500" />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="w-4 h-4 text-white/60" />
                    <div className="w-16 h-2.5 rounded-full bg-white/40" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="w-4 h-4 text-white/60" />
                    <div className="w-14 h-2.5 rounded-full bg-white/30" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="w-4 h-4 text-white/60" />
                    <div className="w-12 h-2.5 rounded-full bg-white/20" />
                  </div>
                  <DollarSign className="w-6 h-6 text-white/80 mt-1" />
                </div>
              )}
              {step === 3 && (
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  >
                    <ThumbsUp className="w-10 h-10 text-white" strokeWidth={1.5} />
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  >
                    <ThumbsDown className="w-10 h-10 text-white/50" strokeWidth={1.5} />
                  </motion.div>
                </div>
              )}
            </motion.div>

            {/* Text */}
            <h2 className="text-white text-[24px] font-bold tracking-tight mb-3 leading-tight">
              {current.title}
            </h2>
            <p className="text-zinc-400 text-[16px] leading-relaxed mb-3 max-w-[300px]">
              {current.body}
            </p>
            <p className="text-zinc-600 text-[13px] font-medium">
              {current.hint}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + button */}
      <div className="px-8 pb-8">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="h-2 rounded-full"
              animate={{
                width: i === step ? 24 : 8,
                backgroundColor: i === step ? "#f97316" : "#3f3f46",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={goNext}
          className="w-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-2xl text-[16px] font-semibold transition-all shadow-lg shadow-orange-600/30"
        >
          {isLast ? "Let's Go" : "Next"}
        </button>
      </div>
    </div>
  );
}
