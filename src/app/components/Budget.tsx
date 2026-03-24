import { TrendingUp, TrendingDown, ArrowLeft, Plus, X, Check } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { useBudget } from "../context/BudgetContext";
import { Link } from "react-router";
import { useState, useMemo } from "react";

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
}

const MEMBERS = ["Helena", "Sara", "Zara", "Alex"];

const MEMBER_COLORS: Record<string, string> = {
  Helena: "bg-orange-500",
  Sara: "bg-teal-500",
  Zara: "bg-pink-500",
  Alex: "bg-blue-500",
};

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
  const [selectedCity, setSelectedCity] = useState("All");
  const [activeSubTab, setActiveSubTab] = useState<"budget" | "settle">("budget");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [localExpenses, setLocalExpenses] = useState<LocalExpense[]>([]);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("Food & Drinks");
  const [formCity, setFormCity] = useState("Barcelona");
  const [formPaidBy, setFormPaidBy] = useState("Helena");
  const [formSplitWith, setFormSplitWith] = useState<string[]>([...MEMBERS]);

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
      spent: cat.spent + (extraByCategory[cat.category] || 0),
    }));
  }, [budgetData.categories, localExpenses]);

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

  const percentSpent = Math.round((totalSpent / budgetData.total) * 100);
  const remaining = budgetData.total - totalSpent;
  const isOverBudget = percentSpent > 100;

  // Filter transactions by city
  const filteredTransactions = selectedCity === "All"
    ? allTransactions
    : allTransactions.filter(t => t.city === selectedCity);

  function resetForm() {
    setFormTitle("");
    setFormAmount("");
    setFormCategory("Food & Drinks");
    setFormCity("Barcelona");
    setFormPaidBy("Helena");
    setFormSplitWith([...MEMBERS]);
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
    };

    setLocalExpenses((prev) => [newExpense, ...prev]);
    setShowAddExpense(false);
    resetForm();
  }

  function toggleSplitMember(name: string) {
    setFormSplitWith((prev) =>
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
        <button
          onClick={() => setActiveSubTab("budget")}
          className={`flex-1 py-3 rounded-xl text-[15px] font-semibold transition-all ${
            activeSubTab === "budget"
              ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Budget
        </button>
        <button
          onClick={() => setActiveSubTab("settle")}
          className={`flex-1 py-3 rounded-xl text-[15px] font-medium transition-all ${
            activeSubTab === "settle"
              ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md font-semibold"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Settle Up
        </button>
      </div>

      {/* ===== BUDGET VIEW ===== */}
      {activeSubTab === "budget" && (
        <>
          {/* City Pills */}
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

          {/* Total Trip Card */}
          <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-white rounded-[28px] p-8 mb-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
            <div className="text-center mb-6">
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3 tracking-widest font-bold">TOTAL TRIP</div>
              <div className="text-6xl mb-3 font-bold bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
                ${totalSpent.toLocaleString()}
              </div>
              <div className="text-[15px] text-zinc-500 dark:text-zinc-400 font-medium">
                ${remaining.toLocaleString()} remaining of ${budgetData.total.toLocaleString()}
              </div>
            </div>

            {/* Progress Bar */}
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
          </div>

          {/* By Destination */}
          <div className="mb-5">
            <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">By Destination</h3>
            <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[24px] p-5 shadow-lg border border-zinc-200/50 dark:border-zinc-800">
              <div className="space-y-5">
                {adjustedDestinations.map((dest) => {
                  const percent = Math.round((dest.spent / dest.budget) * 100);
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
            <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">By Category</h3>
            <div className="space-y-3">
              {adjustedCategories.map((cat) => {
                const percent = Math.round((cat.spent / cat.budget) * 100);
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
                        <div className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">of ${cat.budget}</div>
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

          {/* Recent Transactions */}
          <div>
            <h3 className="text-[15px] font-semibold mb-3 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Recent Transactions</h3>
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
                        <span className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex-shrink-0">{"\u20AC"}{transaction.amount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                        <span className="font-medium">{transaction.paidBy}</span>
                        <span>•</span>
                        <span>{transaction.date}</span>
                        <span>•</span>
                        <span>{transaction.city}</span>
                      </div>
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
          </div>
        </>
      )}

      {/* ===== SETTLE UP VIEW ===== */}
      {activeSubTab === "settle" && (
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
              {settleBalances.map((s, idx) => (
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
                        {"\u20AC"}{s.amount.toFixed(2)}
                      </div>
                      <button
                        onClick={() => alert("Coming soon!")}
                        className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity"
                      >
                        Settle
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
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[15px] text-zinc-500 dark:text-zinc-400 font-semibold">{"\u20AC"}</span>
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

              {/* Split Between */}
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
                    {"\u20AC"}{(parseFloat(formAmount) / formSplitWith.length).toFixed(2)} per person
                  </div>
                )}
              </div>

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
