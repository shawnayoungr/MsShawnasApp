import { useState, useEffect, useCallback } from 'react';

interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
}

interface ListenOptions {
  lang?: string;
  interim?: boolean;
}

interface UseSpeechReturn {
  speak: (text: string, opts?: SpeechOptions) => void;
  listenOnce: (opts?: ListenOptions) => Promise<string>;
  stopListening: () => void;
  isTTSSupported: boolean;
  isSTTSupported: boolean;
  listening: boolean;
  error: string | null;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const useSpeech = (): UseSpeechReturn => {
  const [listening, setListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check for TTS support
  const isTTSSupported = 'speechSynthesis' in window;
  
  // Check for STT support  
  const isSTTSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  const speak = useCallback((text: string, opts: SpeechOptions = {}) => {
    if (!isTTSSupported) {
      setError('Text-to-speech not supported');
      return;
    }

    // Cancel any existing speech to avoid stacking on mobile
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = opts.rate || 1;
    utterance.pitch = opts.pitch || 1;
    utterance.lang = opts.lang || 'en-US';

    utterance.onerror = (event) => {
      setError(`Speech synthesis error: ${event.error}`);
    };

    window.speechSynthesis.speak(utterance);
  }, [isTTSSupported]);

  const listenOnce = useCallback((opts: ListenOptions = {}): Promise<string> => {
    return new Promise((resolve) => {
      if (!isSTTSupported) {
        setError('Speech recognition not supported');
        resolve('');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = opts.interim || false;
      recognition.lang = opts.lang || 'en-US';

      setListening(true);
      setError(null);

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.transcript || '';
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        resolve('');
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    });
  }, [isSTTSupported]);

  const stopListening = useCallback(() => {
    setListening(false);
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    speak,
    listenOnce,
    stopListening,
    isTTSSupported,
    isSTTSupported,
    listening,
    error,
  };
};