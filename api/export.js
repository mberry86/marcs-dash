export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { format, title, findings, charts, notes, date } = await req.json();

    if (format === 'csv') {
      // Build CSV from findings text
      const lines = ['Analysis Export - ' + title];
      lines.push('Date,' + date);
      lines.push('');
      lines.push('Findings');
      findings.split('\n').forEach(l => lines.push('"' + l.replace(/"/g, '""') + '"'));
      if (notes) {
        lines.push('');
        lines.push('Notes');
        notes.split('\n').forEach(l => lines.push('"' + l.replace(/"/g, '""') + '"'));
      }
      const csv = lines.join('\n');
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi,'_')}_${date}.csv"`
        }
      });
    }

    return new Response(JSON.stringify({ error: 'Format handled client-side' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
