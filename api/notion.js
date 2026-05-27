const NOTION_DB = '25dc574b-88af-46be-81c4-777739bf44b5';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  if (!NOTION_TOKEN) return res.status(500).json({ error: 'NOTION_TOKEN not set' });

  try {
    const { title, findings, sourceFile, type, notes, date } = req.body;

    const notionBody = {
      parent: { database_id: NOTION_DB },
      icon: { type: 'emoji', emoji: '📊' },
      properties: {
        'Analysis Title': { title: [{ text: { content: title || 'Untitled' } }] },
        'Type': { select: { name: type || 'Manual Query' } },
        'Status': { select: { name: 'New' } },
        'Source File': { rich_text: [{ text: { content: sourceFile || '' } }] },
        'Findings': { rich_text: [{ text: { content: (findings || '').slice(0, 2000) } }] },
        'Griff Notes': { rich_text: [{ text: { content: (notes || '').slice(0, 2000) } }] },
        'Date': { date: { start: date || new Date().toISOString().split('T')[0] } }
      }
    };

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionBody)
    });

    const data = await notionRes.json();
    if (!notionRes.ok) return res.status(notionRes.status).json({ error: data.message });
    return res.status(200).json({ success: true, url: data.url, id: data.id });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
