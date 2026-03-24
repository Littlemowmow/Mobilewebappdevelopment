const API_URL = '/api/send-sms';

interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendTripInvite(phone: string, tripName: string, tripCode: string, inviterName?: string): Promise<SendResult> {
  const joinUrl = `${window.location.origin}/join/${tripCode}`;
  const from = inviterName ? `${inviterName} invited you` : "You've been invited";
  const content = `✈️ ${from} to "${tripName}" on Weventr!\n\nJoin the trip: ${joinUrl}\n\nTrip code: ${tripCode}`;

  return sendSMS(phone, content);
}

export async function sendTripWelcome(phone: string, tripName: string, tripCode: string): Promise<SendResult> {
  const joinUrl = `${window.location.origin}/join/${tripCode}`;
  const content = `🎉 Welcome to "${tripName}" on Weventr!\n\nYour trip is being planned. Open the app to start discovering activities with your crew.\n\n${joinUrl}`;

  return sendSMS(phone, content);
}

export async function sendTripUpdate(phone: string, tripName: string, message: string): Promise<SendResult> {
  const content = `📍 ${tripName}\n\n${message}`;
  return sendSMS(phone, content, 'invisible');
}

export async function sendActivityApproved(phone: string, tripName: string, activityName: string, city: string): Promise<SendResult> {
  const content = `🎯 ${tripName}\n\nYour group approved "${activityName}" for ${city}! Open the app to see the updated schedule.`;
  return sendSMS(phone, content);
}

export async function sendTripCountdown(phone: string, tripName: string, daysLeft: number): Promise<SendResult> {
  const emoji = daysLeft <= 1 ? "🔥" : daysLeft <= 3 ? "⏰" : "📅";
  const content = `${emoji} ${daysLeft} day${daysLeft !== 1 ? 's' : ''} until ${tripName}!\n\nDon't forget to check your packing list and confirm your flights. Open the app for your full itinerary.`;
  return sendSMS(phone, content);
}

export async function sendDailyBriefing(phone: string, tripName: string, city: string, activities: string[]): Promise<SendResult> {
  const actList = activities.map((a, i) => `${i + 1}. ${a}`).join('\n');
  const content = `☀️ Good morning! Today in ${city}:\n\n${actList}\n\nHave an amazing day! Open Weventr for details.`;
  return sendSMS(phone, content, 'invisible');
}

async function sendSMS(number: string, content: string, sendStyle: string = 'celebration'): Promise<SendResult> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, content, sendStyle }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to send' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
