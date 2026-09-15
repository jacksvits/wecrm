import React, { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import { Avatar } from './Avatar';

// Окно звонка: отображается поверх всего приложения в фазах
// outgoing/incoming/connecting/active. Видео — remote на весь экран, local
// картинка-в-картинке. Управление — mute, выкл. камеры (только видео), завершить.

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const controlButtonStyle = (danger = false): React.CSSProperties => ({
  width: 56,
  height: 56,
  borderRadius: '50%',
  border: 'none',
  background: danger ? '#e53935' : 'rgba(255, 255, 255, 0.2)',
  color: '#fff',
  fontSize: 24,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(4px)',
  flexShrink: 0,
});

export function CallWindow() {
  const {
    phase, peer, call, muted, videoOff,
    localStream, remoteStream, duration, accept, reject, end, toggleMute, toggleVideo,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, phase]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, phase]);

  if (phase === 'idle' || !peer) return null;

  const isVideo = call?.type === 'video';
  const statusText =
    phase === 'outgoing' ? 'Вызов…'
    : phase === 'incoming' ? (isVideo ? 'Входящий видеозвонок' : 'Входящий звонок')
    : phase === 'connecting' ? 'Соединение…'
    : formatDuration(duration);

  const showRemoteVideo = isVideo && remoteStream && (phase === 'connecting' || phase === 'active');
  const showLocalVideo = isVideo && localStream && phase !== 'incoming' && phase !== 'outgoing';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: '#111318',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
      }}
    >
      {/* Видео собеседника на весь экран */}
      {showRemoteVideo && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Верхняя плашка: имя и статус */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(24px + env(safe-area-inset-top, 0px))',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          zIndex: 2,
          textShadow: showRemoteVideo ? '0 1px 4px rgba(0,0,0,0.8)' : undefined,
        }}
      >
        <Avatar name={peer.name} avatar={peer.avatar} size={showRemoteVideo ? 56 : 96} />
        <div style={{ fontSize: 20, fontWeight: 600 }}>{peer.name}</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>{statusText}</div>
      </div>

      {/* Своя камера — картинка в картинке */}
      {showLocalVideo && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            right: 16,
            bottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
            width: 110,
            height: 150,
            objectFit: 'cover',
            borderRadius: 12,
            zIndex: 2,
            background: '#000',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            transform: videoOff ? 'scaleX(-1)' : undefined,
            opacity: videoOff ? 0.4 : 1,
          }}
        />
      )}

      {/* Панель управления */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          zIndex: 2,
        }}
      >
        {phase === 'incoming' ? (
          <>
            <button onClick={reject} title="Отклонить" style={controlButtonStyle(true)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" transform="rotate(135 12 12)" />
              </svg>
            </button>
            <button onClick={accept} title="Принять" style={{ ...controlButtonStyle(), background: '#43a047' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              title={muted ? 'Включить микрофон' : 'Выключить микрофон'}
              style={{ ...controlButtonStyle(), background: muted ? '#fff' : 'rgba(255,255,255,0.2)', color: muted ? '#111' : '#fff' }}
            >
              {muted ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27 9.01 10.28V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15a.995.995 0 00-.98-.85c-.61 0-1.09.54-1 1.14.49 3.2 3.1 5.64 6.31 6.03V21h2v-2.98c3.21-.39 5.82-2.83 6.31-6.03.1-.6-.39-1.14-1-1.14z" />
                </svg>
              )}
            </button>
            {isVideo && phase !== 'outgoing' && (
              <button
                onClick={toggleVideo}
                title={videoOff ? 'Включить камеру' : 'Выключить камеру'}
                style={{ ...controlButtonStyle(), background: videoOff ? '#fff' : 'rgba(255,255,255,0.2)', color: videoOff ? '#111' : '#fff' }}
              >
                {videoOff ? '📷❌' : '📷'}
              </button>
            )}
            <button onClick={end} title="Завершить" style={controlButtonStyle(true)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" transform="rotate(135 12 12)" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
