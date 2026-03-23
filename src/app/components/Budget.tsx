import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { useBudget } from "../context/BudgetContext";
import { Link } from "react-router";
import { useState } from "react";

export function Budget() {
  const { activeTrip, setActiveTrip } = useTrip();
  const { budgetData } = useBudget();
  const [selectedCity, setSelectedCity] = useState("All");

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

  const percentSpent = Math.round((budgetData.spent / budgetData.total) * 100);
  const remaining = budgetData.total - budgetData.spent;
  const isOverBudget = percentSpent > 100;

  // Filter transactions by city
  const filteredTransactions = selectedCity === "All" 
    ? budgetData.transactions 
    : budgetData.transactions.filter(t => t.city === selectedCity);

  return (
    <div className="px-5 py-4 max-w-md mx-auto pb-24">
      {/* Header with back to trips */}
      <div className="flex items-center gap-3 mb-5 pt-1">
        <button 
          onClick={() => setActiveTrip(null)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </button>
        <h1 className="text-[28px] tracking-tight text-zinc-900 dark:text-white">{activeTrip.name}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-transparent">
        <button className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-xl text-[15px] font-semibold shadow-md transition-all">
          Budget
        </button>
        <button className="flex-1 text-zinc-500 dark:text-zinc-400 py-3 rounded-xl text-[15px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
          Settle Up
        </button>
      </div>

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
        {budgetData.destinations.map((dest) => (
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
            ${budgetData.spent.toLocaleString()}
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
            {budgetData.destinations.map((dest) => {
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
          {budgetData.categories.map((cat) => {
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
                    <span className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex-shrink-0">€{transaction.amount}</span>
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
                          className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold"
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
    </div>
  );
}