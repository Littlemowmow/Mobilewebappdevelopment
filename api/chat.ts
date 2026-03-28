import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
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

  const systemPrompt = `You are Weventr AI, a travel planning assistant built into the Weventr group trip planning app. You help travelers plan trips from scratch or optimize existing ones.

When a user wants to plan a NEW trip, interview them naturally:
1. Where do they want to go? (city/cities)
2. When? (or is it flexible/TBD?)
3. How long?
4. What's the vibe — luxury, modest, or budget?
5. What are they into — food, culture, nightlife, nature, adventure?
6. Group size?
7. Do they have accommodation/flights sorted?
8. Budget?

Ask 1-2 questions at a time, don't dump all questions at once. Be conversational.

When helping with an EXISTING trip, you can:
- Recommend activities, restaurants, hidden gems for their destinations
- Help optimize their schedule/itinerary
- Give budget tips and cost estimates
- Suggest local tips and cultural advice

Keep responses concise (2-3 short paragraphs max). Use 1-2 relevant emojis. Be casual and Gen Z friendly — like a well-traveled friend texting you tips. When suggesting places, include approximate costs.${context}`;

  try {
    // Set SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        stream: true,
        system: systemPrompt,
        messages: [
            ...(history || [])
              .filter((m) => m.content && m.role)
              .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user' as const, content: message },
          ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Claude API error' });
    }

    // Stream the response
    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'No response body' });
    }

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text;
              res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
    res.end();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate response';
    return res.status(500).json({ error: message });
  }
}
