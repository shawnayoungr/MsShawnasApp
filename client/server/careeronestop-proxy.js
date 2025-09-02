// Express proxy for CareerOneStop API (canonical)
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const router = express.Router();

const BASE_URL = 'https://api.careeronestop.org';
const TOKEN = process.env.CAREERONESTOP_TOKEN;
const USER_ID = process.env.CAREERONESTOP_USER_ID;

// Startup sanity logs (mask token for safety)
(() => {
  const mask = (t) => {
    if (!t) return null;
    try { return `${t.slice(0,4)}...${t.slice(-4)}`; } catch { return '****'; }
  };
  console.log(`[CareerOneStop Proxy] BASE_URL=${BASE_URL}`);
  console.log(`[CareerOneStop Proxy] USER_ID=${USER_ID ? USER_ID : 'MISSING'}`);
  console.log(`[CareerOneStop Proxy] TOKEN loaded?=${!!TOKEN} tokenHint=${mask(TOKEN)}`);
})();

// Proxy endpoint: /api/careeronestop/<endpoint path>?query=...
// Accept multi-segment endpoint paths like 'occupation/keywordsearch'
router.get('/*', async (req, res) => {
  const endpoint = req.params[0];
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query' });
  try {
    const url = `${BASE_URL}/v1/${endpoint}/${USER_ID}/${encodeURIComponent(query)}`;
    console.log(`[CareerOneStop Proxy] GET ${url}`);
    const apiRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json',
      },
    });
    let text = await apiRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!apiRes.ok) {
      console.error(`[CareerOneStop Proxy] Error ${apiRes.status}:`, data);
      if (apiRes.status === 401) {
        // Mask token for safe debugging
        const mask = (t) => {
          if (!t) return null;
          try { return `${t.slice(0,4)}...${t.slice(-4)}`; } catch { return '****'; }
        };
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Upstream CareerOneStop API returned 401 Unauthorized. Verify CAREERONESTOP_USER_ID and CAREERONESTOP_TOKEN in server/.env.',
          tokenHint: mask(TOKEN),
          details: data
        });
      }
      return res.status(apiRes.status).json({ error: 'CareerOneStop error', status: apiRes.status, details: data });
    }
    res.json(data);
  } catch (err) {
    console.error('[CareerOneStop Proxy] Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

module.exports = router;
