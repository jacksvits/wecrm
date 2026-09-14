import { useEffect, useRef, useState } from 'react';

// Модалка записи видеокружочка (как в Telegram): круглое превью с камеры,
// запись до 60 секунд, по остановке — отправка файла через onSend
export function VideoNoteRecorder({ isDark, onSend, onClose }: {
  isDark: boolean;
  onSend: (file: File) => Promise<void>;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [sec, setSec] = useState(0);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 640 }, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        recorderRef.current = rec;
        rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
        rec.start(250);
        timer = setInterval(() => setSec(s => {
          if (s + 1 >= 60) rec.stop(); // лимит как в Telegram — 60 секунд
          return s + 1;
        }), 1000);
        rec.onstop = async () => {
          if (timer) clearInterval(timer);
          stream?.getTracks().forEach(t => t.stop());
          const type = rec.mimeType || 'video/webm';
          const blob = new Blob(chunksRef.current, { type });
          if (!blob.size) { setError('Запись пуста'); return; }
          setSending(true);
          try {
            await onSend(new File([blob], `video_note_${Date.now()}.webm`, { type }));
            onClose();
          } catch (e: any) {
            setSending(false);
            setError(e?.message || 'Ошибка отправки');
          }
        };
      } catch (e: any) {
        setError(e?.name === 'NotAllowedError' ? 'Нет доступа к камере/микрофону' : (e?.message || 'Ошибка камеры'));
      }
    })();
    return () => {
      if (timer) clearInterval(timer);
      try { if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop(); } catch { /* ignore */ }
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const btn: React.CSSProperties = {
    padding: '10px 22px', borderRadius: 22, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
    color: '#fff', fontSize: 15, fontWeight: 600,
  };

  return (
    <div style={overlay} onClick={() => !sending && onClose()}>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <video ref={videoRef} autoPlay muted playsInline
          style={{ width: 260, height: 260, borderRadius: '50%', objectFit: 'cover', background: '#000', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
        {error ? <div style={{ color: '#ff6b6b', fontSize: 14 }}>{error}</div> : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: '#fff', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{sec} / 60</span>
            <button style={btn} disabled={sending} onClick={() => recorderRef.current?.stop()}>
              {sending ? 'Отправка...' : '⏹ Стоп и отправить'}
            </button>
          </div>
        )}
        {!error && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}
