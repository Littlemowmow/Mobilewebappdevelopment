import type { VercelRequest, VercelResponse } from '@vercel/node';

// AI Travel Companion — generates contextual trip messages via Claude
// Called on a schedule or triggered by events (activity approved, day of trip, etc.)

interface CompanionRequest {
  type: 'morning_briefing' | 'weather_alert' | 'activity_reminder' | 'budget_check' | 'custom';
  phone: string;
  tripName: string;
  city: string;
  activities?: string[];  // today's scheduled activities
  budgetSpent?: number;
  budgetTotal?: number;
  customPrompt?: string;
}

async function getWeather(city: string): Promise<{ temp: number; condition: string; icon: string } | null> {
  try {
    // Free weather API — no key needed
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1`
    );
    const data = await res.json();
    const current = data.current_condition?.[0];
    if (!current) return null;
    const temp = Math.round(parseInt(current.temp_F));
    const desc = current.weatherDesc?.[0]?.value || 'Unknown';
    const isRainy = desc.toLowerCase().includes('rain') || desc.toLowerCase().includes('shower') || desc.toLowerCase().includes('drizzle');
    const isSunny = desc.toLowerCase().includes('sunny') || desc.toLowerCase().includes('clear');
    const icon = isRainy ? '🌧️' : isSunny ? '☀️' : '⛅';
    return { temp, condition: desc, icon };
  } catch {
    return null;
  }
}

async function generateWithClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Claude API error');
  return data.content[0].text;
}

async function sendViaSendblue(phone: string, content: string): Promise<void> {
  const apiKey = process.env.SENDBLUE_API_KEY;
  const apiSecret = process.env.SENDBLUE_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error('Sendblue not configured');

  await fetch('https://api.sendblue.co/api/send-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'sb-api-key-id': apiKey,
      'sb-api-secret-key': apiSecret,
    },
    body: JSON.stringify({ number: phone, content, send_style: 'invisible' }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as CompanionRequest;
  const { type, phone, tripName, city, activities, budgetSpent, budgetTotal, customPrompt } = body;

  if (!phone || !tripName || !city) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const weather = await getWeather(city);
    const weatherStr = weather
      ? `${weather.icon} ${weather.temp}°F, ${weather.condition}`
      : 'Weather unavailable';

    const systemPrompt = `You are Weventr, a friendly AI travel companion. You send short, helpful iMessages to travelers during their trips. Keep messages under 160 characters when possible, max 280. Use 1-2 relevant emojis. Be casual, warm, and genuinely helpful — like a well-traveled friend texting you tips. Never be corporate or robotic. If suggesting changes to plans, frame it as a question not a command.`;

    let userPrompt = '';

    switch (type) {
      case 'morning_briefing': {
        const actList = activities?.length ? activities.join(', ') : 'nothing scheduled yet';
        userPrompt = `Generate a morning briefing text for someone in ${city}. Weather: ${weatherStr}. Today's activities: ${actList}. Trip: "${tripName}". Keep it brief and exciting.`;
        break;
      }
      case 'weather_alert': {
        userPrompt = `The weather in ${city} is: ${weatherStr}. The traveler has these activities today: ${activities?.join(', ') || 'various outdoor activities'}. If the weather might affect plans, suggest an alternative. If weather is fine, give a quick encouraging note. Trip: "${tripName}".`;
        break;
      }
      case 'activity_reminder': {
        const nextActivity = activities?.[0] || 'your next activity';
        userPrompt = `Remind the traveler about "${nextActivity}" coming up in ${city}. Give a quick helpful tip about it (what to bring, what to expect, local secret). Trip: "${tripName}". Weather: ${weatherStr}.`;
        break;
      }
      case 'budget_check': {
        const spent = budgetSpent || 0;
        const total = budgetTotal || 0;
        const pct = total > 0 ? Math.round((spent / total) * 100) : 0;
        userPrompt = `Give a brief budget check-in. Traveler has spent $${spent} of $${total} budget (${pct}%) in ${city}. Trip: "${tripName}". ${pct > 80 ? 'They are running low — be helpful not judgmental.' : pct < 30 ? 'They have plenty left — encourage them to enjoy.' : 'They are on track.'}`;
        break;
      }
      case 'custom': {
        userPrompt = customPrompt || `Share a fun local tip about ${city} for someone on a trip called "${tripName}". Weather: ${weatherStr}.`;
        break;
      }
    }

    const message = await generateWithClaude(systemPrompt, userPrompt);
    await sendViaSendblue(phone, message);

    return res.status(200).json({ success: true, message });
  } catch (error: any) {
    console.error('Companion error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send companion message' });
  }
}
