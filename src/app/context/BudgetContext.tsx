import { createContext, useContext, ReactNode } from "react";

interface Transaction {
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

interface CategoryData {
  category: string;
  spent: number;
  budget: number;
  iconBg: string;
  emoji: string;
  barColor: string;
}

interface DestinationData {
  city: string;
  flag: string;
  spent: number;
  budget: number;
}

interface BudgetData {
  total: number;
  spent: number;
  categories: CategoryData[];
  destinations: DestinationData[];
  transactions: Transaction[];
}

interface BudgetContextType {
  budgetData: BudgetData;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const mockBudgetData: BudgetData = {
  total: 3500,
  spent: 2847,
  categories: [
    {
      category: "Food & Drinks",
      spent: 1245,
      budget: 1400,
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
      barColor: "bg-orange-500",
    },
    {
      category: "Activities",
      spent: 485,
      budget: 800,
      iconBg: "bg-teal-50 dark:bg-teal-900/30",
      emoji: "🎭",
      barColor: "bg-teal-500",
    },
    {
      category: "Transportation",
      spent: 687,
      budget: 600,
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
      emoji: "🚆",
      barColor: "bg-blue-500",
    },
    {
      category: "Shopping",
      spent: 230,
      budget: 400,
      iconBg: "bg-pink-50 dark:bg-pink-900/30",
      emoji: "🛍️",
      barColor: "bg-pink-500",
    },
    {
      category: "Accommodation",
      spent: 200,
      budget: 300,
      iconBg: "bg-purple-50 dark:bg-purple-900/30",
      emoji: "🏨",
      barColor: "bg-purple-500",
    },
  ],
  destinations: [
    {
      city: "Barcelona",
      flag: "🇪🇸",
      spent: 1520,
      budget: 1600,
    },
    {
      city: "Madrid",
      flag: "🇪🇸",
      spent: 865,
      budget: 1100,
    },
    {
      city: "Lisbon",
      flag: "🇵🇹",
      spent: 462,
      budget: 800,
    },
  ],
  transactions: [
    {
      id: 1,
      title: "Fado Night in Alfama",
      category: "Activities",
      amount: 45,
      paidBy: "Helena",
      city: "Lisbon",
      date: "Jun 22",
      iconBg: "bg-teal-50 dark:bg-teal-900/30",
      emoji: "🎭",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 2,
      title: "Time Out Market",
      category: "Food & Drinks",
      amount: 28,
      paidBy: "Sara",
      city: "Lisbon",
      date: "Jun 22",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
      splitWith: ["Helena", "Sara"],
    },
    {
      id: 3,
      title: "Tram 28 Tickets",
      category: "Transportation",
      amount: 12,
      paidBy: "Zara",
      city: "Lisbon",
      date: "Jun 21",
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
      emoji: "🚆",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 4,
      title: "Pastéis de Belém",
      category: "Food & Drinks",
      amount: 6,
      paidBy: "Alex",
      city: "Lisbon",
      date: "Jun 21",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
    },
    {
      id: 5,
      title: "Train to Lisbon",
      category: "Transportation",
      amount: 120,
      paidBy: "Helena",
      city: "Madrid",
      date: "Jun 20",
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
      emoji: "🚆",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 6,
      title: "Mercado de San Miguel",
      category: "Food & Drinks",
      amount: 30,
      paidBy: "Sara",
      city: "Madrid",
      date: "Jun 20",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
      splitWith: ["Helena", "Sara", "Zara"],
    },
    {
      id: 7,
      title: "Royal Palace Tour",
      category: "Activities",
      amount: 52,
      paidBy: "Zara",
      city: "Madrid",
      date: "Jun 20",
      iconBg: "bg-teal-50 dark:bg-teal-900/30",
      emoji: "🎭",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 8,
      title: "Sobrino de Botín Dinner",
      category: "Food & Drinks",
      amount: 260,
      paidBy: "Alex",
      city: "Madrid",
      date: "Jun 19",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 9,
      title: "Prado Museum",
      category: "Activities",
      amount: 60,
      paidBy: "Helena",
      city: "Madrid",
      date: "Jun 19",
      iconBg: "bg-teal-50 dark:bg-teal-900/30",
      emoji: "🎭",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 10,
      title: "Churros at San Ginés",
      category: "Food & Drinks",
      amount: 32,
      paidBy: "Sara",
      city: "Madrid",
      date: "Jun 19",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 11,
      title: "Train to Madrid",
      category: "Transportation",
      amount: 340,
      paidBy: "Helena",
      city: "Barcelona",
      date: "Jun 18",
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
      emoji: "🚆",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 12,
      title: "Flamenco Show",
      category: "Activities",
      amount: 220,
      paidBy: "Zara",
      city: "Barcelona",
      date: "Jun 17",
      iconBg: "bg-teal-50 dark:bg-teal-900/30",
      emoji: "🎭",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 13,
      title: "La Boqueria Market",
      category: "Food & Drinks",
      amount: 100,
      paidBy: "Sara",
      city: "Barcelona",
      date: "Jun 17",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 14,
      title: "Souvenirs at Gothic Quarter",
      category: "Shopping",
      amount: 85,
      paidBy: "Alex",
      city: "Barcelona",
      date: "Jun 17",
      iconBg: "bg-pink-50 dark:bg-pink-900/30",
      emoji: "🛍️",
    },
    {
      id: 15,
      title: "Cervecería Catalana",
      category: "Food & Drinks",
      amount: 168,
      paidBy: "Helena",
      city: "Barcelona",
      date: "Jun 16",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 16,
      title: "Sagrada Familia Tickets",
      category: "Activities",
      amount: 104,
      paidBy: "Sara",
      city: "Barcelona",
      date: "Jun 16",
      iconBg: "bg-teal-50 dark:bg-teal-900/30",
      emoji: "🎭",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 17,
      title: "Park Güell Entry",
      category: "Activities",
      amount: 52,
      paidBy: "Zara",
      city: "Barcelona",
      date: "Jun 16",
      iconBg: "bg-teal-50 dark:bg-teal-900/30",
      emoji: "🎭",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 18,
      title: "Federal Café Brunch",
      category: "Food & Drinks",
      amount: 72,
      paidBy: "Alex",
      city: "Barcelona",
      date: "Jun 16",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 19,
      title: "Cañete Tapas",
      category: "Food & Drinks",
      amount: 140,
      paidBy: "Helena",
      city: "Barcelona",
      date: "Jun 15",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      emoji: "🍽️",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
    {
      id: 20,
      title: "Airbnb (4 nights)",
      category: "Accommodation",
      amount: 200,
      paidBy: "Sara",
      city: "Barcelona",
      date: "Jun 15",
      iconBg: "bg-purple-50 dark:bg-purple-900/30",
      emoji: "🏨",
      splitWith: ["Helena", "Sara", "Zara", "Alex"],
    },
  ],
};

export function BudgetProvider({ children }: { children: ReactNode }) {
  return (
    <BudgetContext.Provider value={{ budgetData: mockBudgetData }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
}
