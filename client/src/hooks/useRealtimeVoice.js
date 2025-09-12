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
  const audioElRef = useRef(null); // audio element for remote audio
  const abortControllerRef = useRef(null);
  const modelTextListenersRef = useRef(new Set());
  const playingAudioRef = useRef(null); // any pre-cached audio playing

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

      // Build RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;

      // data channel for text/events
      const dc = pc.createDataChannel('oai-events');
      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'response.output_text' || msg.type === 'model.text') {
            setModelText((t) => t + '\n' + msg.text);
            // notify listeners
            modelTextListenersRef.current.forEach((fn) => { try { fn(msg.text); } catch (e) {} });
          }
        } catch (e) {}
      };

      // play remote audio when track arrives
      pc.ontrack = (event) => {
        try {
          const [stream] = event.streams;
          if (!audioElRef.current) {
            const a = document.createElement('audio');
            a.autoplay = true; a.playsInline = true; a.style.display='none';
            document.body.appendChild(a);
            audioElRef.current = a;
          }
          audioElRef.current.srcObject = stream;
          audioElRef.current.play().catch(()=>{});
        } catch (e) { console.warn('ontrack', e); }
      };

      // get microphone and add track
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const track = stream.getAudioTracks()[0];
      if (track) pc.addTrack(track, stream);

      // create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send the offer to our server proxy which will call OpenAI Realtime and return the answer SDP
      const resp = await fetch('/api/voice/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: offer.sdp })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error('Server SDP proxy failed: ' + resp.status + ' ' + txt);
      }
      const body = await resp.json();
      const answerSdp = body.sdp;
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

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
    // Barge-in: cancel any playing audio
    if (playingAudioRef.current) try { playingAudioRef.current.pause(); } catch (e) {}
    if (!realtime.ok) {
      startBrowserSTT();
    } else {
      // when realtime is active we still use browser STT for interim transcripts optionally
      startBrowserSTT();
    }
  }, [startRealtime, startBrowserSTT]);

  const stop = useCallback(() => {
    // stop any active recognition or media
    stopBrowserSTT();
    if (pcRef.current) {
      try { pcRef.current.getSenders().forEach(s=>s.track?.stop()); pcRef.current.close(); } catch (e) {}
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
      if (audioElRef.current) try { audioElRef.current.pause(); } catch (e) {}
      if (playingAudioRef.current) try { playingAudioRef.current.pause(); } catch (e) {}
    };
    // When speech recognition starts, cancel TTS and pause pre-cached audio
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
      // simple hookup: caller can poll `transcript` or register a callback
      console.warn('useRealtimeVoice: onTranscript callback registration not implemented; read transcript state instead.');
    },
    onModelText: (cb) => {
      if (typeof cb === 'function') modelTextListenersRef.current.add(cb);
      return () => { modelTextListenersRef.current.delete(cb); };
    },
    // internal: allow caller to set an audio element to play remote audio into
    _setAudioElement: (el) => { audioElRef.current = el; },
    _setPlayingAudioRef: (a) => { playingAudioRef.current = a; }
  };
}
