import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, X, Loader2, Plane } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { trackEvent } from "../../lib/analytics";
import { useNavigate } from "react-router";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

export function TripChat({ onClose }: { onClose: () => void }) {
  const { activeTrip, createTrip } = useTrip();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: activeTrip
        ? `Hey ${profile?.name || ""}! Ask me anything about "${activeTrip.name}" — restaurant recs, hidden gems, budget tips, or help with your itinerary 🗺️`
        : `Hey ${profile?.name || ""}! I can help you plan a trip from scratch. Where are you dreaming of going? 🌍`,
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [creatingTrip, setCreatingTrip] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    trackEvent("ai_chat_message", { trip_name: activeTrip?.name || "none", message_length: text.length });

    const assistantId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const tripContext = activeTrip
        ? {
            tripName: activeTrip.name,
            cities: activeTrip.cities.map((c) => c.name),
            dates: activeTrip.dates,
            vibe: activeTrip.metadata?.trip_vibe,
            interests: activeTrip.metadata?.interests,
            budget: activeTrip.budget,
            groupSize: activeTrip.members,
          }
        : undefined;

      // Build conversation history for context
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, tripContext, history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Connection failed" }));
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: `Sorry, something went wrong. ${err.error || "Try again."}` } : m))
        );
        setStreaming(false);
        return;
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        // Streaming response
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

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
                if (data.text) {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + data.text } : m))
                  );
                }
              } catch {
                // Skip
              }
            }
          }
        }
      } else {
        // Non-streaming JSON response
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: data.message || data.error || "No response" } : m))
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: "Couldn't reach the AI. Check your connection and try again." } : m))
      );
    }
    setStreaming(false);
  }, [input, streaming, activeTrip, messages]);

  // Quick action buttons
  const suggestions = activeTrip
    ? [
        `Best restaurants in ${activeTrip.cities[0]?.name || "the area"}?`,
        "What should we not miss?",
        "Help optimize our schedule",
        "Budget tips for this trip",
      ]
    : [
        "Plan me a weekend in Chicago",
        "I want a beach trip under $500",
        "Best Europe itinerary for a week",
        "Surprise me with a random trip idea",
      ];

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
              <h3 className="text-[15px] font-semibold text-white">Weventr AI</h3>
              <p className="text-[11px] text-zinc-500">
                {activeTrip ? `Helping with "${activeTrip.name}"` : "Trip planning assistant"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white rounded-br-md"
                    : "bg-zinc-800 text-zinc-200 rounded-bl-md"
                }`}
              >
                {msg.content || (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    <span className="text-zinc-500 text-[13px]">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Suggestions — show only at start */}
          {messages.length <= 1 && !streaming && (
            <div className="flex flex-wrap gap-2 pt-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); }}
                  className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 px-3.5 py-2 rounded-xl text-[13px] font-medium hover:bg-zinc-700/50 hover:border-zinc-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-zinc-800 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={activeTrip ? `Ask about ${activeTrip.cities[0]?.name || "your trip"}...` : "Where do you want to go?"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              disabled={streaming}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 text-center mt-2">Powered by Claude</p>
        </div>
      </div>
    </div>
  );
}
