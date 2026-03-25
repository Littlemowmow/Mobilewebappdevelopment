import { createContext, useContext, useMemo, ReactNode } from "react";
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

// Demo budget data — only used for the mock "Europe Spring Break" demo trip
const DEMO_TRIP_IDS = [1, 2];

const demoBudgetData: BudgetData = {
  total: 3500, spent: 2847,
  categories: [
    { category: "Food & Drinks", spent: 1245, budget: 1400, iconBg: "bg-orange-50 dark:bg-orange-900/30", emoji: "🍽️", barColor: "bg-orange-500" },
    { category: "Activities", spent: 485, budget: 800, iconBg: "bg-teal-50 dark:bg-teal-900/30", emoji: "🎭", barColor: "bg-teal-500" },
    { category: "Transportation", spent: 687, budget: 600, iconBg: "bg-blue-50 dark:bg-blue-900/30", emoji: "🚆", barColor: "bg-blue-500" },
    { category: "Shopping", spent: 230, budget: 400, iconBg: "bg-pink-50 dark:bg-pink-900/30", emoji: "🛍️", barColor: "bg-pink-500" },
    { category: "Accommodation", spent: 200, budget: 300, iconBg: "bg-purple-50 dark:bg-purple-900/30", emoji: "🏨", barColor: "bg-purple-500" },
  ],
  destinations: [
    { city: "Barcelona", flag: "🇪🇸", spent: 1520, budget: 1600 },
    { city: "Madrid", flag: "🇪🇸", spent: 865, budget: 1100 },
    { city: "Lisbon", flag: "🇵🇹", spent: 462, budget: 800 },
  ],
  transactions: [
    { id: 1, title: "Fado Night in Alfama", category: "Activities", amount: 45, paidBy: "You", city: "Lisbon", date: "Jun 22", iconBg: "bg-teal-50 dark:bg-teal-900/30", emoji: "🎭", splitWith: ["You", "Sara", "Zara", "Alex"] },
    { id: 2, title: "Time Out Market", category: "Food & Drinks", amount: 28, paidBy: "Sara", city: "Lisbon", date: "Jun 22", iconBg: "bg-orange-50 dark:bg-orange-900/30", emoji: "🍽️", splitWith: ["You", "Sara"] },
    { id: 3, title: "Tram 28 Tickets", category: "Transportation", amount: 12, paidBy: "Zara", city: "Lisbon", date: "Jun 21", iconBg: "bg-blue-50 dark:bg-blue-900/30", emoji: "🚆", splitWith: ["You", "Sara", "Zara", "Alex"] },
    { id: 4, title: "Sagrada Familia Tickets", category: "Activities", amount: 104, paidBy: "Sara", city: "Barcelona", date: "Jun 16", iconBg: "bg-teal-50 dark:bg-teal-900/30", emoji: "🎭", splitWith: ["You", "Sara", "Zara", "Alex"] },
    { id: 5, title: "Cañete Tapas", category: "Food & Drinks", amount: 140, paidBy: "You", city: "Barcelona", date: "Jun 15", iconBg: "bg-orange-50 dark:bg-orange-900/30", emoji: "🍽️", splitWith: ["You", "Sara", "Zara", "Alex"] },
  ],
};

function createEmptyBudget(cities: { name: string; flag: string }[]): BudgetData {
  return {
    total: 0,
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

  const budgetData = useMemo(() => {
    if (!activeTrip) return createEmptyBudget([]);

    // Demo trips get the full demo data
    if (DEMO_TRIP_IDS.includes(activeTrip.id as number)) {
      return demoBudgetData;
    }

    // Real trips start with empty budget matching their cities
    return createEmptyBudget(activeTrip.cities);
  }, [activeTrip?.id, activeTrip?.cities]);

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
