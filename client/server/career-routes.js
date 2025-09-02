const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Minimal CareerOneStop proxy router
const BASE_URL = 'https://api.careeronestop.org';
const USER_ID = process.env.CAREERONESTOP_USER_ID;
const TOKEN = process.env.CAREERONESTOP_TOKEN;
const PREPOP_PATH = path.join(__dirname, 'prepopulated-careers.json');
let PREPOP = null;
try { PREPOP = JSON.parse(fs.readFileSync(PREPOP_PATH, 'utf8')); } catch (e) { PREPOP = null; }

// PREPOP normalization: ensure fields present and consistent at load time.
// PREPOP is the single source of truth; we normalize some common keys so UI can rely on them.
function normalizePrepop(list) {
  if (!Array.isArray(list)) return list;
  return list.map(p => {
    const item = { ...p };
    if (!item.keyword && item.title) item.keyword = item.title;
    if (!item.title || item.title === 'CareerOneStop') item.title = item.keyword || item.onetTitle || item.title;
    if (!item.onetTitle || item.onetTitle === 'CareerOneStop') item.onetTitle = item.keyword || item.title;
    if (!Object.prototype.hasOwnProperty.call(item, 'medianWage')) item.medianWage = null;
    return item;
  });
}

function mask(token) {
  if (!token) return 'MISSING';
  return token.slice(0, 4) + '...' + token.slice(-4);
}

// (Telemetry and upstream telemetry capture removed for LOCAL-ONLY mode)

// Simple in-memory TTL cache (Map)
const CACHE = new Map();
function cacheGet(key) {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    CACHE.delete(key);
    return null;
  }
  return entry.val;
}
function cacheSet(key, val, ttl = 1000 * 60 * 60) { // default 1 hour
  CACHE.set(key, { val, exp: Date.now() + ttl });
}

// (Upstream fetch helpers removed in LOCAL-ONLY mode)

// (Web-scrape fallback removed in LOCAL-ONLY mode)


router.use((req, res, next) => {
  // basic health / logging for visibility
  console.log(`[Career Router] ${req.method} ${req.originalUrl}`);
  next();
});

// Normalize PREPOP contents so UI and API handlers can rely on consistent fields
try {
  if (PREPOP && Array.isArray(PREPOP)) PREPOP = normalizePrepop(PREPOP);
} catch (e) { console.warn('[Career Router] prepop normalization failed', e); }

if (false) {
  // Intentionally disabled. Server will run in LOCAL-ONLY mode and serve PREPOP as authoritative.
  router.get('*', (req, res) => {
    res.status(501).json({ error: 'Upstream CareerOneStop access disabled in LOCAL-ONLY mode.' });
  });
} else {
  // Search occupations by keyword (LOCAL ONLY)
  router.get('/search/:query', async (req, res) => {
    try {
      const q = (req.params.query || '').trim().toLowerCase();
      if (!q) return res.json([]);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '12', 10) || 12));
      if (PREPOP) {
        const hits = PREPOP.filter(p => {
          const title = (p.onetTitle || p.title || p.keyword || '').toLowerCase();
          return title.includes(q) || (p.keyword || '').toLowerCase().includes(q);
        });
        const mapped = hits.map(o => ({
          id: o.onetCode || o.onetTitle || o.keyword || o.title,
          title: o.onetTitle || o.title || o.keyword || '',
          description: o.onetDescription || o.description || '',
          onetCode: o.onetCode || '',
          detailsUrl: `/api/careers/careeronestop/details/onet/${encodeURIComponent(o.onetCode)}`,
          salaryUrl: `/api/careers/careeronestop/salary/${encodeURIComponent(o.onetCode)}`
        }));
        return res.json(mapped.slice(0, limit));
      }
      return res.json([]);
    } catch (err) { console.error('[Career Router] local search error', err); return res.status(500).json({ error: 'search failed' }); }
  });

  // Simple health check for dev/UI
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', user: USER_ID ? true : false });
  });

  // Serve prepopulated/local careers to the client
  router.get('/local', (req, res) => {
    try {
      return res.json(PREPOP || []);
    } catch (e) {
      return res.status(500).json({ error: 'failed to read prepop' });
    }
  });

  // Serve prepopulated/local careers to the client
  router.get('/local', (req, res) => {
    try {
      return res.json(PREPOP || []);
    } catch (e) {
      return res.status(500).json({ error: 'failed to read prepop' });
    }
  });

  // Admin: missing-fields check disabled — PREPOP is authoritative. Return empty list.
  router.get('/local/missing', (req, res) => {
    return res.json([]);
  });

  // Lookup single prepop career by keyword or onet code
  router.get('/local/:key', (req, res) => {
    const key = (req.params.key || '').toLowerCase();
    if (!PREPOP) return res.status(404).json({ error: 'no prepop available' });
    const found = PREPOP.find(p => ((p.onetCode||p.title||p.keyword||'').toLowerCase() === key) || ((p.title||'').toLowerCase().includes(key)) || ((p.keyword||'').toLowerCase().includes(key)) );
    if (!found) return res.status(404).json({ error: 'not found' });
    return res.json(found);
  });

  // Resolve a generic keyword to suggestions using PREPOP only
  router.get('/resolve/:keyword', async (req, res) => {
    const k = (req.params.keyword || '').toLowerCase();
    const heuristics = {
      'teacher': '25-0000.00',
      'nurse': '29-1141.00',
      'engineer': '17-0000.00',
      'doctor': '29-1069.00'
    };
    if (heuristics[k]) return res.json({ suggestions: [{ onet: heuristics[k], title: null, source: 'heuristic' }], query: k, source: 'heuristic' });
    try {
      if (PREPOP) {
        const found = PREPOP.filter(p => ((p.onetTitle||p.title||p.keyword||'').toLowerCase().includes(k)) || ((p.keyword||'').toLowerCase().includes(k))).slice(0,6).map(p => ({ onet: p.onetCode || null, title: p.onetTitle || p.title || p.keyword || null, source: 'prepop' }));
        return res.json({ suggestions: found, query: k, source: 'prepop' });
      }
    } catch (e) { console.error('[Career Router] resolve error', e); }
    return res.json({ suggestions: [], query: k, source: 'none' });
  });

  // Get occupation details by keyword (LOCAL ONLY - serve fields from PREPOP)
  router.get('/details/:keyword', async (req, res) => {
    const keyword = (req.params.keyword || '').toLowerCase();
    try {
      if (!PREPOP) return res.status(404).json({ error: 'no prepop available' });
      const p = PREPOP.find(x => ((x.onetCode||x.title||x.keyword||'').toLowerCase() === keyword) || ((x.title||'').toLowerCase().includes(keyword)) || ((x.keyword||'').toLowerCase().includes(keyword)) );
      if (!p) return res.status(404).json({ error: 'not found' });
      const career = {
        onetTitle: p.onetTitle || p.title,
        onetCode: p.onetCode || null,
        onetDescription: p.onetDescription || p.description || '',
        educationLevel: p.educationLevel || p.education || null,
        educationCode: p.educationCode || null,
        skills: p.skills || [],
        tasks: p.tasks || [],
        alternateTitles: p.alternateTitles || [],
        wages: p.wages || (p.medianWage ? { national: { Median: p.medianWage } } : { national: null }),
        cosVideoUrl: p.careerVideoUrl || null,
        dataSourceName: p.dataSource || p.dataSourceName || null,
        dataSourceUrl: p.sourceUrl || null
      };
      return res.json(career);
    } catch (err) { console.error('[Career Router] local details error', err); res.status(500).json({ error: 'details failed' }); }
  });

  // Fetch details by ONET code (LOCAL ONLY)
  router.get('/details/onet/:code', async (req, res) => {
    const code = (req.params.code || '').toLowerCase();
    if (!code) return res.status(400).json({ error: 'missing onet code' });
    try {
      if (!PREPOP) return res.status(404).json({ error: 'no prepop available' });
      const p = PREPOP.find(x => ((x.onetCode || x.onetcode || '') + '').toLowerCase() === (code + '').toLowerCase());
      if (!p) return res.status(404).json({ error: 'not found' });
      return res.json({
        onetTitle: p.onetTitle || p.title,
        onetCode: p.onetCode,
        onetDescription: p.onetDescription || p.description || '',
        educationLevel: p.educationLevel || p.education || null,
        educationCode: p.educationCode || null,
        skills: p.skills || [],
        tasks: p.tasks || [],
        alternateTitles: p.alternateTitles || [],
        wages: p.wages || (p.medianWage ? { national: { Median: p.medianWage } } : { national: null }),
        cosVideoUrl: p.careerVideoUrl || null,
        dataSourceName: p.dataSourceName || null,
        dataSourceUrl: p.sourceUrl || null,
        dataLastUpdate: p.dataLastUpdate || null,
        dataSourceCitation: p.dataSourceCitation || null
      });
    } catch (err) { console.error('[Career Router] local onet details error', err); res.status(500).json({ error: 'details failed' }); }
  });

  // Salary endpoint (LOCAL ONLY) — read from PREPOP if available
  router.get('/salary/:keyword', async (req, res) => {
    const keyword = (req.params.keyword || '').toLowerCase();
    try {
      if (!PREPOP) return res.status(404).json({ error: 'no prepop available' });
      const p = PREPOP.find(x => ((x.onetCode||x.title||x.keyword||'').toLowerCase() === keyword) || ((x.title||'').toLowerCase().includes(keyword)) || ((x.keyword||'').toLowerCase().includes(keyword)) );
      if (!p) return res.status(404).json({ error: 'not found' });
      const median = p.medianWage || (p.wages && p.wages.national && p.wages.national.Median) || null;
      return res.json({ median, raw: p });
    } catch (err) { console.error('[Career Router] local salary error', err); res.status(500).json({ error: 'salary failed' }); }
  });

  // clusters endpoint: small curated list
  router.get('/clusters', (req, res) => {
    res.json([
      { name: 'Healthcare', code: '08' },
      { name: 'Information Technology', code: '11' },
      { name: 'Business & Finance', code: '04' },
      { name: 'Engineering', code: '21' }
    ]);
  });

  // Admin endpoint: enrichment disabled in local-only mode
  router.post('/admin/enrich', async (req, res) => {
    return res.status(403).json({ status: 'disabled', message: 'enrichment disabled. PREPOP is authoritative.' });
  });

  console.log('[Career Router] mounted in LOCAL-ONLY mode. PREPOP is authoritative. Upstream enrichment and fallbacks are disabled.');
  module.exports = router;
}
