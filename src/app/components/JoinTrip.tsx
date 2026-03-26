import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Globe, Loader2 } from "lucide-react";

const emojiOptions = ["😎", "🤠", "🥳", "😈", "🦊", "🐸", "🌸", "⚡", "🔥", "💎", "🎯", "🌊", "🍕", "✈️", "🎒", "🗺️", "🌴", "🎭", "🎵", "🏔️"];

const ACCOMMODATION_TYPES = ["Hotel", "Airbnb", "Hostel", "Friend's place", "Other"] as const;

export function JoinTrip() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();

  const [step, setStep] = useState<"profile" | "auth" | "joining" | "done">(user ? "profile" : "auth");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emoji, setEmoji] = useState("😎");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tripName, setTripName] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [flightCost, setFlightCost] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  // Accommodation state
  const [accomMode, setAccomMode] = useState<"none" | "same" | "own">("none");
  const [accomType, setAccomType] = useState<typeof ACCOMMODATION_TYPES[number]>("Hotel");
  const [accomAddress, setAccomAddress] = useState("");
  const [accomCheckin, setAccomCheckin] = useState("");
  const [accomCheckout, setAccomCheckout] = useState("");
  const [accomCostPerNight, setAccomCostPerNight] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = isSignUp
      ? await signUp(email, password, name || "Traveler")
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setStep("profile");
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return;
    setStep("joining");
    setError("");

    // Find trip by code
    const { data: trip, error: findError } = await supabase
      .from("trips")
      .select("*")
      .eq("invite_code", code?.toUpperCase())
      .single();

    if (findError || !trip) {
      setError("Trip not found. Check the invite code.");
      setStep("profile");
      return;
    }

    setTripName(trip.title);

    // Add as member if logged in
    if (user) {
      await supabase.from("trip_members").insert({
        trip_id: trip.id,
        user_id: user.id,
        role: "member",
      });

      // Update profile with name and phone if provided
      await supabase.from("profiles").update({
        display_name: name.trim(),
        ...(phone.trim() ? { bio: `📱 ${phone.trim()}` } : {}),
      }).eq("id", user.id);
    }

    setStep("done");
  };

  // Done state
  if (step === "done") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-7xl mb-4">{emoji}</div>
          <h1 className="text-[26px] font-semibold text-zinc-900 dark:text-white mb-2">You're in!</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] mb-8">
            Welcome to <span className="text-orange-500 font-semibold">{tripName}</span>, {name}!
          </p>
          <button
            onClick={() => navigate("/trips")}
            className="w-full bg-gradient-to-br from-orange-600 to-orange-500 text-white py-4 rounded-2xl text-[15px] font-semibold shadow-lg shadow-orange-600/30"
          >
            Let's Go
          </button>
        </div>
      </div>
    );
  }

  // Joining state
  if (step === "joining") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Joining trip...</p>
        </div>
      </div>
    );
  }

  // Auth step (not logged in)
  if (step === "auth") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <Globe className="w-7 h-7 text-orange-500" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">Weventr</span>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3 mb-4">
              <p className="text-orange-500 text-sm font-semibold">You've been invited to a trip!</p>
              <p className="text-orange-400 text-xs font-medium">Code: {code?.toUpperCase()}</p>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {isSignUp ? "Create an account to join" : "Sign in to join"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              minLength={6}
            />
            {error && <p className="text-red-500 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-orange-600 to-orange-500 text-white py-4 rounded-2xl text-[15px] font-semibold shadow-lg shadow-orange-600/30 disabled:opacity-50"
            >
              {loading ? "Loading..." : isSignUp ? "Create Account & Join" : "Sign In & Join"}
            </button>
          </form>
          <p className="text-center text-zinc-500 text-sm mt-4">
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }} className="text-orange-500 font-medium">{isSignUp ? "Sign in" : "Sign up"}</button>
          </p>
        </div>
      </div>
    );
  }

  // Profile step (logged in, fill in details)
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">{emoji}</div>
          <h1 className="text-[24px] font-semibold text-zinc-900 dark:text-white mb-1">Set up your profile</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">How should the group see you?</p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 ml-1">So the group can reach you during the trip</p>
          </div>

          {/* Emoji Avatar */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Pick Your Avatar</label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    emoji === e
                      ? "bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-500 shadow-md scale-110"
                      : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Flight Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-4 h-4 text-teal-500" style={{ animation: 'none' }} />
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Your Flight Details</label>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              placeholder="Flight # (e.g. AA 432)"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-[15px]">$</span>
              <input
                type="number"
                value={flightCost}
                onChange={(e) => setFlightCost(e.target.value)}
                placeholder="Flight cost (round trip)"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 ml-1">Arriving</label>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 ml-1">Departing</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">We'll track your flight and text you landing updates</p>
          </div>
        </div>

        {/* Accommodation */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏨</span>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Where are you staying?</label>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
          </div>

          {/* Mode selection pills */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAccomMode(accomMode === "same" ? "none" : "same")}
              className={`flex-1 py-3 px-3 rounded-2xl text-[13px] font-semibold border transition-all text-center ${
                accomMode === "same"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              Same as someone else
            </button>
            <button
              onClick={() => setAccomMode(accomMode === "own" ? "none" : "own")}
              className={`flex-1 py-3 px-3 rounded-2xl text-[13px] font-semibold border transition-all text-center ${
                accomMode === "own"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              Entering my own
            </button>
          </div>

          {/* "Same as someone else" — MVP: show first member */}
          {accomMode === "same" && (
            <div className="space-y-2">
              <button
                className="w-full flex items-center gap-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-2xl px-5 py-4 text-left transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  T
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-teal-700 dark:text-teal-300">Same as Trip Creator</div>
                  <div className="text-xs text-teal-600/70 dark:text-teal-400/70">You'll share their accommodation details</div>
                </div>
                <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </button>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">More members will appear here as they join</p>
            </div>
          )}

          {/* "Entering my own" — full form */}
          {accomMode === "own" && (
            <div className="space-y-3">
              {/* Accommodation type pills */}
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 ml-1">Type</label>
                <div className="flex flex-wrap gap-2">
                  {ACCOMMODATION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setAccomType(type)}
                      className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all ${
                        accomType === type
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name / Address */}
              <input
                type="text"
                value={accomAddress}
                onChange={(e) => setAccomAddress(e.target.value)}
                placeholder="Hotel name or address"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              {/* Check-in / Check-out dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 ml-1">Check-in</label>
                  <input
                    type="date"
                    value={accomCheckin}
                    onChange={(e) => setAccomCheckin(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 ml-1">Check-out</label>
                  <input
                    type="date"
                    value={accomCheckout}
                    onChange={(e) => setAccomCheckout(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Cost per night */}
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-[15px]">$</span>
                <input
                  type="number"
                  value={accomCostPerNight}
                  onChange={(e) => setAccomCostPerNight(e.target.value)}
                  placeholder="Cost per night (optional)"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm bg-red-500/10 rounded-xl px-4 py-3 mb-4">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={!name.trim()}
          className="w-full bg-gradient-to-br from-orange-600 to-orange-500 text-white py-4 rounded-2xl text-[15px] font-semibold shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Join Trip
        </button>
      </div>
    </div>
  );
}
