import React, { useState } from "react";
import CollegeCard from "../components/CollegeCard";
import { fetchTexasCollegesByNames } from "../services/collegeScorecardService";
import TopNav from "../components/TopNav";
import BottomNav from "../components/BottomNav";

const MIC_ICON = (
  <span className="material-icons text-7xl text-white drop-shadow-lg animate-float transition-transform hover:scale-110 cursor-pointer bg-gradient-to-br from-purple-500 via-pink-400 to-blue-400 rounded-full p-6 shadow-xl">
    mic
  </span>
);

export default function CollegeSearch() {
  const [listening, setListening] = useState(false);
  const [collegeNames, setCollegeNames] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState("mic");

  // SpeechRecognition setup
  const handleMicClick = () => {
    setError("");
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError("Speech recognition not supported on this device.");
      return;
    }
    setListening(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = async (event) => {
      setListening(false);
      const transcript = event.results[0][0].transcript;
      const names = transcript.split(/,| and | & | plus | then | next |\s+/).map(s => s.trim()).filter(Boolean).slice(0, 3);
      setCollegeNames(names);
      setStep("loading");
      try {
        const results = await fetchTexasCollegesByNames(names);
        setColleges(results);
        setStep("results");
      } catch (e) {
        setError("Error fetching college data.");
        setStep("mic");
      }
    };
    recognition.onerror = (e) => {
      setError("Speech recognition error. Try again.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const handleTryAgain = () => {
    setCollegeNames([]);
    setColleges([]);
    setStep("mic");
    setError("");
  };

  return (
    <div className="relative min-h-screen w-full max-w-[430px] mx-auto bg-gradient-to-b from-purple-400 via-pink-300 to-blue-400 flex flex-col items-center justify-between overflow-x-hidden">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-30 w-full max-w-[430px] mx-auto">
        <TopNav />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-24 w-full">
        <h1 className="text-xl font-bold text-center text-white mb-6 px-4 drop-shadow-lg">
          What three Texas colleges would you like to explore today?
        </h1>
        {step === "mic" && (
          <button onClick={handleMicClick} disabled={listening} className="focus:outline-none">
            {MIC_ICON}
            <div className="text-white text-sm mt-2 font-semibold">{listening ? "Listening..." : "Tap to Speak"}</div>
          </button>
        )}
        {error && <div className="text-red-200 text-sm mt-2">{error}</div>}
        {step === "loading" && (
          <div className="text-white text-lg mt-6 animate-pulse">Loading results...</div>
        )}
        {step === "results" && (
          <div className="w-full px-2 mt-2">
            {colleges.map((college, idx) => (
              <CollegeCard key={idx} college={college} />
            ))}
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="text-white text-base italic mb-2">Is this what you were curious about?</div>
              <div className="flex gap-4">
                <button onClick={handleTryAgain} className="bg-white text-indigo-700 font-bold px-4 py-2 rounded-lg shadow hover:bg-indigo-50 transition">Try Another Search</button>
                <button onClick={() => setStep("mic")}
                  className="bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg shadow hover:bg-indigo-800 transition">Yes</button>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 w-full max-w-[430px] mx-auto">
        <BottomNav />
      </div>
    </div>
  );
}
