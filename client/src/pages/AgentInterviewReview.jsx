// client/src/pages/AgentInterviewReview.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import questionsRaw from "../data/applytexas-questions.json";
import { mapInterviewToApplyTexas } from "../services/applytexasMapper";
import { Link } from "react-router-dom";

export default function AgentInterviewReview() {
  // same dynamic token as the interview page
  const threeYearsAgo = useMemo(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 3);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, []);

  // normalize questions to match interview text
  const questions = useMemo(
    () => questionsRaw.map(q => ({ ...q, text: q.text.replaceAll("{{residencyAnchor}}", threeYearsAgo) })),
    [threeYearsAgo]
  );

  const answers = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("agentInterviewAnswers") || "[]"); }
    catch { return []; }
  }, []);

  // mapped draft + persist silently for fallback
  const draftObj = useMemo(() => mapInterviewToApplyTexas({ questions, answers }), [questions, answers]);
  const jsonStr = useMemo(() => JSON.stringify(draftObj, null, 2), [draftObj]);

  useEffect(() => {
    try { localStorage.setItem("applytexasDraft", JSON.stringify(draftObj)); } catch {}
  }, [draftObj]);

  // Build a student-friendly summary text (plain English)
  const summaryText = useMemo(() => buildStudentSummary(draftObj), [draftObj]);

  // controls
  const [showAnsweredOnly, setShowAnsweredOnly] = useState(true);
  const [openAnswers, setOpenAnswers] = useState(true);
  const [openAdvanced, setOpenAdvanced] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "1" || import.meta.env.DEV ? false : false; // closed by default
  });

  const taRef = useRef(null);
  const copyText = async (text, fallbackEl) => {
    try { await navigator.clipboard.writeText(text); alert("Copied!"); }
    catch {
      try { fallbackEl?.select(); document.execCommand("copy"); alert("Copied!"); }
      catch { alert("Copy failed — select and copy manually."); }
    }
  };

  const copySummary = () => copyText(summaryText, null);
  const emailSummary = () => {
    // Prefill To if student email is known
    const to = draftObj?.applicant?.email ? `mailto:${encodeURIComponent(draftObj.applicant.email)}` : 'mailto:';
    const mailto = `${to}?subject=${encodeURIComponent("My ApplyTexas draft summary")}&body=${encodeURIComponent(summaryText)}`;
    window.location.href = mailto;
  };

  const copyJSON = () => copyText(jsonStr, taRef.current);
  const downloadJSON = () => {
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "applytexas-draft.json"; a.click();
    URL.revokeObjectURL(url);
  };

  // answered filter for the list
  const qa = useMemo(() => {
    const all = questions.map((q, i) => ({ id: q.id, text: q.text, answer: (answers?.[i] ?? "").trim() }));
    return showAnsweredOnly ? all.filter(x => x.answer.length > 0) : all;
  }, [questions, answers, showAnsweredOnly]);

  return (
    <main className="container dev-offset" style={{ paddingBottom: 88 }}>
      <header style={{ textAlign: "center" }}>
        <h1 className="h1">Review & Export</h1>
        <p className="muted">Check your answers and share a simple summary. Advanced JSON is available if needed.</p>
      </header>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <label className="muted" style={{ fontSize: 14 }}>
          <input type="checkbox" checked={showAnsweredOnly} onChange={e=>setShowAnsweredOnly(e.target.checked)} style={{ marginRight: 6 }}/>
          Show only answered
        </label>
        <Link to="/agent-interview" className="btn btn-small btn-primary">Back to Interview</Link>
      </div>

      {/* Student-friendly summary card */}
      <section className="card" style={{ marginTop: 10 }}>
        <h2 className="h2">Shareable Summary</h2>
        <p className="muted">This is the plain-text version students can copy, share, or email.</p>
        <textarea readOnly value={summaryText} className="textarea" style={{ minHeight: 160 }} aria-label="ApplyTexas summary"/>
      </section>

      {/* Answers list (collapsible) */}
      <section className="card">
        <button onClick={()=>setOpenAnswers(v=>!v)} style={accBtn()}>
          <span>📝 Your Answers</span><span>{openAnswers ? "▾" : "▸"}</span>
        </button>
        {openAnswers && (
          <ol className="ol">
            {qa.length === 0 && <div className="muted">No answers yet.</div>}
            {qa.map(({id, text, answer}) => (
              <li key={id} className="li">
                <div className="q">{text}</div>
                <div className="a">{answer || <span className="muted">—</span>}</div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Advanced (JSON) hidden behind toggle */}
      <section className="card">
        <button onClick={()=>setOpenAdvanced(v=>!v)} style={accBtn()}>
          <span>⚙️ Advanced (JSON)</span><span>{openAdvanced ? "▾" : "▸"}</span>
        </button>
        {openAdvanced && (
          <div>
            <textarea ref={taRef} readOnly value={jsonStr} className="textarea" style={{ minHeight: 220 }} aria-label="ApplyTexas draft JSON"/>
            <div className="btn-grid" style={{ marginTop: 8 }}>
              <button className="btn btn-primary" onClick={copyJSON}>Copy JSON</button>
              <button className="btn" onClick={downloadJSON}>Download JSON</button>
            </div>
          </div>
        )}
      </section>

      {/* Sticky student actions */}
      <div className="sticky-bar">
        <button className="btn btn-primary" onClick={copySummary}>Copy Summary</button>
        <button className="btn" onClick={emailSummary}>Email</button>
      </div>
    </main>
  );
}

function accBtn(){ return { width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", fontWeight:700, fontSize:14, padding:"6px 2px", background:"transparent", border:"none" }; }

// Converts the mapped draft to friendly text for students
function buildStudentSummary(d) {
  const L = [];
  const s = (label, val) => L.push(`${label}: ${val ?? ""}`);
  const joinList = (arr) => (arr && arr.length ? arr.join(", ") : "");

  s("Full name", d?.applicant?.fullName || "");
  s("Birth date", d?.applicant?.dateOfBirth || "");
  s("Address", d?.applicant?.address || "");
  s("Email", d?.applicant?.email || "");
  s("Phone", d?.applicant?.phone || "");
  s("High school & grad", d?.applicant?.highSchool?.nameAndGrad || "");

  s("Dual credit/early college", d?.priorCollege?.dualCredit || "");
  s("School changes", d?.schoolHistory || "");
  s("Lived in Texas 3+ years", typeof d?.texasResidencySince3Years === "boolean" ? (d.texasResidencySince3Years ? "Yes" : "No") : "");

  s("Citizenship", d?.citizenship || "");
  s("Gender", d?.gender || "");
  s("Race/ethnicity", joinList(d?.raceEthnicity));

  s("GPA", d?.gpa ?? "");
  s("Test dates", (d?.tests || []).map(t => `${t.month} ${t.year}`).join(", "));

  s("Sports", joinList(d?.activities?.sports));
  s("Clubs", joinList(d?.activities?.clubs));
  s("Community", joinList(d?.activities?.community));
  s("Leadership", d?.activities?.leadership || "");
  s("Volunteer", d?.activities?.volunteer || "");

  s("Job title", d?.employment?.jobTitle || "");
  s("Employer", d?.employment?.employer || "");
  s("Job duration", d?.employment?.duration || "");
  s("Hours/week", d?.employment?.hoursPerWeek || "");

  s("Academic honors", d?.honors?.academic || "");
  s("School awards", d?.honors?.school || "");
  s("Sports/competitions", d?.honors?.sportsOrCompetition || "");
  s("Scholarships/community", d?.honors?.scholarshipsOrCommunity || "");

  s("Favorite subjects", d?.interests?.favoriteSubjects || "");
  s("Career interest", d?.interests?.careerInterest || "");
  s("Curious field", d?.interests?.curiousField || "");

  if (d?.essay) {
    L.push("");
    L.push("Essay:");
    L.push(d.essay);
  }

  return L.join("\n");
}

