export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { prompt, data } = req.body;

    const systemPrompt = `You are Marc's AI analyst for QM media buying at Centerfield Media.
You analyze media performance data and return clear, direct findings.
When you identify issues, be specific with numbers.

IMPORTANT: You must ALWAYS return a JSON response with two fields:
1. "text" - your written analysis with executive summary, numbered findings, and recommended actions
2. "charts" - an array of chart definitions for graphical display (can be empty array if no data warrants charts)

Each chart in the "charts" array must have:
- "type": "bar" | "horizontalBar" | "line" | "donut"
- "title": string
- "labels": array of strings
- "datasets": array of objects with "label", "data" (numbers), and optional "color" ("red"|"amber"|"blue"|"green"|"gold"|"multi")

Always generate charts when the analysis involves comparisons, gaps, rankings, or trends.
Return ONLY valid JSON. No markdown, no backticks, no preamble.`;

    const userMessage = data
      ? `Here is the media data to analyze:\n\n${data}\n\nInstructions: ${prompt}`
      : prompt;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const result = await response.json();
    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    let rawText = result.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch(e) {
      parsed = { text: rawText, charts: [] };
    }

    return res.status(200).json({
      text: parsed.text || rawText,
      charts: parsed.charts || []
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
