import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
