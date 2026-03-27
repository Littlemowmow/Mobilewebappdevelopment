import { TrendingUp, TrendingDown, ArrowLeft, Plus, X, Check, Lock, Unlock, Shield, Pencil } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { useBudget } from "../context/BudgetContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface RequiredExpense {
  category: string;
  emoji: string;
  perPerson: number;
  total: number;
  description: string;
}

const REQUIRED_EXPENSE_CATEGORIES = [
  { value: "Accommodation", emoji: "🏨" },
  { value: "Flights", emoji: "✈️" },
  { value: "Transportation", emoji: "🚆" },
  { value: "Food", emoji: "🍽️" },
  { value: "Activities", emoji: "🎭" },
  { value: "Other", emoji: "📦" },
];

interface LocalExpense {
  id: number;
  title: string;
  category: string;
  amount: number;
  paidBy: string;
  city: string;
  date: string;
  iconBg: string;
  emoji: string;
  splitWith?: string[];
  oweDirection?: "owed" | "you_owe" | null;
  oweMembers?: string[];
}

// Default color palette for member avatars
const DEFAULT_MEMBER_COLORS = ["bg-orange-500", "bg-teal-500", "bg-pink-500", "bg-blue-500", "bg-purple-500", "bg-amber-500"];

const CATEGORY_META: Record<string, { emoji: string; iconBg: string; barColor: string }> = {
  "Food & Drinks": { emoji: "🍽️", iconBg: "bg-orange-50 dark:bg-orange-900/30", barColor: "bg-orange-500" },
  "Activities": { emoji: "🎭", iconBg: "bg-teal-50 dark:bg-teal-900/30", barColor: "bg-teal-500" },
  "Transportation": { emoji: "🚆", iconBg: "bg-blue-50 dark:bg-blue-900/30", barColor: "bg-blue-500" },
  "Shopping": { emoji: "🛍️", iconBg: "bg-pink-50 dark:bg-pink-900/30", barColor: "bg-pink-500" },
  "Accommodation": { emoji: "🏨", iconBg: "bg-purple-50 dark:bg-purple-900/30", barColor: "bg-purple-500" },
};

export function Budget({ hideHeader }: { hideHeader?: boolean }) {
  const { activeTrip, setActiveTrip } = useTrip();
  const { budgetData } = useBudget();
  const { user, profile } = useAuth();
  const isSolo = activeTrip ? activeTrip.members <= 1 : false;
  const [selectedCity, setSelectedCity] = useState("All");
  const [dismissedSettlements, setDismissedSettlements] = useState<number[]>([]);
  const isSoloInit = activeTrip ? activeTrip.members <= 1 : false;
  const [activeSubTab, setActiveSubTab] = useState<"fund" | "budget" | "settle">(isSoloInit ? "budget" : "fund");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [localExpenses, setLocalExpenses] = useState<LocalExpense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Load persisted expenses from Supabase on mount
  useEffect(() => {
    if (!activeTrip || !user) return;
    setLoadingExpenses(true);
    supabase.from("trip_expenses")
      .select("*")
      .eq("trip_id", String(activeTrip.id))
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.warn("Failed to load expenses:", error.message);
        if (data) {
          setLocalExpenses(data.map((e: Record<string, unknown>) => ({
            id: e.id as number,
            title: e.title as string,
            amount: e.amount as number,
            category: e.category as string,
            city: e.city as string,
            paidBy: e.paid_by as string,
            splitWith: (e.split_with as string[]) || [],
            oweDirection: (e.owe_direction as LocalExpense["oweDirection"]) || null,
            oweMembers: (e.owe_members as string[]) || [],
            date: e.created_at as string,
            iconBg: CATEGORY_META[e.category as string]?.iconBg || "bg-zinc-50 dark:bg-zinc-900/30",
            emoji: CATEGORY_META[e.category as string]?.emoji || "📦",
          })));
        }
        setLoadingExpenses(false);
      });
  }, [activeTrip?.id, user]);

  // Current user's initial for "isYou" checks
  const myInitial = useMemo(() => {
    const name = profile?.display_name || profile?.name || user?.email?.split("@")[0] || "Y";
    return name.charAt(0).toUpperCase();
  }, [profile, user]);

  // Derive members from active trip context — no fake fallbacks
  const MEMBERS = useMemo(() => {
    if (activeTrip && activeTrip.memberInitials.length > 0) {
      return activeTrip.memberInitials;
    }
    return [myInitial];
  }, [activeTrip, myInitial]);

  const MEMBER_COLORS: Record<string, string> = useMemo(() => {
    if (activeTrip && activeTrip.memberInitials.length > 0) {
      const colors: Record<string, string> = {};
      activeTrip.memberInitials.forEach((initial, i) => {
        colors[initial] = activeTrip.memberColors[i] || DEFAULT_MEMBER_COLORS[i % DEFAULT_MEMBER_COLORS.length];
      });
      return colors;
    }
    return { [myInitial]: "bg-orange-500" };
  }, [activeTrip, myInitial]);

  // Budget Lock / Trip Fund state
  // Required expenses start empty — user adds real costs as they're known
  const [requiredExpenses, setRequiredExpenses] = useState<RequiredExpense[]>([]);

  // Load persisted required expenses from Supabase on mount
  useEffect(() => {
    if (!activeTrip || !user) return;
    supabase.from("trip_required_expenses")
      .select("*")
      .eq("trip_id", String(activeTrip.id))
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setRequiredExpenses(data.map((e: Record<string, unknown>) => {
            const cat = REQUIRED_EXPENSE_CATEGORIES.find(c => c.value === e.category) || { emoji: "📦" };
            return {
              category: e.category as string,
              emoji: cat.emoji,
              perPerson: e.amount as number,
              total: (e.amount as number) * MEMBERS.length,
              description: (e.description as string) || (e.title as string) || "",
            };
          }));
        }
      });
  }, [activeTrip?.id, user, MEMBERS.length]);

  const totalRequiredPerPerson = requiredExpenses.reduce((sum, e) => sum + e.perPerson, 0);
  const totalRequired = requiredExpenses.reduce((sum, e) => sum + e.total, 0);

  // Add required expense form state
  const [showAddRequired, setShowAddRequired] = useState(false);
  const [reqCategory, setReqCategory] = useState("Accommodation");
  const [reqDescription, setReqDescription] = useState("");
  const [reqAmount, setReqAmount] = useState("");

  // Editable total budget — prefer trip's stored budget, then context budget
  const initialBudget = activeTrip?.budget || activeTrip?.metadata?.personal_budget || budgetData.total || 0;
  const [totalBudget, setTotalBudget] = useState(initialBudget);
  const [editingTotalBudget, setEditingTotalBudget] = useState(false);
  const [totalBudgetDraft, setTotalBudgetDraft] = useState(String(initialBudget));

  // Sync totalBudget when activeTrip changes (e.g. first load from Supabase)
  useEffect(() => {
    const tripBudget = activeTrip?.budget || activeTrip?.metadata?.personal_budget || 0;
    if (tripBudget > 0 && totalBudget === 0) {
      setTotalBudget(tripBudget);
      setTotalBudgetDraft(String(tripBudget));
    }
  }, [activeTrip?.id, activeTrip?.budget, activeTrip?.metadata?.personal_budget]);

  // Editable category budgets
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(
    () => Object.fromEntries(budgetData.categories.map((c) => [c.category, c.budget]))
  );
  const [editingCategoryBudgets, setEditingCategoryBudgets] = useState(false);
  const [categoryBudgetDrafts, setCategoryBudgetDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(budgetData.categories.map((c) => [c.category, String(c.budget)]))
  );

  const [memberCommitments, setMemberCommitments] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MEMBERS.forEach((m, i) => { initial[m] = i === 0; }); // Only current user (first member) committed by default
    return initial;
  });
  const committedCount = MEMBERS.filter(m => memberCommitments[m]).length;
  const allCommitted = committedCount === MEMBERS.length;

  const toggleMyCommitment = () => {
    const me = MEMBERS[0];
    setMemberCommitments(prev => ({ ...prev, [me]: !prev[me] }));
  };

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("Food & Drinks");
  const [formCity, setFormCity] = useState(activeTrip?.cities[0]?.name || "");
  const [formPaidBy, setFormPaidBy] = useState(MEMBERS[0]);
  const [formSplitWith, setFormSplitWith] = useState<string[]>([...MEMBERS]);
  const [formOweDirection, setFormOweDirection] = useState<"owed" | "you_owe" | null>(null);
  const [formOweMembers, setFormOweMembers] = useState<string[]>([]);

  // Combine context transactions with local expenses
  const allTransactions = useMemo(
    () => [...localExpenses, ...budgetData.transactions],
    [localExpenses, budgetData.transactions]
  );

  // Compute extra spent from local expenses
  const localExtraSpent = useMemo(
    () => localExpenses.reduce((sum, e) => sum + e.amount, 0),
    [localExpenses]
  );

  // Recompute category totals including local expenses
  const adjustedCategories = useMemo(() => {
    const extraByCategory: Record<string, number> = {};
    for (const e of localExpenses) {
      extraByCategory[e.category] = (extraByCategory[e.category] || 0) + e.amount;
    }
    return budgetData.categories.map((cat) => ({
      ...cat,
      budget: categoryBudgets[cat.category] ?? cat.budget,
      spent: cat.spent + (extraByCategory[cat.category] || 0),
    }));
  }, [budgetData.categories, localExpenses, categoryBudgets]);

  // Recompute destination totals including local expenses
  const adjustedDestinations = useMemo(() => {
    const extraByCity: Record<string, number> = {};
    for (const e of localExpenses) {
      extraByCity[e.city] = (extraByCity[e.city] || 0) + e.amount;
    }
    return budgetData.destinations.map((dest) => ({
      ...dest,
      spent: dest.spent + (extraByCity[dest.city] || 0),
    }));
  }, [budgetData.destinations, localExpenses]);

  const totalSpent = budgetData.spent + localExtraSpent;

  // Settle up calculations
  const settleBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    for (const m of MEMBERS) balances[m] = 0;

    for (const t of allTransactions) {
      if (t.splitWith && t.splitWith.length > 0) {
        const share = t.amount / t.splitWith.length;
        // Payer paid the full amount
        balances[t.paidBy] = (balances[t.paidBy] || 0) + t.amount;
        // Each person in the split owes their share
        for (const person of t.splitWith) {
          balances[person] = (balances[person] || 0) - share;
        }
      }
      // If no splitWith, the payer paid for themselves — no debt
    }

    // Simplify debts: positive = owed money, negative = owes money
    const debtors = MEMBERS.filter((m) => balances[m] < -0.01).map((m) => ({ name: m, amount: -balances[m] }));
    const creditors = MEMBERS.filter((m) => balances[m] > 0.01).map((m) => ({ name: m, amount: balances[m] }));

    // Sort descending
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements: { from: string; to: string; amount: number }[] = [];
    let di = 0;
    let ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const transfer = Math.min(debtors[di].amount, creditors[ci].amount);
      if (transfer > 0.01) {
        settlements.push({
          from: debtors[di].name,
          to: creditors[ci].name,
          amount: Math.round(transfer * 100) / 100,
        });
      }
      debtors[di].amount -= transfer;
      creditors[ci].amount -= transfer;
      if (debtors[di].amount < 0.01) di++;
      if (creditors[ci].amount < 0.01) ci++;
    }

    return settlements;
  }, [allTransactions]);

  if (!activeTrip) {
    return (
      <div className="px-5 py-4 max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-xl mb-2 font-semibold text-zinc-900 dark:text-white">No Active Trip</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] mb-6">Select a trip to view its budget</p>
          <Link
            to="/trips"
            className="inline-block bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            View Trips
          </Link>
        </div>
      </div>
    );
  }

  const percentSpent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const remaining = totalBudget - totalSpent;
  const isOverBudget = totalBudget > 0 && percentSpent > 100;
  const budgetNotSet = totalBudget === 0;

  // Filter transactions by city
  const filteredTransactions = selectedCity === "All"
    ? allTransactions
    : allTransactions.filter(t => t.city === selectedCity);

  function resetForm() {
    setFormTitle("");
    setFormAmount("");
    setFormCategory("Food & Drinks");
    setFormCity(activeTrip?.cities[0]?.name || "");
    setFormPaidBy(MEMBERS[0]);
    setFormSplitWith([...MEMBERS]);
    setFormOweDirection(null);
    setFormOweMembers([]);
  }

  function handleAddExpense() {
    const amount = parseFloat(formAmount);
    if (!formTitle.trim() || isNaN(amount) || amount <= 0) return;

    const meta = CATEGORY_META[formCategory];
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const newExpense: LocalExpense = {
      id: Date.now(),
      title: formTitle.trim(),
      category: formCategory,
      amount,
      paidBy: formPaidBy,
      city: formCity,
      date: dateStr,
      iconBg: meta.iconBg,
      emoji: meta.emoji,
      splitWith: formSplitWith.length > 0 ? [...formSplitWith] : undefined,
      oweDirection: formOweDirection,
      oweMembers: formOweMembers.length > 0 ? [...formOweMembers] : undefined,
    };

    setLocalExpenses((prev) => [newExpense, ...prev]);

    // Persist to Supabase
    if (activeTrip && user) {
      const row = {
        trip_id: String(activeTrip.id),
        user_id: user.id,
        title: formTitle.trim(),
        amount,
        category: formCategory,
        city: formCity,
        paid_by: formPaidBy,
        split_with: formSplitWith.length > 0 ? [...formSplitWith] : [],
        owe_direction: formOweDirection || null,
        owe_members: formOweMembers.length > 0 ? [...formOweMembers] : [],
      };
      supabase.from("trip_expenses").insert(row).then(({ error }) => {
        if (error) console.warn("Failed to save expense:", error.message);
      });
    }

    setShowAddExpense(false);
    resetForm();
  }

  function toggleSplitMember(name: string) {
    setFormSplitWith((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function toggleOweMember(name: string) {
    setFormOweMembers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  return (
    <div className="px-5 py-4 max-w-md mx-auto pb-24">
      {/* Header with back to trips */}
      {!hideHeader && (
      <div className="flex items-center gap-3 mb-5 pt-1">
        <button
          onClick={() => setActiveTrip(null)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </button>
        <h1 className="text-[28px] tracking-tight text-zinc-900 dark:text-white">{activeTrip.name}</h1>
      </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-transparent">
        {!isSolo && (
        <button
          onClick={() => setActiveSubTab("fund")}
          className={`flex-1 py-3 rounded-xl text-[15px] transition-all ${
            activeSubTab === "fund"
              ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md font-semibold"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
          }`}
        >
          Fund
        </button>
        )}
        <button
          onClick={() => setActiveSubTab("budget")}
          className={`flex-1 py-3 rounded-xl text-[15px] transition-all ${
            activeSubTab === "budget"
              ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md font-semibold"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
          }`}
        >
          Budget
        </button>
        {!isSolo && (
          <button
            onClick={() => setActiveSubTab("settle")}
            className={`flex-1 py-3 rounded-xl text-[15px] transition-all ${
              activeSubTab === "settle"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
            }`}
          >
            Settle Up
          </button>
        )}
      </div>

      {/* ===== FUND VIEW (Budget Lock) — group only ===== */}
      {activeSubTab === "fund" && !isSolo && (
        <>
          {/* Lock Status Card */}
          <div className={`rounded-[28px] p-8 mb-5 shadow-lg border ${allCommitted ? "bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/40 dark:to-teal-900/20 border-teal-200/50 dark:border-teal-800/50" : "bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-zinc-200/50 dark:border-zinc-800"}`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${allCommitted ? "bg-teal-100 dark:bg-teal-500/20 border border-teal-200 dark:border-teal-500/30" : "bg-orange-100 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30"}`}>
                {allCommitted ? <Lock className="w-8 h-8 text-teal-600 dark:text-teal-400" /> : <Unlock className="w-8 h-8 text-orange-600 dark:text-orange-400" />}
              </div>
            </div>
            <div className="text-center mb-6">
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2 tracking-widest font-bold">
                {allCommitted ? "TRIP FUNDED" : "TRIP FUND"}
              </div>
              <div className="text-4xl mb-2 font-bold text-zinc-900 dark:text-white">
                ${totalRequiredPerPerson}
              </div>
              <div className="text-[15px] text-zinc-500 dark:text-zinc-400 font-medium">
                {isSolo ? "total required" : "required per person"}
              </div>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">{committedCount} of {MEMBERS.length} locked in</span>
                <span className={`font-semibold ${allCommitted ? "text-teal-600 dark:text-teal-400" : "text-orange-600 dark:text-orange-400"}`}>{Math.round((committedCount / MEMBERS.length) * 100)}%</span>
              </div>
              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${allCommitted ? "bg-gradient-to-r from-teal-500 to-teal-600" : "bg-gradient-to-r from-orange-500 to-orange-600"}`} style={{ width: `${(committedCount / MEMBERS.length) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Required Expenses */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Required Expenses</h3>
              <button
                onClick={() => setShowAddRequired(true)}
                className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              </button>
            </div>
            <div className="space-y-3">
              {requiredExpenses.length === 0 && !showAddRequired && (
                <button
                  onClick={() => setShowAddRequired(true)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 border-dashed rounded-[20px] p-6 text-center hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  <div className="text-3xl mb-2">💰</div>
                  <p className="text-zinc-900 dark:text-white font-semibold text-[15px] mb-1">No required expenses yet</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">Add shared costs like hotels, transport, or group activities</p>
                </button>
              )}
              {requiredExpenses.map((expense, idx) => (
                <div key={`${expense.category}-${idx}`} className="bg-white dark:bg-zinc-950 rounded-[20px] p-5 shadow-md border border-zinc-200/50 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl border border-zinc-200/50 dark:border-zinc-700">{expense.emoji}</div>
                      <div>
                        <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{expense.category}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{expense.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">${expense.perPerson}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">per person</div>
                      </div>
                      <button
                        onClick={() => setRequiredExpenses((prev) => prev.filter((_, i) => i !== idx))}
                        className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                      >
                        <X className="w-3 h-3 text-zinc-400 group-hover:text-red-500 dark:text-zinc-500 dark:group-hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Required Expense Inline Form */}
              {showAddRequired && (
                <div className="bg-white dark:bg-zinc-950 rounded-[20px] p-5 shadow-md border border-orange-200 dark:border-orange-800/50">
                  <div className="space-y-3">
                    <select
                      value={reqCategory}
                      onChange={(e) => setReqCategory(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-[15px] text-zinc-900 dark:text-white outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors appearance-none"
                    >
                      {REQUIRED_EXPENSE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.emoji} {c.value}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="What's this for?"
                      value={reqDescription}
                      onChange={(e) => setReqDescription(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-[15px] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                    />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-zinc-500 dark:text-zinc-400 font-semibold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Per person amount"
                        value={reqAmount}
                        onChange={(e) => setReqAmount(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 pl-8 text-[15px] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowAddRequired(false); setReqCategory("Accommodation"); setReqDescription(""); setReqAmount(""); }}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const amount = parseFloat(reqAmount);
                          if (!reqDescription.trim() || isNaN(amount) || amount <= 0) return;
                          const meta = REQUIRED_EXPENSE_CATEGORIES.find((c) => c.value === reqCategory);
                          setRequiredExpenses((prev) => [...prev, {
                            category: reqCategory,
                            emoji: meta?.emoji ?? "📦",
                            perPerson: amount,
                            total: amount * MEMBERS.length,
                            description: reqDescription.trim(),
                          }]);
                          // Persist to Supabase
                          if (activeTrip && user) {
                            supabase.from("trip_required_expenses").insert({
                              trip_id: String(activeTrip.id),
                              user_id: user.id,
                              title: reqDescription.trim(),
                              amount,
                              category: reqCategory,
                              description: reqDescription.trim(),
                            }).then(({ error }) => {
                              if (error) console.warn("Failed to save required expense:", error.message);
                            });
                          }
                          setShowAddRequired(false);
                          setReqCategory("Accommodation");
                          setReqDescription("");
                          setReqAmount("");
                        }}
                        disabled={!reqDescription.trim() || !reqAmount || parseFloat(reqAmount) <= 0}
                        className="flex-[2] py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-600/30 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-200/50 dark:border-zinc-800">
              <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{isSolo ? "Total required: " : "Total pool: "}</span>
              <span className="text-zinc-900 dark:text-white text-sm font-bold">${totalRequired}</span>
              {!isSolo && (
                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium"> (${totalRequiredPerPerson} × {MEMBERS.length} people)</span>
              )}
            </div>
          </div>

          {/* Member Commitments */}
          {!isSolo && (
          <div className="mb-5">
            <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Member Status</h3>
            <div className="bg-white dark:bg-zinc-950 rounded-[28px] p-6 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
              <div className="space-y-4">
                {MEMBERS.map((member) => {
                  const isCommitted = memberCommitments[member];
                  const isYou = member === myInitial;
                  return (
                    <div key={member} className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl ${MEMBER_COLORS[member]} flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-zinc-950`}>
                          <span className="text-lg font-bold">{member.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100">
                            {member} {isYou && <span className="text-zinc-500 dark:text-zinc-500 font-normal">(You)</span>}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            ${totalRequiredPerPerson} required
                          </div>
                        </div>
                      </div>
                      {isCommitted ? (
                        <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-xl border border-teal-100/80 dark:border-teal-800/50">
                          <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tracking-wide">LOCKED IN</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                          <Unlock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wide">PENDING</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* Your Commitment CTA */}
          {!memberCommitments[MEMBERS[0]] ? (
            <button
              onClick={toggleMyCommitment}
              className="w-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-2xl text-[15px] font-semibold transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Lock In ${totalRequiredPerPerson}
            </button>
          ) : (
            <button
              onClick={toggleMyCommitment}
              className="w-full bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/40 dark:to-teal-900/40 border-2 border-teal-200 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 py-4 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              You&apos;re Locked In — ${totalRequiredPerPerson}
            </button>
          )}

          {/* Info */}
          <div className="mt-6 p-5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm dark:shadow-none">
            <h4 className="text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">How Budget Lock works</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
              The trip creator sets required shared expenses. Each member locks in their commitment before the trip. Once everyone&apos;s locked in, the fund is secured — no one can back out of basic expenses without the group owner&apos;s permission.
            </p>
          </div>
        </>
      )}

      {/* ===== BUDGET VIEW ===== */}
      {activeSubTab === "budget" && (
        <>
          {/* Loading state */}
          {loadingExpenses && localExpenses.length === 0 && (
            <div className="space-y-4 mb-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-950 rounded-[20px] p-6 shadow-md border border-zinc-200/50 dark:border-zinc-800 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-3/4" />
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-1/2" />
                    </div>
                    <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state: no expenses at all */}
          {localExpenses.length === 0 && budgetData.transactions.length === 0 && !loadingExpenses && (
            <div className="text-center py-12 px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950 dark:to-green-900 rounded-[24px] flex items-center justify-center mx-auto mb-5 border-2 border-green-200 dark:border-green-800/50 shadow-xl">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No expenses yet</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[14px] mb-6 max-w-[260px] mx-auto">
                Start tracking your trip spending by adding your first expense.
              </p>
              <button
                onClick={() => setShowAddExpense(true)}
                className="px-6 py-3 bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-2xl text-[15px] font-semibold shadow-lg shadow-orange-600/30"
              >
                Add First Expense
              </button>
            </div>
          )}

          {/* Budget setup prompt when no budget is set */}
          {budgetNotSet && (localExpenses.length > 0 || budgetData.transactions.length > 0) && !loadingExpenses && (
            <div className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-zinc-950 rounded-[28px] p-8 mb-5 shadow-lg border border-orange-200/50 dark:border-orange-800/50 text-center">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-200 dark:border-orange-800/50">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Set your trip budget</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[14px] mb-5 max-w-[260px] mx-auto">
                Add a budget to track how much you have left to spend.
              </p>
              <div className="relative mb-4 max-w-[200px] mx-auto">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-lg font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={totalBudgetDraft !== "0" ? totalBudgetDraft : ""}
                  onChange={(e) => setTotalBudgetDraft(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-5 py-4 text-2xl font-bold text-zinc-900 dark:text-white text-center placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>
              <button
                onClick={() => {
                  const val = parseInt(totalBudgetDraft);
                  if (!isNaN(val) && val > 0) {
                    setTotalBudget(val);
                    if (activeTrip && typeof activeTrip.id === "string" && activeTrip.id.includes("-")) {
                      supabase.from("trips").update({ budget: val }).eq("id", activeTrip.id).then(() => {});
                    }
                  }
                }}
                disabled={!totalBudgetDraft || parseInt(totalBudgetDraft) <= 0}
                className="w-full max-w-[200px] bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-3.5 rounded-2xl text-[15px] font-semibold transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set Budget
              </button>
            </div>
          )}

          {/* City Pills — only show when there's data to display */}
          {(localExpenses.length > 0 || budgetData.transactions.length > 0 || !budgetNotSet) && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCity("All")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                selectedCity === "All"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
              }`}
            >
              <span className="text-lg">🌍</span>
              <span className="text-[15px] font-medium">All</span>
            </button>
            {adjustedDestinations.map((dest) => (
              <button
                key={dest.city}
                onClick={() => setSelectedCity(dest.city)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                  selectedCity === dest.city
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
                }`}
              >
                <span className="text-lg">{dest.flag}</span>
                <span className="text-[15px] font-medium">{dest.city}</span>
              </button>
            ))}
          </div>
          )}

          {/* Total Trip Card — only show when budget is set or expenses exist */}
          {(localExpenses.length > 0 || budgetData.transactions.length > 0 || !budgetNotSet) && (
          <>
          {/* Total Trip Card */}
          <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-white rounded-[28px] p-8 mb-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 tracking-widest font-bold">TOTAL TRIP</div>
                {!editingTotalBudget && (
                  <button
                    onClick={() => { setTotalBudgetDraft(String(totalBudget)); setEditingTotalBudget(true); }}
                    className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Pencil className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                  </button>
                )}
              </div>
              <div className="text-6xl mb-3 font-bold bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
                ${totalSpent.toLocaleString()}
              </div>
              {editingTotalBudget ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[15px] text-zinc-500 dark:text-zinc-400 font-medium">Budget: $</span>
                  <input
                    type="number"
                    min="0"
                    value={totalBudgetDraft}
                    onChange={(e) => setTotalBudgetDraft(e.target.value)}
                    className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-[15px] text-zinc-900 dark:text-white text-center outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      const val = parseFloat(totalBudgetDraft);
                      if (!isNaN(val) && val > 0) setTotalBudget(val);
                      setEditingTotalBudget(false);
                    }}
                    className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center hover:bg-teal-200 dark:hover:bg-teal-800/60 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  </button>
                  <button
                    onClick={() => setEditingTotalBudget(false)}
                    className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  </button>
                </div>
              ) : budgetNotSet ? (
                <button
                  onClick={() => { setTotalBudgetDraft(""); setEditingTotalBudget(true); }}
                  className="text-[15px] text-orange-500 dark:text-orange-400 font-semibold hover:underline cursor-pointer"
                >
                  Set your budget
                </button>
              ) : (
                <div className="text-[15px] text-zinc-500 dark:text-zinc-400 font-medium">
                  ${remaining.toLocaleString()} remaining of ${totalBudget.toLocaleString()}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {!budgetNotSet && (
              <>
                <div className="mb-3">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverBudget ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-teal-500 to-teal-600"
                      }`}
                      style={{ width: `${Math.min(percentSpent, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {isOverBudget ? (
                    <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  )}
                  <span className={`text-sm font-bold ${isOverBudget ? "text-red-600 dark:text-red-400" : "text-teal-600 dark:text-teal-400"}`}>
                    {percentSpent}% spent
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Spending Breakdown Pie Chart */}
          {(totalSpent > 0 || requiredExpenses.length > 0) && (() => {
            // Core trip costs (from fund lock / required expenses)
            const coreCosts = requiredExpenses.reduce((sum, e) => sum + e.total, 0);
            // Personal/discretionary spending (from logged expenses)
            const personalSpending = localExpenses.reduce((sum, e) => sum + e.amount, 0);
            const totalAll = coreCosts + personalSpending || 1;

            // Category breakdown for personal spending
            const categoryTotals: Record<string, number> = {};
            localExpenses.forEach(e => {
              categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
            });

            // Pie chart segments
            const CHART_COLORS = [
              "#ea580c", // orange - core
              "#14b8a6", // teal
              "#3b82f6", // blue
              "#ec4899", // pink
              "#a855f7", // purple
              "#f59e0b", // amber
              "#6366f1", // indigo
            ];

            const segments: { label: string; amount: number; color: string; emoji: string }[] = [];
            if (coreCosts > 0) segments.push({ label: "Core Trip Costs", amount: coreCosts, color: CHART_COLORS[0], emoji: "🔒" });
            Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, amt], i) => {
              const meta = CATEGORY_META[cat];
              segments.push({ label: cat, amount: amt, color: CHART_COLORS[(i + 1) % CHART_COLORS.length], emoji: meta?.emoji || "📦" });
            });

            // Build SVG conic gradient via stroke-dasharray circles
            let cumPercent = 0;
            const circumference = 2 * Math.PI * 70; // r=70

            return (
              <div className="bg-white dark:bg-zinc-950 rounded-[28px] p-6 mb-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
                <h3 className="text-[11px] text-zinc-500 dark:text-zinc-500 tracking-widest font-bold mb-5 text-center">SPENDING BREAKDOWN</h3>

                <div className="flex items-center gap-6">
                  {/* SVG Donut Chart */}
                  <div className="relative w-36 h-36 shrink-0">
                    <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                      {segments.map((seg, i) => {
                        const percent = seg.amount / totalAll;
                        const dashLength = percent * circumference;
                        const dashOffset = cumPercent * circumference;
                        cumPercent += percent;
                        return (
                          <circle
                            key={i}
                            cx="80" cy="80" r="70"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="20"
                            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                            strokeDashoffset={-dashOffset}
                            className="transition-all duration-500"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[22px] font-bold text-zinc-900 dark:text-white">${totalAll.toLocaleString()}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">TOTAL</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-2.5">
                    {segments.map((seg, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{seg.emoji} {seg.label}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">${seg.amount.toLocaleString()} · {Math.round((seg.amount / totalAll) * 100)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core vs Personal summary */}
                {coreCosts > 0 && personalSpending > 0 && (
                  <div className="flex gap-3 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-3 text-center border border-orange-100 dark:border-orange-800/30">
                      <div className="text-[11px] text-orange-600 dark:text-orange-400 font-bold tracking-wide mb-1">🔒 CORE</div>
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">${coreCosts.toLocaleString()}</div>
                      <div className="text-[10px] text-orange-500/70 dark:text-orange-400/60">Flights, hotels, transport</div>
                    </div>
                    <div className="flex-1 bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-3 text-center border border-teal-100 dark:border-teal-800/30">
                      <div className="text-[11px] text-teal-600 dark:text-teal-400 font-bold tracking-wide mb-1">💸 PERSONAL</div>
                      <div className="text-lg font-bold text-teal-600 dark:text-teal-400">${personalSpending.toLocaleString()}</div>
                      <div className="text-[10px] text-teal-500/70 dark:text-teal-400/60">Food, shopping, activities</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* By Destination */}
          <div className="mb-5">
            <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">By Destination</h3>
            <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[24px] p-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
              <div className="space-y-5">
                {adjustedDestinations.map((dest) => {
                  const percent = dest.budget > 0 ? Math.round((dest.spent / dest.budget) * 100) : 0;
                  return (
                    <div key={dest.city}>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{dest.flag}</span>
                          <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{dest.city}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">
                            ${dest.spent}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">
                            of ${dest.budget}
                          </div>
                        </div>
                      </div>
                      <div className="h-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200/30 dark:border-transparent">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all shadow-sm"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* By Category */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">By Category</h3>
              {editingCategoryBudgets ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const updated: Record<string, number> = {};
                      for (const [key, val] of Object.entries(categoryBudgetDrafts)) {
                        const num = parseFloat(val);
                        updated[key] = !isNaN(num) && num > 0 ? num : (categoryBudgets[key] ?? 0);
                      }
                      setCategoryBudgets(updated);
                      setEditingCategoryBudgets(false);
                    }}
                    className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center hover:bg-teal-200 dark:hover:bg-teal-800/60 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  </button>
                  <button
                    onClick={() => {
                      setCategoryBudgetDrafts(Object.fromEntries(Object.entries(categoryBudgets).map(([k, v]) => [k, String(v)])));
                      setEditingCategoryBudgets(false);
                    }}
                    className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCategoryBudgetDrafts(Object.fromEntries(Object.entries(categoryBudgets).map(([k, v]) => [k, String(v)])));
                    setEditingCategoryBudgets(true);
                  }}
                  className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              {adjustedCategories.map((cat) => {
                const percent = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
                return (
                  <div key={cat.category} className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[20px] p-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center text-xl border border-zinc-100 dark:border-zinc-800`}>
                          {cat.emoji}
                        </div>
                        <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">${cat.spent}</div>
                        {editingCategoryBudgets ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">of $</span>
                            <input
                              type="number"
                              min="0"
                              value={categoryBudgetDrafts[cat.category] ?? ""}
                              onChange={(e) => setCategoryBudgetDrafts((prev) => ({ ...prev, [cat.category]: e.target.value }))}
                              className="w-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-0.5 text-xs text-zinc-900 dark:text-white text-right outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                            />
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">of ${cat.budget}</div>
                        )}
                      </div>
                    </div>
                    <div className="h-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200/30 dark:border-transparent">
                      <div
                        className={`h-full ${cat.barColor} rounded-full transition-all shadow-sm`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </>
          )}

          {/* Recent Transactions — hide heading in empty state since we show dedicated empty state above */}
          {(localExpenses.length > 0 || budgetData.transactions.length > 0 || !budgetNotSet || loadingExpenses) && (
          <div>
            <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Recent Transactions</h3>
            {loadingExpenses ? (
              <div className="bg-white dark:bg-zinc-950 rounded-[20px] p-10 shadow-md border border-zinc-200/50 dark:border-zinc-800 flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-teal-500 rounded-full animate-spin" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading expenses…</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 rounded-[20px] p-10 shadow-md border border-zinc-200/50 dark:border-zinc-800 text-center">
                <div className="text-6xl mb-4">💸</div>
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No expenses yet</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 max-w-[240px] mx-auto">Track your spending by logging your first expense.</p>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-5 py-3 rounded-2xl text-[15px] font-semibold transition-all shadow-lg shadow-orange-600/30"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Add Expense
                </button>
              </div>
            ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[20px] p-4 shadow-md hover:shadow-lg transition-shadow border border-zinc-200/50 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${transaction.iconBg} flex items-center justify-center text-2xl border border-zinc-100 dark:border-zinc-800 flex-shrink-0`}>
                      {transaction.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 truncate">{transaction.title}</h4>
                        <span className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex-shrink-0">${transaction.amount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                        <span className="font-medium">{transaction.paidBy}</span>
                        <span>•</span>
                        <span>{transaction.date}</span>
                        <span>•</span>
                        <span>{transaction.city}</span>
                      </div>
                      {/* Owe / Owed indicator */}
                      {(transaction as LocalExpense).oweDirection && (transaction as LocalExpense).oweMembers && (transaction as LocalExpense).oweMembers!.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {(transaction as LocalExpense).oweDirection === "owed" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800/50">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7-7-7 7" /></svg>
                              OWED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800/50">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7 7 7-7" /></svg>
                              YOU OWE
                            </span>
                          )}
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {(transaction as LocalExpense).oweDirection === "owed"
                              ? (transaction as LocalExpense).oweMembers!.map(m => `${m} owes you`).join(", ")
                              : (transaction as LocalExpense).oweMembers!.map(m => `You owe ${m}`).join(", ")}
                          </span>
                        </div>
                      )}
                      {transaction.splitWith && transaction.splitWith.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">Split:</span>
                          {transaction.splitWith.map((person, idx) => (
                            <div
                              key={idx}
                              className={`w-6 h-6 rounded-full ${MEMBER_COLORS[person] || "bg-orange-500"} flex items-center justify-center text-white text-[10px] font-bold`}
                              title={person}
                            >
                              {person.charAt(0)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
          )}
        </>
      )}

      {/* ===== SETTLE UP VIEW ===== */}
      {activeSubTab === "settle" && !isSolo && (
        <div>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🤝</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">Settle Up</h2>
            <p className="text-[15px] text-zinc-500 dark:text-zinc-400">
              {settleBalances.length === 0 ? "Everyone is settled up!" : `${settleBalances.length} payment${settleBalances.length > 1 ? "s" : ""} needed`}
            </p>
          </div>

          {settleBalances.length === 0 ? (
            <div className="bg-white dark:bg-zinc-950 rounded-[20px] p-8 shadow-lg border border-zinc-200/50 dark:border-zinc-800 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[15px]">No outstanding balances</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settleBalances.filter((_, idx) => !dismissedSettlements.includes(idx)).map((s, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[20px] p-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-4">
                    {/* From member */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-full ${MEMBER_COLORS[s.from] || "bg-zinc-400"} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                        {s.from.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {s.from}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          owes {s.to}
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex items-center gap-3 flex-shrink-0">
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        ${s.amount.toFixed(2)}
                      </div>
                      <button
                        onClick={() => {
                          setDismissedSettlements(prev => [...prev, idx]);
                        }}
                        className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="mt-6">
            <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Member Summary</h3>
            <div className="bg-white dark:bg-zinc-950 rounded-[24px] p-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
              <div className="space-y-4">
                {MEMBERS.map((member) => {
                  const totalOwed = settleBalances
                    .filter((s) => s.to === member)
                    .reduce((sum, s) => sum + s.amount, 0);
                  const totalOwes = settleBalances
                    .filter((s) => s.from === member)
                    .reduce((sum, s) => sum + s.amount, 0);
                  const net = totalOwed - totalOwes;

                  return (
                    <div key={member} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${MEMBER_COLORS[member]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                        {member.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{member}</div>
                      </div>
                      <div className={`text-[15px] font-bold ${net > 0.01 ? "text-teal-600 dark:text-teal-400" : net < -0.01 ? "text-red-500 dark:text-red-400" : "text-zinc-400"}`}>
                        {net > 0.01 ? `+\u20AC${net.toFixed(2)}` : net < -0.01 ? `-\u20AC${Math.abs(net).toFixed(2)}` : "Settled"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Expense Button */}
      <button
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 shadow-lg shadow-orange-600/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowAddExpense(false); resetForm(); }}
          />

          {/* Bottom Sheet */}
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-[28px] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            <div className="px-6 pb-8 pt-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Add Expense</h2>
                <button
                  onClick={() => { setShowAddExpense(false); resetForm(); }}
                  className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  placeholder="What was it for?"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">Amount</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[15px] text-zinc-500 dark:text-zinc-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 pl-10 text-[15px] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors appearance-none"
                >
                  {Object.entries(CATEGORY_META).map(([name, meta]) => (
                    <option key={name} value={name}>
                      {meta.emoji} {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">City</label>
                <select
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors appearance-none"
                >
                  {budgetData.destinations.map((dest) => (
                    <option key={dest.city} value={dest.city}>
                      {dest.flag} {dest.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paid By */}
              {!isSolo && (
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">Paid by</label>
                <div className="flex gap-2">
                  {MEMBERS.map((member) => (
                    <button
                      key={member}
                      onClick={() => setFormPaidBy(member)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all ${
                        formPaidBy === member
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${MEMBER_COLORS[member]} flex items-center justify-center text-white text-xs font-bold`}>
                        {member.charAt(0)}
                      </div>
                      <span className={`text-[12px] font-medium ${formPaidBy === member ? "text-orange-600 dark:text-orange-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {member}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Split Between */}
              {!isSolo && (
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">Split between</label>
                <div className="flex gap-2">
                  {MEMBERS.map((member) => {
                    const isSelected = formSplitWith.includes(member);
                    return (
                      <button
                        key={member}
                        onClick={() => toggleSplitMember(member)}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all relative ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 opacity-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${MEMBER_COLORS[member]} flex items-center justify-center text-white text-xs font-bold relative`}>
                          {member.charAt(0)}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[12px] font-medium ${isSelected ? "text-orange-600 dark:text-orange-400" : "text-zinc-400"}`}>
                          {member}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {formSplitWith.length > 0 && formAmount && (
                  <div className="mt-2 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
                    ${(parseFloat(formAmount) / formSplitWith.length).toFixed(2)} per person
                  </div>
                )}
              </div>
              )}

              {/* Owe / Owed Section */}
              {!isSolo && (
              <div className="mb-6">
                {/* "Someone owes you?" toggle */}
                <div className="mb-3">
                  <button
                    onClick={() => {
                      if (formOweDirection === "owed") {
                        setFormOweDirection(null);
                        setFormOweMembers([]);
                      } else {
                        setFormOweDirection("owed");
                        setFormOweMembers([]);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                      formOweDirection === "owed"
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                    }`}
                  >
                    <span className={`text-[15px] font-medium ${formOweDirection === "owed" ? "text-teal-700 dark:text-teal-300" : "text-zinc-600 dark:text-zinc-400"}`}>
                      Does someone owe you for this?
                    </span>
                    <div className={`w-11 h-6 rounded-full transition-all relative ${formOweDirection === "owed" ? "bg-teal-500" : "bg-zinc-300 dark:bg-zinc-700"}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${formOweDirection === "owed" ? "left-[22px]" : "left-0.5"}`} />
                    </div>
                  </button>
                </div>

                {/* Show member checkboxes when "owed" is active */}
                {formOweDirection === "owed" && (
                  <div className="mb-3">
                    <label className="block text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">Who owes you?</label>
                    <div className="flex gap-2 flex-wrap">
                      {MEMBERS.filter(m => m !== formPaidBy).map((member) => {
                        const isSelected = formOweMembers.includes(member);
                        return (
                          <button
                            key={member}
                            onClick={() => toggleOweMember(member)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                              isSelected
                                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 opacity-60"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full ${MEMBER_COLORS[member] || "bg-zinc-400"} flex items-center justify-center text-white text-[11px] font-bold relative`}>
                              {member.charAt(0)}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <span className={`text-[13px] font-medium ${isSelected ? "text-teal-700 dark:text-teal-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                              {member}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {formOweMembers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {formOweMembers.map((m) => (
                          <span key={m} className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800/50">
                            Will notify {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* "You owe someone?" link — switches perspective */}
                {formOweDirection !== "you_owe" && formOweDirection !== "owed" && (
                  <button
                    onClick={() => { setFormOweDirection("you_owe"); setFormOweMembers([]); }}
                    className="text-[13px] font-medium text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    Or do you owe someone?
                  </button>
                )}

                {formOweDirection === "you_owe" && (
                  <div>
                    <div className="mb-3">
                      <button
                        onClick={() => { setFormOweDirection(null); setFormOweMembers([]); }}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-orange-500 bg-orange-50 dark:bg-orange-900/20 transition-all"
                      >
                        <span className="text-[15px] font-medium text-orange-700 dark:text-orange-300">
                          You owe someone for this
                        </span>
                        <div className="w-11 h-6 rounded-full bg-orange-500 relative">
                          <div className="absolute top-0.5 left-[22px] w-5 h-5 rounded-full bg-white shadow" />
                        </div>
                      </button>
                    </div>
                    <label className="block text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">Who do you owe?</label>
                    <div className="flex gap-2 flex-wrap">
                      {MEMBERS.filter(m => m !== MEMBERS[0]).map((member) => {
                        const isSelected = formOweMembers.includes(member);
                        return (
                          <button
                            key={member}
                            onClick={() => toggleOweMember(member)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 opacity-60"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full ${MEMBER_COLORS[member] || "bg-zinc-400"} flex items-center justify-center text-white text-[11px] font-bold relative`}>
                              {member.charAt(0)}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <span className={`text-[13px] font-medium ${isSelected ? "text-orange-700 dark:text-orange-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                              {member}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {formOweMembers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {formOweMembers.map((m) => (
                          <span key={m} className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800/50">
                            Will notify {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAddExpense(false); resetForm(); }}
                  className="flex-1 py-4 rounded-2xl text-[15px] font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={!formTitle.trim() || !formAmount || parseFloat(formAmount) <= 0}
                  className="flex-[2] py-4 rounded-2xl text-[15px] font-semibold bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-600/30 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
