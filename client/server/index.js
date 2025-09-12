require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8787;

// Only allow Vite dev on localhost:5174 (adjust as needed)
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5174';
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Token minting: create realtime session using server OPENAI_API_KEY
app.get('/api/voice/token', async (req, res) => {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

    const body = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
      modalities: ['audio','text'],
      instructions: 'You are a friendly college counselor. Speak simply (9th-grade). Ask one ApplyTexas question at a time and wait for the student to answer.'
    };

    const r = await axios.post('https://api.openai.com/v1/realtime/sessions', body, {
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    // Return the full session object to the client (no PII involved)
    res.json(r.data);
  } catch (err) {
    console.error('token error', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create token' });
  }
});

// SDP proxy: accept client's local SDP offer and forward to OpenAI Realtime
app.post('/api/voice/offer', async (req, res) => {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

    const { sdp } = req.body || {};
    if (!sdp) return res.status(400).json({ error: 'Missing sdp' });

    const url = 'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
    const r = await axios.post(url, sdp, {
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/sdp' },
      responseType: 'text'
    });

    res.json({ sdp: r.data, type: 'answer' });
  } catch (err) {
    console.error('offer proxy error', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to proxy offer' });
  }
});

app.listen(PORT, () => console.log(`Voice backend listening on http://localhost:${PORT} (CORS: ${corsOrigin})`));
// Main Express server for local API proxying

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = express();
const PORT = process.env.PORT || 5177;

app.use(cors());
app.use(express.json());

// Mount career routes (canonical path `/api/careers/careeronestop/*`)
const careerRoutes = require('./career-routes');
app.use('/api/careers/careeronestop', careerRoutes);
// Backwards-compatible mount for legacy/misspelled frontend calls
app.use('/api/careers/careeronestoap', careerRoutes);

// Colleges local data
const collegesRoutes = require('./colleges-routes');
app.use('/api/colleges', collegesRoutes);

// Serve static files (for production build, if needed)
app.use(express.static(path.join(__dirname, '../dist')));

app.listen(PORT, () => {
  console.log(`API Proxy server running on http://localhost:${PORT}`);
});
