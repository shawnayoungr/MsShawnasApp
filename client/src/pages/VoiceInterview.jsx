import React, { useEffect, useMemo, useState, useRef } from 'react';
import questionsData from '../data/applytexas-questions.json';
import useRealtimeVoice from '../hooks/useRealtimeVoice';
import { useNavigate } from 'react-router-dom';

function formatResidencyAnchor() {
  // Replace {{residencyAnchor}} with a friendly date ~3 years ago
  const d = new Date();
  d.setFullYear(d.getFullYear() - 3);
  const opts = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString(undefined, opts);
}

function autoCapitalizeName(s = '') {
  return s
    .split(' ')
    .map((part) =>
      part
        .split('-')
        .map((p) => (p.length ? p[0].toLocaleUpperCase() + p.slice(1) : p))
        .join('-')
    )
    .join(' ');
}

export default function VoiceInterview() {
  const navigate = useNavigate();
  const ttsBase = '/tts'; // public/tts/q-#.mp3
  const total = questionsData.length;
  const [idx, setIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState(() => {
    try {
      const raw = localStorage.getItem('voiceAnswers');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  const [editingField, setEditingField] = useState(null);
  const [multiselectOpen, setMultiselectOpen] = useState(false);

  const { start, stop, speak, listening, transcript } = useRealtimeVoice();
  const audioRef = useRef(null);

  // Prepare questions with residency anchor substitution
  const questions = useMemo(() => {
    const anchor = formatResidencyAnchor();
    return questionsData.map((q) => {
      if (typeof q.text === 'string' && q.text.includes('{{residencyAnchor}}')) {
        return { ...q, text: q.text.replace(/{{residencyAnchor}}/g, anchor) };
      }
      return q;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('voiceAnswers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    // keep transcript populated into current answer for convenience (live update)
    if (listening && transcript) {
      setAnswers((a) => ({ ...a, [questions[idx].id]: transcript }));
    }
  }, [transcript, listening, idx, questions]);

  const playPrecached = async (questionNumber) => {
    const file = `${ttsBase}/q-${questionNumber}.mp3`;
    try {
      // quick check if file exists
      const res = await fetch(file, { method: 'HEAD' });
      if (res.ok) {
        if (audioRef.current) { audioRef.current.pause(); }
        audioRef.current = new Audio(file);
        audioRef.current.play();
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  };

  const handleRepeat = async () => {
    const qNum = idx + 1;
    const played = await playPrecached(qNum);
    if (!played) speak(questions[idx].text);
  };

  const handleStart = async () => {
    // Speak intro then start the hook
    speak('This prepares you for ApplyTexas — you are not applying yet. Press the microphone and answer when ready.');
    await start();
    setStarted(true);
  };

  const handleToggleMic = () => {
    if (listening) stop();
    else start();
  };

  const handleNext = () => {
    if (idx < total - 1) setIdx((i) => i + 1);
    else {
      // finish: haptic + sound + confetti + model next steps
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      try {
        // short sine 'win' tone
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 880;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        o.start();
        setTimeout(()=>{ o.frequency.value = 660; g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4); o.stop(ctx.currentTime + 0.45); }, 250);
      } catch (e) {}

      // simple confetti dots
      try {
        const c = document.createElement('div');
        c.style.position = 'fixed'; c.style.left = 0; c.style.top = 0; c.style.right = 0; c.style.bottom = 0; c.style.pointerEvents='none';
        for (let i=0;i<40;i++){ const s=document.createElement('div'); s.textContent='🎉'; s.style.position='absolute'; s.style.left=(Math.random()*90)+'%'; s.style.top=(Math.random()*80)+'%'; s.style.fontSize=(12+Math.random()*20)+'px'; c.appendChild(s); }
        document.body.appendChild(c);
        setTimeout(()=>document.body.removeChild(c), 3000);
      } catch (e) {}

      // model announces next steps
      speak('Great job! You finished the practice interview. This does not submit your application. Tap Review to copy or email your summary, then open ApplyTexas in a new tab to paste your answers. Come back here when you are ready for step two.');
    }
  };

  const handleSkip = () => {
    setAnswers((a) => ({ ...a, [questions[idx].id]: '' }));
    handleNext();
  };

  const handleAnswerChange = (val) => {
    setAnswers((a) => ({ ...a, [questions[idx].id]: val }));
  };

  const current = questions[idx];

  const openMultiselect = () => {
    setMultiselectOpen(true);
    // speak instructions
    speak('Pick one or more, then press Done at the bottom. You can also choose I am not sure.');
  };

  const toggleMultiOption = (opt) => {
    const qid = current.id;
    const prev = answers[qid] || [];
    const exists = prev.includes(opt);
    const next = exists ? prev.filter((o) => o !== opt) : [...prev, opt];
    setAnswers((a) => ({ ...a, [qid]: next }));
  };

  const handleEditSave = (value) => {
    const id = editingField;
    let v = value;
    if (id === 'full_name' || id === 'address') v = autoCapitalizeName(value);
    setAnswers((a) => ({ ...a, [id]: v }));
    setEditingField(null);
  };

  return (
    <div className="container">
      {/* Top pill */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{background:'linear-gradient(90deg,var(--matte-grad-start),var(--matte-grad-mid))',color:'#fff',padding:'6px 10px',borderRadius:20,fontWeight:700}}>
          ApplyTexas • Question {idx+1} of {total}
        </div>
        <div style={{fontSize:12,color:'var(--muted)'}}>{current.type}</div>
      </div>

      {/* Headphone banner before start */}
      {!started && (
        <div className="card" style={{textAlign:'center',marginBottom:12}}>
          <div style={{fontSize:48}}>🎧</div>
          <div style={{fontWeight:700}}>College Interview — please use headphones</div>
          <div className="muted" style={{marginTop:6}}>This session will help you prepare answers for ApplyTexas. No audio will play until you press Start.</div>
          <div style={{marginTop:12}}>
            <button className="btn btn-primary" onClick={handleStart}>Start</button>
          </div>
        </div>
      )}

      {/* Question bubble */}
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700,marginBottom:8}}>{current.text}</div>

        {/* Special UI for multiselect */}
        {current.type === 'multiselect' ? (
          <div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {(current.options || []).map((opt) => (
                <button key={opt} onClick={() => toggleMultiOption(opt)} className="btn" style={{padding:'8px 12px',borderRadius:18,background:(answers[current.id]||[]).includes(opt)?'var(--accent)':'#fff',color:(answers[current.id]||[]).includes(opt)?'#fff':'var(--ink)',borderColor:'var(--ring)'}}>
                  {opt}
                </button>
              ))}
              <button onClick={() => toggleMultiOption("I'm not sure")} className="btn" style={{padding:'8px 12px',borderRadius:18}}>I'm not sure</button>
            </div>
            <div style={{marginTop:10}}>
              <button className="btn" onClick={() => setMultiselectOpen(false)}>Done</button>
            </div>
          </div>
        ) : (
          <div>
            <textarea className="textarea" value={answers[current.id] || ''} onChange={(e)=>handleAnswerChange(e.target.value)} />
          </div>
        )}
      </div>

      {/* Edit bubbles for name/address quick access */}
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <div className="card" style={{flex:1}}>
          <div style={{fontSize:12,color:'var(--muted)'}}>Name</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>{answers.full_name || <span className="muted">Not provided</span>}</div>
            <button className="btn btn-small" onClick={()=>setEditingField('full_name')}>✎ Edit</button>
          </div>
        </div>
        <div className="card" style={{flex:1}}>
          <div style={{fontSize:12,color:'var(--muted)'}}>Address</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>{answers.address || <span className="muted">Not provided</span>}</div>
            <button className="btn btn-small" onClick={()=>setEditingField('address')}>✎ Edit</button>
          </div>
        </div>
      </div>

      {/* Mic center with ring progress */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,marginBottom:12}}>
        <div style={{position:'relative',width:140,height:140,display:'grid',placeItems:'center'}}>
          <svg viewBox="0 0 36 36" style={{position:'absolute',width:140,height:140}}>
            <path d="M18 2a16 16 0 1 0 0 32 16 16 0 0 0 0-32" fill="none" stroke="#e6e6e6" strokeWidth="2" />
            <path d="M18 2a16 16 0 1 0 0 32 16 16 0 0 0 0-32" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray={`${(idx+1)/total*100} 100`} strokeLinecap="round" />
          </svg>
          <button onClick={handleToggleMic} style={{width:96,height:96,borderRadius:48,background:listening?'var(--accent)':'var(--matte-grad-mid)',border:'none',color:'#fff',fontSize:18,fontWeight:700}}>
            {listening ? 'Stop' : 'Mic'}
          </button>
        </div>
        <div style={{display:'flex',gap:8,width:'100%'}}>
          <button className="btn" onClick={handleRepeat}>Repeat</button>
          <button className="btn btn-primary" onClick={handleToggleMic}>{listening ? 'Listening...' : 'Mic'}</button>
          <button className="btn" onClick={handleSkip}>Skip</button>
          <button className="btn btn-primary" onClick={handleNext}>Next</button>
        </div>
      </div>

      {/* Editing modal (simple inline) */}
      {editingField && (
        <div className="card">
          <div style={{fontWeight:700}}>Edit {editingField === 'full_name' ? 'Full name' : 'Address'}</div>
          <EditField initialValue={answers[editingField] || ''} onSave={handleEditSave} onCancel={()=>setEditingField(null)} />
        </div>
      )}

      {/* Bottom dock: Review / ApplyTexas */}
      {idx === total - 1 && (
        <div style={{display:'flex',gap:8}}>
          <button className="btn" onClick={()=>navigate('/agent-interview/review')}>Review</button>
          <button className="btn btn-primary" onClick={()=>window.open('https://www.applytexas.org','_blank')}>Open ApplyTexas</button>
        </div>
      )}
    </div>
  );
}

function EditField({ initialValue, onSave, onCancel }) {
  const [val, setVal] = useState(initialValue || '');
  return (
    <div>
      <input value={val} onChange={(e)=>setVal(e.target.value)} style={{width:'100%',padding:8,borderRadius:8,border:'1px solid var(--ring)'}} />
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <button className="btn" onClick={()=>onCancel()}>Cancel</button>
        <button className="btn btn-primary" onClick={()=>onSave(val)}>Save</button>
      </div>
    </div>
  );
}

