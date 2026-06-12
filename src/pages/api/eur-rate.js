export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://www.nbs.rs/kursna-lista/v2/today.xml',
      { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/xml' }, next: { revalidate: 3600 } }
    );
    if (!response.ok) throw new Error('NBS not reachable');
    const xml = await response.text();
    // NBS XML has <SrednjiKurs> inside <Stavka> with <Oznaka>EUR</Oznaka>
    const eurBlock = xml.match(/<Stavka>[\s\S]*?<Oznaka>EUR<\/Oznaka>[\s\S]*?<\/Stavka>/i)?.[0] || '';
    const raw = eurBlock.match(/<SrednjiKurs>([\d.,]+)<\/SrednjiKurs>/i)?.[1];
    const rate = parseFloat((raw || '').replace(',', '.'));
    if (!rate || isNaN(rate)) throw new Error('Parse failed');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    res.json({ rate, source: 'NBS', date: new Date().toISOString().split('T')[0] });
  } catch {
    // Fallback: open.er-api.com (no key needed, has RSD)
    try {
      const r2 = await fetch('https://open.er-api.com/v6/latest/EUR');
      const data = await r2.json();
      const rate = data?.rates?.RSD;
      if (!rate) throw new Error('No RSD rate');
      res.json({ rate: parseFloat(rate.toFixed(4)), source: 'open.er-api.com', date: new Date().toISOString().split('T')[0] });
    } catch (err2) {
      res.status(503).json({ error: 'Could not fetch EUR rate', detail: err2.message });
    }
  }
}
