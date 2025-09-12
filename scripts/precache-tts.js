#!/usr/bin/env node
// Pre-cache TTS for applytexas questions into client/public/tts/q-1.mp3 ... q-N.mp3
// Usage: OPENAI_API_KEY=sk-... node scripts/precache-tts.js

const fs = require('fs');
const path = require('path');
// Load OPENAI_API_KEY from client/server/.env so developers don't need to export it each time
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../client/server/.env') });
} catch (e) {
  // dotenv is optional; the client workspace should have it as a devDependency
}
const { pipeline } = require('stream');
const { promisify } = require('util');
const pump = promisify(pipeline);

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('OPENAI_API_KEY missing. Add it to client/server/.env (this file is gitignored).');
    process.exit(1);
  }

  const questionsPath = path.resolve(__dirname, '../client/src/data/applytexas-questions.json');
  const outDir = path.resolve(__dirname, '../client/public/tts');
  if (!fs.existsSync(questionsPath)) {
    console.error('Questions file not found at', questionsPath);
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const raw = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

  // compute residency anchor
  const d = new Date(); d.setFullYear(d.getFullYear() - 3);
  const anchor = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const questions = raw.map((q) => {
    const text = (q.text || '').replace(/{{residencyAnchor}}/g, anchor);
    return { id: q.id, text };
  });

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const outFile = path.join(outDir, `q-${i + 1}.mp3`);
    if (fs.existsSync(outFile)) {
      console.log('Skipping existing', outFile);
      continue;
    }

    console.log('Generating TTS for question', i + 1, q.id);
    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: 'alloy', input: q.text })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('TTS request failed for', q.id, resp.status, txt);
      continue;
    }

    const dest = fs.createWriteStream(outFile);
    await pump(await resp.body, dest);
    console.log('Saved', outFile);
  }

  console.log('Precache complete.');
}

main().catch((err) => { console.error(err); process.exit(1); });
