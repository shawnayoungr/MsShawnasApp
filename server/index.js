require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

/**
 * GET /api/voice/token
 * Proxies a request to OpenAI Realtime Sessions endpoint and returns the session object
 * Does NOT accept or log PII. This endpoint only uses server-side OPENAI_API_KEY to mint a session.
 */
app.get('/api/voice/token', async (req, res) => {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Server not configured. Set OPENAI_API_KEY in environment.' });
    }

    // Build the body for the realtime session creation. Keep instructions short and generic.
    const body = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
      modalities: ['audio', 'text'],
      instructions: 'You are a friendly college counselor. Speak simply (about 9th-grade reading level). Ask one ApplyTexas-style question at a time and wait for the student to answer. If confused, re-explain once, then move on.'
    };

    const response = await axios.post('https://api.openai.com/v1/realtime/sessions', body, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Return the session object from OpenAI directly to the client.
    return res.json(response.data);
  } catch (err) {
    console.error('Error creating realtime session:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to create realtime session' });
  }
});

/**
 * POST /api/voice/offer
 * Body: { sdp: string, type?: string }
 * Proxies the SDP offer to OpenAI Realtime and returns the answer SDP.
 * Server must have OPENAI_API_KEY in environment. No PII is stored or logged.
 */
app.post('/api/voice/offer', async (req, res) => {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Server not configured. Set OPENAI_API_KEY.' });

    const { sdp } = req.body || {};
    if (!sdp) return res.status(400).json({ error: 'Missing sdp in request body.' });

    // Post the SDP to OpenAI Realtime endpoint using server API key
    const url = 'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
    const r = await axios.post(url, sdp, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp'
      },
      responseType: 'text',
      timeout: 20000
    });

    // r.data should be the SDP answer text
    return res.json({ sdp: r.data, type: 'answer' });
  } catch (err) {
    console.error('Error proxying SDP offer:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to exchange SDP with OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`Voice token server listening on http://localhost:${PORT}`);
});
