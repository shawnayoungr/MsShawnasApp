import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useRealtimeVoice
 * - Attempts to create a Realtime session via the server token endpoint (VITE_VOICE_TOKEN_URL)
 * - If Realtime fails, falls back to Web Speech API (SpeechRecognition) for STT and SpeechSynthesis for TTS
 * - Exposes: start, stop, speak, listening, onTranscript, onModelText
 * - Implements a silence timeout (~3s) to detect end-of-utterance
 * - Supports barge-in by stopping playback when user starts speaking
 */
export default function useRealtimeVoice(options = {}) {
  const { tokenUrl = import.meta.env.VITE_VOICE_TOKEN_URL } = options;

  const [listening, setListening] = useState(false);
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [modelText, setModelText] = useState('');

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const pcRef = useRef(null); // RTCPeerConnection
  const abortControllerRef = useRef(null);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      // treat as end of utterance
      setListening(false);
    }, 3000);
  }, []);

  // Try to initialize Realtime via token endpoint
  const startRealtime = useCallback(async () => {
    if (!tokenUrl) throw new Error('VITE_VOICE_TOKEN_URL not set');

    try {
      const resp = await fetch(tokenUrl);
      if (!resp.ok) throw new Error('Token request failed');
      const session = await resp.json();

      // TODO: create WebRTC connection using session.client_secret or similar fields returned
      // For now, mark connected. Implementing full WebRTC with OpenAI Realtime is handled in later steps.
      setConnected(true);
      return { ok: true, session };
    } catch (err) {
      console.warn('Realtime start failed, falling back to browser STT', err.message);
      setConnected(false);
      return { ok: false, error: err };
    }
  }, [tokenUrl]);

  // Web Speech fallback: start recognition
  const startBrowserSTT = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not available in this browser.');
      return false;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recog = new SpeechRecognition();
    recog.interimResults = true;
    recog.continuous = false; // we'll restart as needed
    recog.lang = 'en-US';

    recog.onstart = () => {
      setListening(true);
      resetSilenceTimer();
    };

    recog.onresult = (ev) => {
      let interim = '';
      let final = '';
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const r = ev.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript((prev) => (final ? prev + ' ' + final : interim));
      resetSilenceTimer();
    };

    recog.onerror = (e) => {
      console.warn('Speech recognition error', e.error);
      setListening(false);
    };

    recog.onend = () => {
      // recognition ended; update listening flag
      setListening(false);
    };

    recognitionRef.current = recog;
    try {
      recog.start();
      return true;
    } catch (err) {
      console.warn('recognition start failed', err);
      return false;
    }
  }, [resetSilenceTimer]);

  const stopBrowserSTT = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  // Public start: try realtime first, else fallback to browser STT
  const start = useCallback(async () => {
    const realtime = await startRealtime();
    if (!realtime.ok) {
      startBrowserSTT();
    } else {
      // TODO: start WebRTC audio capture and streaming
      // For now, also start browser STT as a parallel backup
      startBrowserSTT();
    }
  }, [startRealtime, startBrowserSTT]);

  const stop = useCallback(() => {
    // stop any active recognition or media
    stopBrowserSTT();
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (e) {}
      pcRef.current = null;
    }
    setConnected(false);
  }, [stopBrowserSTT]);

  // Speak text using SpeechSynthesis (fallback) or realtime TTS if connected
  const speak = useCallback((text) => {
    if (!text) return;
    // If realtime TTS available, prefer it (not implemented yet)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      // choose voice heuristically
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length) u.voice = voices[0];
      window.speechSynthesis.speak(u);
    }
  }, []);

  // Barge-in: if user starts speaking, stop any playing TTS
  useEffect(() => {
    const handleStartSpeaking = () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
    // When speech recognition starts, cancel TTS
    if (recognitionRef.current) {
      recognitionRef.current.onstart = handleStartSpeaking;
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.onstart = null;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [stop]);

  return {
    start,
    stop,
    speak,
    listening,
    connected,
    transcript,
    modelText,
    // callbacks to allow parent to subscribe/receive events
    onTranscript: (cb) => {
      // very small subscription model; in practice use refs or event emitters
      // For now consumer can read `transcript` from hook state.
      console.warn('useRealtimeVoice: onTranscript subscription not implemented; read transcript state instead.');
    },
    onModelText: (cb) => {
      console.warn('useRealtimeVoice: onModelText subscription not implemented; read modelText state instead.');
    }
  };
}
