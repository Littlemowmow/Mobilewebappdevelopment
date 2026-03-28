import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { message, tripContext, history } = req.body as {
    message: string;
    tripContext?: {
      tripName?: string;
      cities?: string[];
      dates?: string;
      vibe?: string;
      interests?: string[];
      budget?: number;
      groupSize?: number;
    };
    history?: { role: string; content: string }[];
  };

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Build context string from trip data
  let context = '';
  if (tripContext) {
    const parts: string[] = [];
    if (tripContext.tripName) parts.push(`Trip: "${tripContext.tripName}"`);
    if (tripContext.cities?.length) parts.push(`Cities: ${tripContext.cities.join(', ')}`);
    if (tripContext.dates) parts.push(`Dates: ${tripContext.dates}`);
    if (tripContext.vibe) parts.push(`Vibe: ${tripContext.vibe}`);
    if (tripContext.interests?.length) parts.push(`Interests: ${tripContext.interests.join(', ')}`);
    if (tripContext.budget) parts.push(`Budget: $${tripContext.budget}`);
    if (tripContext.groupSize) parts.push(`Group size: ${tripContext.groupSize}`);
    if (parts.length) context = `\n\nCurrent trip context:\n${parts.join('\n')}`;
  }

  const systemInstruction = `You are Weventr AI, a travel planning assistant built into the Weventr group trip planning app. You help travelers plan trips from scratch or optimize existing ones.

Keep responses concise (2-3 short paragraphs max). Use 1-2 relevant emojis. Be casual and Gen Z friendly — like a well-traveled friend texting you tips. When suggesting places, include approximate costs.${context}`;

  try {
    // Build Gemini messages format
    const contents: { role: string; parts: { text: string }[] }[] = [];

    // Add history
    if (history?.length) {
      for (const msg of history) {
        if (msg.content && msg.role) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    // Add current message
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.8,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = err.error?.message || `Gemini API error (${response.status})`;
      return res.status(response.status).json({ error: errMsg });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return res.status(200).json({ message: text });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Failed to generate response';
    return res.status(500).json({ error: errMsg });
  }
}
