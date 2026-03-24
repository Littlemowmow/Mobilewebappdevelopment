const API_URL = '/api/trip-companion';

interface CompanionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function sendMorningBriefing(
  phone: string,
  tripName: string,
  city: string,
  activities: string[]
): Promise<CompanionResult> {
  return callCompanion({
    type: 'morning_briefing',
    phone, tripName, city, activities,
  });
}

export async function sendWeatherAlert(
  phone: string,
  tripName: string,
  city: string,
  activities: string[]
): Promise<CompanionResult> {
  return callCompanion({
    type: 'weather_alert',
    phone, tripName, city, activities,
  });
}

export async function sendActivityReminder(
  phone: string,
  tripName: string,
  city: string,
  activityName: string
): Promise<CompanionResult> {
  return callCompanion({
    type: 'activity_reminder',
    phone, tripName, city, activities: [activityName],
  });
}

export async function sendBudgetCheck(
  phone: string,
  tripName: string,
  city: string,
  spent: number,
  total: number
): Promise<CompanionResult> {
  return callCompanion({
    type: 'budget_check',
    phone, tripName, city, budgetSpent: spent, budgetTotal: total,
  });
}

export async function sendCustomTip(
  phone: string,
  tripName: string,
  city: string,
  prompt: string
): Promise<CompanionResult> {
  return callCompanion({
    type: 'custom',
    phone, tripName, city, customPrompt: prompt,
  });
}

async function callCompanion(body: Record<string, unknown>): Promise<CompanionResult> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, message: data.message };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
