import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useTrip } from "../context/TripContext";
import { Copy, Check, Share2, ArrowRight, Users, MessageCircle, Plus, X } from "lucide-react";

export function InviteMembers() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trips, addMember } = useTrip();
  const trip = trips.find(t => String(t.id) === String(tripId));

  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<{ name: string; emoji: string }[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [friendEmoji, setFriendEmoji] = useState("😎");

  if (!trip) {
    return (
      <div className="px-5 py-4 max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h2 className="text-xl mb-2 font-semibold text-zinc-900 dark:text-white">Trip Not Found</h2>
          <Link to="/trips" className="inline-block bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold">Back to Trips</Link>
        </div>
      </div>
    );
  }

  const inviteLink = `${window.location.origin}/join/${trip.code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Join ${trip.name} on Weventr`,
        text: `Join our trip "${trip.name}"! Use code: ${trip.code}`,
        url: inviteLink,
      });
    } else {
      copyLink();
    }
  };

  const emojiOptions = ["😎", "🤠", "🥳", "😈", "🦊", "🐸", "🌸", "⚡", "🔥", "💎", "🎯", "🌊", "🍕", "✈️", "🎒", "🗺️", "🌴", "🎭", "🎵", "🏔️"];

  const addFriend = () => {
    if (!friendName.trim() || !tripId) return;
    const name = friendName.trim();
    setFriends([...friends, { name, emoji: friendEmoji }]);
    // Also add to trip context so they show in TripDetail member list
    const colors = ["bg-teal-500", "bg-purple-500", "bg-blue-500", "bg-pink-500", "bg-amber-500"];
    addMember(tripId, name, colors[friends.length % colors.length]);
    setFriendName("");
    setFriendEmoji("😎");
    setShowAddFriend(false);
  };

  return (
    <div className="px-5 py-4 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-[26px] tracking-tight font-semibold text-zinc-900 dark:text-white mb-2">Trip Created!</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-[15px]">Now invite your crew to <span className="text-orange-500 font-semibold">{trip.name}</span></p>
      </div>

      {/* Invite Link Card */}
      <div className="bg-white dark:bg-zinc-950 rounded-[28px] p-6 mb-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
        <div className="text-[11px] text-zinc-500 dark:text-zinc-500 tracking-widest font-bold mb-4">SHARE WITH YOUR GROUP CHAT</div>

        {/* Code Display */}
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 mb-4 text-center border border-zinc-200/50 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Trip Code</div>
          <div className="text-3xl font-bold tracking-[0.3em] text-orange-500">{trip.code}</div>
        </div>

        {/* Link */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3 mb-4 flex items-center gap-2 border border-zinc-200/30 dark:border-zinc-800">
          <span className="flex-1 text-xs text-zinc-500 dark:text-zinc-400 truncate font-mono">{inviteLink}</span>
          <button onClick={copyLink} className="flex items-center gap-1.5 bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-teal-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={shareLink} className="flex items-center justify-center gap-2 bg-gradient-to-br from-orange-600 to-orange-500 text-white py-3.5 rounded-2xl text-[14px] font-semibold shadow-lg shadow-orange-600/30 transition-all hover:from-orange-500 hover:to-orange-600">
            <Share2 className="w-4 h-4" />
            Share Link
          </button>
          <button onClick={copyLink} className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white py-3.5 rounded-2xl text-[14px] font-semibold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <MessageCircle className="w-4 h-4" />
            Copy Code
          </button>
        </div>
      </div>

      {/* Direct Add Friends */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Or Add Friends Directly</h3>
          <button onClick={() => setShowAddFriend(true)} className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center border border-orange-100/80 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">
            <Plus className="w-4 h-4 text-orange-500" />
          </button>
        </div>

        {/* Added Friends */}
        {friends.length > 0 && (
          <div className="space-y-2 mb-4">
            {friends.map((friend, index) => (
              <div key={index} className="bg-white dark:bg-zinc-950 rounded-[20px] p-4 flex items-center gap-3 shadow-md border border-zinc-200/50 dark:border-zinc-800">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-2xl border-2 border-white dark:border-zinc-950 shadow-md">
                  {friend.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100">{friend.name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Added to trip</div>
                </div>
                <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg border border-teal-100/80 dark:border-transparent">
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" strokeWidth={3} />
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">ADDED</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {friends.length === 0 && !showAddFriend && (
          <button onClick={() => setShowAddFriend(true)} className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 border-dashed rounded-[20px] p-6 text-center hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
            <Users className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Add friends who aren't in the group chat</p>
          </button>
        )}

        {/* Add Friend Form */}
        {showAddFriend && (
          <div className="bg-white dark:bg-zinc-950 rounded-[20px] p-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-white">Add Friend</h4>
              <button onClick={() => setShowAddFriend(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Friend's name"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all mb-4"
            />

            {/* Emoji Picker */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Pick their avatar</label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setFriendEmoji(emoji)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                      friendEmoji === emoji
                        ? "bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-500 shadow-md scale-110"
                        : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={addFriend}
              disabled={!friendName.trim()}
              className="w-full bg-gradient-to-br from-orange-600 to-orange-500 text-white py-3.5 rounded-2xl text-[14px] font-semibold shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Add {friendName.trim() || "Friend"}
            </button>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <button
        onClick={() => navigate(`/trips/${tripId}/setup`)}
        className="w-full bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-200 text-white dark:text-black py-4 rounded-2xl text-[15px] font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
      >
        Continue Setup
        <ArrowRight className="w-5 h-5" />
      </button>

      <button
        onClick={() => navigate(`/trips/${tripId}`)}
        className="w-full text-center mt-3 text-zinc-500 dark:text-zinc-400 text-sm font-medium hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        Skip to trip
      </button>
    </div>
  );
}
