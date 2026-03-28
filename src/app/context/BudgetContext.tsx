import { createContext, useContext, useMemo, useRef, ReactNode } from "react";
import { useTrip } from "./TripContext";

interface Transaction {
  id: number; title: string; category: string; amount: number; paidBy: string
  city: string; date: string; iconBg: string; emoji: string; splitWith?: string[]
}

interface CategoryData {
  category: string; spent: number; budget: number; iconBg: string; emoji: string; barColor: string
}

interface DestinationData {
  city: string; flag: string; spent: number; budget: number
}

export interface BudgetData {
  total: number; spent: number
  categories: CategoryData[]; destinations: DestinationData[]; transactions: Transaction[]
}

interface BudgetContextType { budgetData: BudgetData }

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

function createEmptyBudget(cities: { name: string; flag: string }[], tripBudget: number = 0): BudgetData {
  return {
    total: tripBudget,
    spent: 0,
    categories: [
      { category: "Food & Drinks", spent: 0, budget: 0, iconBg: "bg-orange-50 dark:bg-orange-900/30", emoji: "🍽️", barColor: "bg-orange-500" },
      { category: "Activities", spent: 0, budget: 0, iconBg: "bg-teal-50 dark:bg-teal-900/30", emoji: "🎭", barColor: "bg-teal-500" },
      { category: "Transportation", spent: 0, budget: 0, iconBg: "bg-blue-50 dark:bg-blue-900/30", emoji: "🚆", barColor: "bg-blue-500" },
      { category: "Shopping", spent: 0, budget: 0, iconBg: "bg-pink-50 dark:bg-pink-900/30", emoji: "🛍️", barColor: "bg-pink-500" },
      { category: "Accommodation", spent: 0, budget: 0, iconBg: "bg-purple-50 dark:bg-purple-900/30", emoji: "🏨", barColor: "bg-purple-500" },
    ],
    destinations: cities.map(c => ({
      city: c.name,
      flag: c.flag,
      spent: 0,
      budget: 0,
    })),
    transactions: [],
  };
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { activeTrip } = useTrip();

  // Stabilize cities dep: only recompute when the serialized city list changes
  const citiesKey = activeTrip?.cities.map(c => `${c.name}|${c.flag}`).join(",") ?? "";
  const citiesRef = useRef(activeTrip?.cities ?? []);
  const prevCitiesKey = useRef(citiesKey);
  if (citiesKey !== prevCitiesKey.current) {
    citiesRef.current = activeTrip?.cities ?? [];
    prevCitiesKey.current = citiesKey;
  }

  const tripBudget = activeTrip?.budget || activeTrip?.metadata?.personal_budget || 0;

  const budgetData = useMemo(() => {
    if (!activeTrip) return createEmptyBudget([]);
    return createEmptyBudget(citiesRef.current, tripBudget);
  }, [activeTrip?.id, citiesKey, tripBudget]);

  return (
    <BudgetContext.Provider value={{ budgetData }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) throw new Error("useBudget must be used within a BudgetProvider");
  return context;
}
