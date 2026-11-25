import { useEffect, useRef, useState, type RefObject } from 'react';
import { useGestureDetection } from '../../hooks/useGestureDetection';
import { createCaption, type RoomCaption } from './captions';

type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<SpeechResult> }) => void) | null;
  start: (track: MediaStreamTrack) => void;
  abort: () => void;
};

function speechRecognition() {
  const browser = window as Window & {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function SpeechCaptions({ track, onCaption }: { track: MediaStreamTrack; onCaption: (caption: RoomCaption) => void }) {
  const [status, setStatus] = useState('Đang mở nhận diện giọng nói…');
  useEffect(() => {
    const SpeechRecognition = speechRecognition();
    if (!SpeechRecognition) {
      setStatus('Trình duyệt này chưa hỗ trợ nhận diện giọng nói.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = false;
    let cancelled = false;
    let restart: ReturnType<typeof setTimeout>;

    function start() {
      if (cancelled || track.readyState !== 'live' || !track.enabled) return;
      try { recognition.start(track); }
      catch { setStatus('Không mở được nhận diện giọng nói. Hãy tắt rồi bật lại phụ đề giọng nói.'); }
    }

    recognition.onstart = () => setStatus('Đang nhận diện giọng nói tiếng Việt.');
    recognition.onresult = event => {
      if (cancelled || track.readyState !== 'live' || !track.enabled) return;
      const final: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (result.isFinal) final.push(result[0].transcript);
      }
      const caption = createCaption('speech', final.join(' '));
      if (caption) onCaption(caption);
    };
    recognition.onerror = event => {
      if (event.error === 'no-speech') return;
      recognition.onend = null;
      setStatus(event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'Trình duyệt chưa cấp quyền nhận diện giọng nói hoặc dịch vụ không khả dụng.'
        : 'Nhận diện giọng nói bị gián đoạn. Hãy tắt rồi bật lại phụ đề giọng nói.');
    };
    recognition.onend = () => { restart = setTimeout(start, 600); };
    restart = setTimeout(start, 0);

    return () => {
      cancelled = true;
      clearTimeout(restart);
      recognition.onstart = recognition.onresult = recognition.onend = recognition.onerror = null;
      recognition.abort();
    };
  }, [track, onCaption]);
  return <p role="status">{status}</p>;
}

export function SignCaptions({ video, track, onCaption }: {
  video: RefObject<HTMLVideoElement>;
  track: MediaStreamTrack;
  onCaption: (caption: RoomCaption) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [startupError, setStartupError] = useState(false);
  const { startDetection, prediction, detectionError, isDetecting } = useGestureDetection(video, canvas, false);
  useEffect(() => {
    let cancelled = false;
    const start = setTimeout(() => {
      void startDetection('camera').catch(() => { if (!cancelled) setStartupError(true); });
    }, 0);
    return () => { cancelled = true; clearTimeout(start); };
  }, [startDetection]);
  useEffect(() => {
    if (!prediction || prediction.label_id === '-1' || prediction.confidence < .65
      || track.readyState !== 'live' || !track.enabled) return;
    const caption = createCaption('sign', prediction.label_name);
    if (caption) onCaption(caption);
  }, [prediction, track, onCaption]);

  return <p role="status" className="room-caption-source-status">{startupError || detectionError
    ? 'Nhận diện ký hiệu chưa sẵn sàng. Hãy kiểm tra kết nối rồi tắt và bật lại phụ đề ký hiệu.'
    : isDetecting ? 'Đang nhận diện ký hiệu trong bộ từ hiện có.' : 'Đang tải bộ nhận diện ký hiệu…'}</p>;
}
