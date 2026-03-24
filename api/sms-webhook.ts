import type { VercelRequest, VercelResponse } from '@vercel/node';

// Webhook for incoming Sendblue messages — when users reply to Weventr texts
// Sendblue POSTs here when a user sends a message back
// We use Claude to generate a smart reply based on their trip context

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { number, content, media_url } = req.body;

  if (!number || !content) {
    return res.status(200).json({ ok: true }); // Sendblue expects 200
  }

  console.log(`Incoming message from ${number}: ${content}`);

  try {
    // Generate a smart reply using Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return res.status(200).json({ ok: true });
    }

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 280,
        system: `You are Weventr, a friendly AI travel companion that communicates via iMessage. You help travelers with their trips — answering questions about activities, food, directions, local tips, and schedule changes. Keep responses SHORT (under 200 characters ideally, max 280). Use 1-2 emojis. Be casual and helpful like a friend who knows the city well. If you don't know something specific, give general helpful advice. Never say you're an AI — you're just Weventr, the travel buddy.`,
        messages: [{ role: 'user', content: `A traveler texted: "${content}"\n\nReply helpfully.` }],
      }),
    });

    const data = await claudeRes.json();
    const reply = data.content?.[0]?.text;

    if (reply) {
      // Send reply back via Sendblue
      const sbKey = process.env.SENDBLUE_API_KEY;
      const sbSecret = process.env.SENDBLUE_API_SECRET;

      if (sbKey && sbSecret) {
        await fetch('https://api.sendblue.co/api/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'sb-api-key-id': sbKey,
            'sb-api-secret-key': sbSecret,
          },
          body: JSON.stringify({
            number,
            content: reply,
            send_style: 'invisible',
          }),
        });
        console.log(`Replied to ${number}: ${reply}`);
      }
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }

  // Always return 200 to Sendblue
  return res.status(200).json({ ok: true });
}
