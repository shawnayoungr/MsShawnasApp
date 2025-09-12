import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Splash from './pages/Splash';
import Checklist from './pages/Checklist';
import SeniorStuff from './pages/SeniorStuff';
import CollegeSearch from './pages/CollegeSearch';
import CareerExploration from './pages/CareerExploration';
// ...existing code...
import Scholarships from './pages/Scholarships';
import FAFSAGuide from './pages/FAFSAGuide';
import StudentSuccess from './pages/StudentSuccess';
import STEM from './pages/STEM';
import ChatGptAssistant from './pages/ChatGptAssistant';
import AgentInterview from './pages/AgentInterview.jsx';
import AgentInterviewReview from "./pages/AgentInterviewReview.jsx";
import VoiceInterview from './pages/VoiceInterview.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {import.meta.env.DEV && (
        <div className="dev-offset" style={{position:'fixed',top:8,left:8,zIndex:9999,display:'flex',gap:8}}>
          <Link to="/voice" className="btn btn-small">
            College Interview
          </Link>
          <Link to="/agent-interview/review" className="btn btn-small">
            Review (DEV)
          </Link>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/senior-stuff" element={<SeniorStuff />} />
        <Route path="/college" element={<CollegeSearch />} />
  <Route path="/career" element={<CareerExploration />} />
// ...existing code...
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/fafsa" element={<FAFSAGuide />} />
        <Route path="/success" element={<StudentSuccess />} />
        <Route path="/stem" element={<STEM />} />
        <Route path="/chatgpt" element={<ChatGptAssistant />} />
        <Route path="/agent-interview" element={<AgentInterview />} />
        <Route path="/agent-interview/review" element={<AgentInterviewReview />} />
        <Route path="/voice" element={<VoiceInterview />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
