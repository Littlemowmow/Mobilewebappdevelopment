import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Globe, Loader2 } from "lucide-react";

const emojiOptions = ["😎", "🤠", "🥳", "😈", "🦊", "🐸", "🌸", "⚡", "🔥", "💎", "🎯", "🌊", "🍕", "✈️", "🎒", "🗺️", "🌴", "🎭", "🎵", "🏔️"];

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
