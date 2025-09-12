import React, { useState, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import questionsData from '../data/applytexas-questions.json';

interface Question {
  id: string;
  key: string;
  prompt: string;
}

const LS_ANSWERS = "agentInterviewAnswers";
const LS_INDEX = "agentInterviewIndex";  
const LS_LAST = "agentInterviewLastActive";
const SESSION_MINUTES = 60;

const AgentInterview: React.FC = () => {
  const [questions] = useState<Question[]>(questionsData);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [interviewStarted, setInterviewStarted] = useState<boolean>(false);
  const [showAnswerCard, setShowAnswerCard] = useState<boolean>(false);
  
  const { speak, listenOnce, isTTSSupported, isSTTSupported, listening, error } = useSpeech();

  // Load saved state on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem(LS_ANSWERS);
    const savedIndex = localStorage.getItem(LS_INDEX);
    const savedLast = localStorage.getItem(LS_LAST);

    if (savedAnswers && savedIndex && savedLast) {
      const lastActive = new Date(savedLast);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

      if (diffMinutes < SESSION_MINUTES) {
        // Continue session
        setAnswers(JSON.parse(savedAnswers));
        setCurrentIndex(parseInt(savedIndex, 10));
        setInterviewStarted(true);
        
        const parsedAnswers = JSON.parse(savedAnswers);
        const currentQuestion = questions[parseInt(savedIndex, 10)];
        if (currentQuestion && parsedAnswers[currentQuestion.key]) {
          setCurrentAnswer(parsedAnswers[currentQuestion.key]);
        }
      } else {
        // Clear stale data
        clearSavedData();
      }
    }
  }, [questions]);

  // Save state to localStorage
  const saveState = () => {
    localStorage.setItem(LS_ANSWERS, JSON.stringify(answers));
    localStorage.setItem(LS_INDEX, currentIndex.toString());
    localStorage.setItem(LS_LAST, new Date().toISOString());
  };

  const clearSavedData = () => {
    localStorage.removeItem(LS_ANSWERS);
    localStorage.removeItem(LS_INDEX);
    localStorage.removeItem(LS_LAST);
  };

  const startInterview = () => {
    setInterviewStarted(true);
    if (questions.length > 0) {
      speak(questions[currentIndex].prompt);
    }
  };

  const repeatQuestion = () => {
    if (questions[currentIndex]) {
      speak(questions[currentIndex].prompt);
    }
  };

  const handleVoiceAnswer = async () => {
    try {
      const transcript = await listenOnce();
      if (transcript) {
        setCurrentAnswer(transcript);
        // Update answers state
        const currentQuestion = questions[currentIndex];
        if (currentQuestion) {
          const newAnswers = { ...answers, [currentQuestion.key]: transcript };
          setAnswers(newAnswers);
        }
      }
    } catch (err) {
      console.error('Voice recognition error:', err);
    }
  };

  const handleTextChange = (value: string) => {
    setCurrentAnswer(value);
    const currentQuestion = questions[currentIndex];
    if (currentQuestion) {
      const newAnswers = { ...answers, [currentQuestion.key]: value };
      setAnswers(newAnswers);
    }
  };

  const nextQuestion = () => {
    // Save current answer
    const currentQuestion = questions[currentIndex];
    if (currentQuestion) {
      const newAnswers = { ...answers, [currentQuestion.key]: currentAnswer };
      setAnswers(newAnswers);
      
      // Save to localStorage
      localStorage.setItem(LS_ANSWERS, JSON.stringify(newAnswers));
      localStorage.setItem(LS_INDEX, (currentIndex + 1).toString());
      localStorage.setItem(LS_LAST, new Date().toISOString());
    }

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentAnswer(answers[questions[nextIdx].key] || '');
      
      // Speak next question
      speak(questions[nextIdx].prompt);
    }
  };

  const copyAllAnswers = async () => {
    const answeredQuestions = questions.filter(q => answers[q.key]);
    const formattedAnswers = answeredQuestions
      .map(q => `${q.prompt}\n${answers[q.key]}\n`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(formattedAnswers);
      alert('Answers copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy answers to clipboard');
    }
  };

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
              ApplyTexas Interview
            </h1>
            
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600 mb-4">
                This voice-led interview will help you prepare your ApplyTexas application answers.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                📱 iOS users: You must tap "Start Interview" for microphone access
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {questions.length} questions • Session expires in 60 minutes
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${isTTSSupported ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  Text-to-Speech: {isTTSSupported ? 'Supported' : 'Not Supported'}
                </div>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${isSTTSupported ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  Speech-to-Text: {isSTTSupported ? 'Supported' : 'Not Supported'}
                </div>
              </div>

              <button
                onClick={startInterview}
                className="w-full bg-blue-600 text-white text-xl py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">ApplyTexas Interview</h1>
            <div className="text-sm text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {currentQuestion.prompt}
            </h2>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={repeatQuestion}
                className="bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                🔊 Repeat Question
              </button>
              <button
                onClick={handleVoiceAnswer}
                disabled={listening || !isSTTSupported}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  listening 
                    ? 'bg-red-600 text-white' 
                    : isSTTSupported
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {listening ? '🎤 Listening...' : '🎤 Answer by Voice'}
              </button>
            </div>

            {/* Text Fallback */}
            <div className="mb-6">
              <label htmlFor="answer-text" className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer (type or speak):
              </label>
              <textarea
                id="answer-text"
                value={currentAnswer}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full min-h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Type your answer here or use the voice button above..."
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setShowAnswerCard(!showAnswerCard)}
                className="bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                📋 View Answers ({answeredCount})
              </button>
              
              <button
                onClick={nextQuestion}
                disabled={isLastQuestion}
                className={`py-3 px-6 rounded-lg font-medium transition-colors ${
                  isLastQuestion
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLastQuestion ? 'Interview Complete' : 'Next Question →'}
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Answer Card */}
        {showAnswerCard && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Your Answers</h3>
              <button
                onClick={copyAllAnswers}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                📋 Copy All
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((question, index) => (
                <div 
                  key={question.id} 
                  className={`p-4 rounded-lg border ${
                    index === currentIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium text-gray-800 mb-2">
                    {index + 1}. {question.prompt}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {answers[question.key] || '(No answer yet)'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentInterview;