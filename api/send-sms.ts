import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { number, content, sendStyle } = req.body;

  if (!number || !content) {
    return res.status(400).json({ error: 'Missing number or content' });
  }

  const apiKey = process.env.SENDBLUE_API_KEY;
  const apiSecret = process.env.SENDBLUE_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('Sendblue API keys not configured');
    return res.status(500).json({ error: 'SMS service not configured' });
  }

  try {
    const response = await fetch('https://api.sendblue.co/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sb-api-key-id': apiKey,
        'sb-api-secret-key': apiSecret,
      },
      body: JSON.stringify({
        number,
        content,
        send_style: sendStyle || 'celebration',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Sendblue error:', data);
      return res.status(response.status).json({ error: data.message || 'Failed to send' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('SMS send error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
