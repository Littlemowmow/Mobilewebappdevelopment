import { useState } from "react";

const screens = [
  {
    id: 1,
    title: "Blind Match",
    color: "#7C3AED",
    issues: [
      {
        type: "clarity",
        label: "❓ Unclear context",
        note: '"Voted" — for what? The card needs to surface what the vote is actually about (activities? destination? dates?). Users shouldn\'t have to guess.',
        status: "open",
      },
      {
        type: "feature",
        label: "✅ All-votes-in state",
        note: "Need a variant for when all 4 members have voted. What does the reveal look like? This is a key moment — the payoff of the whole feature.",
        status: "todo",
      },
      {
        type: "feature",
        label: "⚙️ Edit / manage members",
        note: "No way to add or remove members from this view. Need an edit action — either in the header or via swipe/long-press on a member row.",
        status: "todo",
      },
      {
        type: "ux",
        label: '🔔 "Nudge them" isn\'t a CTA',
        note: "The nudge prompt at the bottom looks like an info chip, not something tappable. If it's actionable, it needs to look like a button.",
        status: "open",
      },
    ],
  },
  {
    id: 2,
    title: "Discover",
    color: "#EA580C",
    issues: [
      {
        type: "ux",
        label: "🔍 Add a search bar",
        note: "If this is a search/discover area, users who already know what they want need a search input at the top. Don't make them swipe to find it.",
        status: "todo",
      },
      {
        type: "clarity",
        label: "❓ City filter chips — rethink",
        note: "The city pills (Barcelona, Madrid, Lisbon) work fine for a multi-city trip context but can't scale past ~3. Consider a filter sheet instead of inline pills for more destinations. The idea of active filters showing as removable chips is good — just needs a better home.",
        status: "open",
      },
      {
        type: "feature",
        label: "➕ Add to trip CTA on card",
        note: 'The old version had a way to add an activity to a specific trip — bring that back. The card needs a primary CTA: at minimum "Add to Trip" + "View Details."',
        status: "todo",
      },
      {
        type: "ux",
        label: "📊 Intensity slider — is it a CTA?",
        note: '"Drag to rate" at the bottom feels passive. Make clear this is interactive and what rating does (affects recommendations? saves a preference?).',
        status: "open",
      },
      {
        type: "layout",
        label: "🗑️ Remove blank space",
        note: "Big empty area below the card description. Either fill it or let the card be shorter.",
        status: "todo",
      },
    ],
  },
  {
    id: 3,
    title: "My Trips",
    color: "#EA580C",
    issues: [
      {
        type: "feature",
        label: "➕ Create Trip flow",
        note: 'The + button needs a label ("New Trip" or "Create Trip") or at least a bottom sheet that makes the action clear. The current dashed card "Plan a New Trip" and the + button are redundant — pick one entry point.',
        status: "todo",
      },
      {
        type: "clarity",
        label: "❓ Multi-city arrows are confusing",
        note: "Barcelona → Madrid → Lisbon flow with day counts reads okay once you know what it is, but first-time users won't. Consider labeling the route more explicitly.",
        status: "open",
      },
      {
        type: "feature",
        label: "🔑 Join via code",
        note: 'If EURO26 is a joinable trip code, there needs to be a clear "Enter code" input — probably on the empty state or in a Join/Add Trip flow.',
        status: "todo",
      },
      {
        type: "ux",
        label: "📁 Completed trips should be tappable",
        note: '"London Weekend · Completed" should still open the trip so users can review what they did. Right now it reads like a dead list item.',
        status: "todo",
      },
      {
        type: "architecture",
        label: "🏗️ App architecture needs mapping",
        note: "Trips, Trip Spark, and Blind Match all live under \"Trips\" but the hierarchy isn't clear. Write out the full navigation architecture before adding more screens. Key question: does clicking Trips go to the trip list, or jump straight into the active trip's schedule?",
        status: "open",
      },
    ],
  },
  {
    id: 4,
    title: "Schedule",
    color: "#0891B2",
    issues: [
      {
        type: "ux",
        label: "🗺️ City switcher scroll",
        note: "The city tab row (Barcelona, Madrid, Lisbon) truncates. Make sure this is horizontally scrollable and visually signals there's more.",
        status: "open",
      },
      {
        type: "clarity",
        label: "🏷️ Tag hierarchy (SIDEQUEST vs LOCAL)",
        note: "Two different label styles for activity types — SIDEQUEST in orange caps, LOCAL in purple caps. Are these the same taxonomy? Define what each tag means and keep styling consistent.",
        status: "open",
      },
      {
        type: "ux",
        label: "✈️ Flight card — what's tappable?",
        note: '"You + Sara arriving · 12:30 PM — AA 432" is a rich info block. Can you tap it to see flight details? The ON TIME badge implies live data — that\'s great, just make sure the affordance is clear.',
        status: "open",
      },
    ],
  },
  {
    id: 5,
    title: "Budget",
    color: "#059669",
    issues: [
      {
        type: "ux",
        label: "⚖️ Settle Up tab",
        note: "Good to have — make sure the settle up flow handles unequal splits and shows who owes what clearly. No notes on this yet.",
        status: "open",
      },
      {
        type: "clarity",
        label: "📊 Progress bars need labels",
        note: "Barcelona $820/$1,600 etc. — the orange/teal/green colors for cities are nice but need a legend somewhere. First-time user won't know which color = which city.",
        status: "open",
      },
      {
        type: "layout",
        label: "📋 Accommodation / Food cards cut off",
        note: "The bottom of the screen cuts off at Food & Drink. Make sure users know to scroll. Consider a subtle scroll indicator.",
        status: "todo",
      },
    ],
  },
];

const typeBadge = {
  clarity: {
    bg: "#FEF3C7",
    color: "#92400E",
    label: "Clarity",
  },
  feature: {
    bg: "#DCFCE7",
    color: "#166534",
    label: "Feature",
  },
  ux: { bg: "#EDE9FE", color: "#5B21B6", label: "UX" },
  layout: { bg: "#FEE2E2", color: "#991B1B", label: "Layout" },
  architecture: {
    bg: "#DBEAFE",
    color: "#1E40AF",
    label: "Architecture",
  },
};

const statusStyles = {
  open: { bg: "#1F2937", color: "#9CA3AF", label: "Open" },
  todo: { bg: "#1E3A5F", color: "#60A5FA", label: "To Do" },
  done: { bg: "#064E3B", color: "#34D399", label: "Done" },
};

export default function DesignReview() {
  const [statuses, setStatuses] = useState(() => {
    const init = {};
    screens.forEach((s) =>
      s.issues.forEach((issue, i) => {
        init[`${s.id}-${i}`] = issue.status;
      }),
    );
    return init;
  });

  const [activeScreen, setActiveScreen] = useState(null);

  const toggle = (key) => {
    setStatuses((prev) => {
      const cycle = {
        open: "todo",
        todo: "done",
        done: "open",
      };
      return { ...prev, [key]: cycle[prev[key]] };
    });
  };

  const totalIssues = screens.reduce(
    (a, s) => a + s.issues.length,
    0,
  );
  const doneCount = Object.values(statuses).filter(
    (v) => v === "done",
  ).length;

  const displayed = activeScreen
    ? screens.filter((s) => s.id === activeScreen)
    : screens;

  return (
    <div
      style={{
        background: "#0A0A0F",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: "#E5E7EB",
        padding: "32px 20px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: "#6B7280",
            marginBottom: 6,
            textTransform: "uppercase",
          }}
        >
          Design Review
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: "#F9FAFB",
            }}
          >
            Travel App · v0.1
          </h1>
          <div
            style={{
              background: "#111827",
              border: "1px solid #1F2937",
              borderRadius: 999,
              padding: "6px 16px",
              fontSize: 13,
              color: "#9CA3AF",
            }}
          >
            <span style={{ color: "#34D399", fontWeight: 600 }}>
              {doneCount}
            </span>
            {" / "}
            {totalIssues} resolved
          </div>
        </div>
      </div>

      {/* Screen filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        <button
          onClick={() => setActiveScreen(null)}
          style={{
            background:
              activeScreen === null ? "#F9FAFB" : "#111827",
            color:
              activeScreen === null ? "#0A0A0F" : "#9CA3AF",
            border: "1px solid #1F2937",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          All Screens
        </button>
        {screens.map((s) => (
          <button
            key={s.id}
            onClick={() =>
              setActiveScreen(
                activeScreen === s.id ? null : s.id,
              )
            }
            style={{
              background:
                activeScreen === s.id ? s.color : "#111827",
              color: activeScreen === s.id ? "#fff" : "#9CA3AF",
              border: `1px solid ${activeScreen === s.id ? s.color : "#1F2937"}`,
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Screens */}
      {displayed.map((screen) => {
        const screenDone = screen.issues.filter(
          (_, i) => statuses[`${screen.id}-${i}`] === "done",
        ).length;

        return (
          <div
            key={screen.id}
            style={{
              background: "#111827",
              border: "1px solid #1F2937",
              borderRadius: 16,
              marginBottom: 20,
              overflow: "hidden",
            }}
          >
            {/* Screen header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #1F2937",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: screen.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#F9FAFB",
                  }}
                >
                  Screen {screen.id} — {screen.title}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#6B7280" }}>
                {screenDone}/{screen.issues.length}
              </span>
            </div>

            {/* Issues */}
            {screen.issues.map((issue, i) => {
              const key = `${screen.id}-${i}`;
              const st = statuses[key];
              const badge = typeBadge[issue.type];
              const sstyle = statusStyles[st];

              return (
                <div
                  key={i}
                  style={{
                    padding: "16px 20px",
                    borderBottom:
                      i < screen.issues.length - 1
                        ? "1px solid #1F2937"
                        : "none",
                    opacity: st === "done" ? 0.45 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          borderRadius: 4,
                          padding: "2px 7px",
                        }}
                      >
                        {badge.label}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#F3F4F6",
                        }}
                      >
                        {issue.label}
                      </span>
                    </div>
                    <button
                      onClick={() => toggle(key)}
                      style={{
                        background: sstyle.bg,
                        color: sstyle.color,
                        border: "none",
                        borderRadius: 999,
                        padding: "4px 12px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {sstyle.label}
                    </button>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#9CA3AF",
                      lineHeight: 1.6,
                    }}
                  >
                    {issue.note}
                  </p>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Architecture note */}
      <div
        style={{
          marginTop: 8,
          background: "#111827",
          border: "1px dashed #3B82F6",
          borderRadius: 16,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            color: "#3B82F6",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          🏗 Open Architecture Question
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#9CA3AF",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: "#E5E7EB" }}>
            Navigation model for Trips tab:
          </strong>{" "}
          Right now Trips, Trip Spark, and Blind Match all exist
          under one tab without a clear hierarchy. Two options
          to decide between:
          <br />
          <br />
          <strong style={{ color: "#60A5FA" }}>
            Option A
          </strong>{" "}
          — Trips tab = trip list. Tap active trip → sub-nav
          appears (Schedule, Budget, Blind Match, etc.).
          <br />
          <strong style={{ color: "#60A5FA" }}>
            Option B
          </strong>{" "}
          — Trips tab jumps straight into the active trip's
          Schedule. A back/switch button lets you navigate to
          other trips.
          <br />
          <br />
          Option B is faster for power users mid-trip. Option A
          is clearer for new users.
          <strong style={{ color: "#E5E7EB" }}>
            {" "}
            Decide this before designing more sub-screens.
          </strong>
        </p>
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}