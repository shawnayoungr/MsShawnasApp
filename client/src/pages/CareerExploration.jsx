import { useEffect, useRef, useState } from "react";
import CareerCard from "../components/CareerCard";
import MicIcon from '../assets/MS. Shawna\'s App design (1).svg';
import TopNav from "../components/TopNav";
import BottomNav from "../components/BottomNav";
import { useNavigate } from "react-router-dom";

export default function CareerExploration() {
  const [careers, setCareers] = useState([]);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/careers/careeronestop/local');
        if (!res.ok) throw new Error(`failed to load prepopulated careers: ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        // helper normalizers used for voice matching across all prepop careers
        const norm = (s = '') => String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const stem = (s = '') => {
          let w = norm(s);
          if (w.endsWith('ing')) w = w.slice(0, -3);
          if (w.endsWith('es')) w = w.slice(0, -2);
          if (w.endsWith('s')) w = w.slice(0, -1);
          return w;
        };
        const processed = list.map(c => {
          const titleKey = c.keyword || c.title || c.onetTitle || '';
          return { ...c, _normTitle: norm(titleKey), _stemTitle: stem(titleKey) };
        });
        setCareers(processed);
      } catch (e) { setError(e?.message || 'Failed to load careers'); }
    }
    load();

  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const text = String(e.results?.[0]?.[0]?.transcript || '').trim();
        if (text) doSearch(text);
      };
      rec.onerror = () => {};
      recognitionRef.current = rec;
    }

    return () => { mounted = false; };
  }, []);

  function doSearch(raw) {
    // Voice-only search: every search is transient unless user selects items to compare.
    const title = (raw||'').trim();
    if (!title) return;
    const q = title.toLowerCase();
    // helper: normalize word for simple stemming/plural handling
    const norm = (s = '') => (String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim());
    const stem = (s = '') => {
      let w = norm(s);
      if (w.endsWith('ing')) w = w.slice(0, -3);
      if (w.endsWith('es')) w = w.slice(0, -2);
      if (w.endsWith('s')) w = w.slice(0, -1);
      return w;
    };

    const matches = (careers||[]).filter(e => {
      const titleKey = (e.keyword || e.title || e.onetTitle || '');
      const hay = ((titleKey) + ' ' + (e.onetCode||'')).toLowerCase();
      const nq = norm(q);
      // exact substring match
      if (hay.includes(nq)) return true;
      // use precomputed normal/stem fields when available
      const titleStem = e._stemTitle || stem(titleKey);
      const qStem = stem(q);
      if (titleStem && qStem && (titleStem === qStem || titleStem.includes(qStem) || qStem.includes(titleStem))) return true;
      // word-based startsWith / prefix match
      const words = (titleKey).toLowerCase().split(/\s+/);
      if (words.some(w => w.startsWith(nq) || nq.startsWith(w))) return true;
      return false;
    }).slice(0,12);
    const results = matches.map(e => ({ id: e.onetCode||e.keyword||e.title, title: e.title||e.keyword||'', description: e.description||e.onetDescription||'', onetCode: e.onetCode||null, sourceUrl: e.sourceUrl||null, full: e }));
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    // Replace previous items; don't keep a history
    setItems([{ id, query: title, results }]);
  }

  function handleMic() {
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch {}
    } else {
      alert('Speech recognition is not available in this browser. Use a supported browser (Chrome/Edge) with microphone.');
    }
  }

  function handleSelectToggle({ checked, title, onetCode, full }) {
    setSelected(prev => {
      if (checked) {
        if (prev.length >= 2) { alert('You can compare up to 2 careers at a time.'); return prev; }
        return [...prev, full || { title, onetCode }];
      }
      return prev.filter(p => (p.onetCode||p.title) !== (onetCode||title));
    });
  }

  // Single select from card tap (also supports compare via checkbox)
  function handleCardSelect(item) {
    // Toggle selection for compare (touch-friendly). Adds/removes the card
    // to the `selected` array. Max 2 items allowed for comparison.
    if (!item) return;
    const key = (item.onetCode || item.keyword || item.title || '');
    setSelected(prev => {
      const exists = (prev || []).some(p => (p.onetCode || p.keyword || p.title) === key);
      if (exists) {
        return (prev || []).filter(p => (p.onetCode || p.keyword || p.title) !== key);
      }
      if ((prev || []).length >= 2) { alert('You can compare up to 2 careers at a time.'); return prev; }
      return [...(prev || []), item];
    });
    // scroll to comparison area
    window.scrollTo({ top: 220, behavior: 'smooth' });
  }

  function handleCompare() { if (selected.length < 2) { alert('Select two careers to compare.'); return; } setShowComparison(true); }
  function handleClear() { setItems([]); setSelected([]); setShowComparison(false); }
  function handleFindTexasColleges(major) { navigate(`/college?state=TX&major=${encodeURIComponent(major)}`); }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
      <div className="fixed top-0 left-0 right-0 z-30"><TopNav /></div>
      <div className="px-4 pt-20">
        <h1 className="text-3xl font-serif font-semibold">Career Exploration</h1>
        

        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleMic} className="bg-white/90 rounded-full p-3 shadow-md" aria-label="Start voice search">
            <img src={MicIcon} alt="mic" style={{ width: 28, height: 28 }} />
          </button>
          <div className="flex flex-col">
            <div className="text-xs text-white/95">Try: "Computer Science", "Nursing"</div>
            <button onClick={handleClear} className="rounded-lg px-3 py-2 border mt-1">Start over</button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <button className="px-3 py-1 border rounded" onClick={()=>{ if (selected.length>=2) handleCompare(); else alert('Select two careers to compare.'); }}>Compare selected ({selected.length})</button>
          <button className="px-3 py-1 border rounded" onClick={()=>{ setSelected([]); setShowComparison(false); }}>Clear selection</button>
        </div>

        {items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {careers.map(c => (
              <CareerCard
                key={c.onetCode||c.keyword||c.title}
                data={c}
                onFindColleges={handleFindTexasColleges}
                onSelectToggle={handleSelectToggle}
                onSelect={handleCardSelect}
                selected={(selected || []).some(p => (p.onetCode || p.keyword || p.title) === (c.onetCode || c.keyword || c.title))}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item=> (
              <div key={item.id} className="bg-white/80 rounded p-3">
                <div className="font-medium mb-2">Results for "{item.query}"</div>
                {item.results.map((r,idx)=>(
                  <CareerCard
                    key={`${item.id}-${idx}`}
                    data={r.full || r}
                    onFindColleges={handleFindTexasColleges}
                    onSelectToggle={handleSelectToggle}
                    onSelect={handleCardSelect}
                    selected={(selected || []).some(p => (p.onetCode || p.keyword || p.title) === ((r.full && (r.full.onetCode||r.full.keyword||r.full.title)) || (r.onetCode||r.title||r.keyword)))}
                  />
                ))}
                {/* If a spoken career isn't in PREPOP, show CareerOneStop link */}
                {item.results.length === 0 && (
                  <div className="mt-2">
                    <a
                      className="inline-block px-3 py-2 bg-indigo-600 text-white rounded"
                      href={`https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=${encodeURIComponent(item.query)}&location=texas`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Find that career here
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showComparison && selected.length >= 2 && (
          <div className="mt-6 bg-white/90 border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Side-by-side comparison</h3>
              <div className="flex gap-2">
                <button className="px-2 py-1 border rounded" onClick={()=>setShowComparison(false)}>Close</button>
                <button className="px-2 py-1 border rounded" onClick={()=>{ setSelected([]); setShowComparison(false); }}>Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selected.slice(0,2).map((s,i)=>(
                <div key={i} className="border rounded p-3 bg-white">
                  <div className="text-lg font-semibold mb-1">{s.title}</div>
                  <div className="text-sm opacity-70 mb-2">ONET: {s.onetCode || s.onet || '—'}</div>
                  <div className="mb-2"><span className="opacity-70">Median wage (TX cluster): </span><span className="font-medium">{s.medianWage ? `$${Number(s.medianWage).toLocaleString()}` : 'Unknown'}</span></div>
                  <div className="mb-2"><span className="opacity-70">Education: </span><span className="font-medium">{s.education || s.educationLevel || 'Unknown'}</span></div>
                  {(s.description || s.onetDescription) && <p className="mb-2 text-sm">{s.description || s.onetDescription}</p>}
                  {s.careerVideoUrl && <div className="mb-2"><a className="underline" href={s.careerVideoUrl} target="_blank" rel="noreferrer">Watch career video</a></div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30"><BottomNav /></div>
    </div>
  );
}
