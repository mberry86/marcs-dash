export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { format, title, findings, notes, date } = req.body;
    if (format === 'csv') {
      const lines = ['"Marc\'s Dash Export"', `"Title","${title}"`, `"Date","${date}"`, '""', '"Findings"`,
        ...findings.split('\n').map(l => `"${l.replace(/"/g,'""')}"`),
        '""', '"Notes"',
        ...(notes||'').split('\n').map(l => `"${l.replace(/"/g,'""')}"`)
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/[^a-z0-9]/gi,'_')}.csv"`);
      return res.status(200).send(lines.join('\n'));
    }
    return res.status(200).json({ message: 'Handled client-side' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
