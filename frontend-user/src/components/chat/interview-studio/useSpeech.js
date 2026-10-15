import { useState, useEffect, useRef, useCallback } from 'react';

const getRecognitionClass = () =>
  typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null;

const ERROR_TEXT = {
  'not-allowed': 'Trình duyệt chưa được phép dùng micro. Hãy cấp quyền micro cho trang này rồi thử lại.',
  'service-not-allowed': 'Trình duyệt không cho phép nhận diện giọng nói trên trang này.',
  'audio-capture': 'Không tìm thấy micro. Hãy kiểm tra thiết bị thu âm rồi thử lại.',
  network: 'Không kết nối được dịch vụ nhận diện giọng nói của trình duyệt. Hãy kiểm tra mạng hoặc gõ câu trả lời.',
  'language-not-supported': 'Trình duyệt chưa hỗ trợ nhận diện tiếng Việt.',
};

/**
 * Nhận diện giọng nói của trình duyệt (Web Speech API, tiếng Việt). Chrome và Edge hỗ trợ; âm thanh do trình duyệt
 * gửi tới dịch vụ nhận diện của họ, LemoGuide chỉ nhận phần chữ. Trình duyệt tự dừng sau một quãng im lặng
 * nên hook tự bật lại cho tới khi người dùng bấm dừng.
 *
 * - `onFinal(text)` được gọi với từng đoạn đã chốt; đoạn đang nói dở nằm ở `interim`.
 * - Trả về `supported: false` khi trình duyệt không có API này (Firefox, Safari cũ).
 */
export const useSpeechRecognition = ({ lang = 'vi-VN', onFinal } = {}) => {
  const RecognitionClass = getRecognitionClass();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const wantRef = useRef(false);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => {
    wantRef.current = false;
    setListening(false);
    setInterim('');
    try {
      recognitionRef.current?.stop();
    } catch {
      // đã dừng
    }
  }, []);

  const start = useCallback(() => {
    if (!RecognitionClass || wantRef.current) return;
    setError(null);
    const recognition = new RecognitionClass();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          if (transcript.trim()) onFinalRef.current?.(transcript.trim());
        } else {
          pending += transcript;
        }
      }
      setInterim(pending);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(ERROR_TEXT[event.error] || 'Nhận diện giọng nói gặp sự cố. Bạn có thể thử lại hoặc gõ câu trả lời.');
      wantRef.current = false;
      setListening(false);
      setInterim('');
    };

    recognition.onend = () => {
      if (wantRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          wantRef.current = false;
        }
      }
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    wantRef.current = true;
    try {
      recognition.start();
      setListening(true);
    } catch {
      wantRef.current = false;
      setError('Không bật được micro. Hãy thử lại.');
    }
  }, [RecognitionClass, lang]);

  useEffect(
    () => () => {
      wantRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        // đã dừng
      }
    },
    []
  );

  return { supported: Boolean(RecognitionClass), listening, interim, error, start, stop };
};

const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

/**
 * Đọc to một đoạn văn bằng giọng tiếng Việt của hệ điều hành. `available` chỉ đúng khi máy thật sự có giọng
 * tiếng Việt (nếu không, trình duyệt sẽ đọc bằng giọng khác nghe rất khó chịu).
 */
export const useSpeechSynthesis = ({ lang = 'vi-VN' } = {}) => {
  const [available, setAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef(null);

  useEffect(() => {
    if (!speechSupported()) return undefined;
    const synth = window.speechSynthesis;
    const prefix = lang.slice(0, 2).toLowerCase();
    const pick = () => {
      const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith(prefix)) || null;
      voiceRef.current = voice;
      setAvailable(Boolean(voice));
    };
    pick();
    synth.addEventListener?.('voiceschanged', pick);
    return () => {
      synth.removeEventListener?.('voiceschanged', pick);
      synth.cancel();
    };
  }, [lang]);

  const cancel = useCallback(() => {
    if (!speechSupported()) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text) => {
      if (!speechSupported() || !text) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(utterance);
    },
    [lang]
  );

  return { available, speaking, speak, cancel };
};
