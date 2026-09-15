import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api/client';
import { WebCall } from '../types';
import { startRingtone, stopRingtone } from '../lib/callSound';

// Контекст аудио/видеозвонков (WebRTC peer-to-peer, 1-на-1).
// Сигнальный канал — WebSocket /api/calls/ws (релей SDP/ICE через бэкенд),
// управление звонком — REST /api/calls. Входящий звонок при закрытой CRM
// приходит системным web-push с кнопками «Принять/Отклонить»; клик открывает
// CRM с ?call=<id> — здесь мы автоматически отвечаем на звонок.

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active';

export interface CallPeer {
  id: string;
  name: string;
  avatar?: string | null;
}

interface SignalData {
  kind: 'sdp' | 'ice';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface CallContextValue {
  phase: CallPhase;
  call: WebCall | null;
  peer: CallPeer | null;
  isCaller: boolean;
  muted: boolean;
  videoOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  duration: number;
  info: string | null;
  startCall: (peer: CallPeer, type: 'audio' | 'video') => Promise<void>;
  accept: () => Promise<void>;
  reject: () => void;
  end: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  // TURN добавим при необходимости (coturn) — пока STUN + host candidates
];

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [call, setCall] = useState<WebCall | null>(null);
  const [peer, setPeer] = useState<CallPeer | null>(null);
  const [isCaller, setIsCaller] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(0);
  const [info, setInfo] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingSignalsRef = useRef<SignalData[]>([]);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const phaseRef = useRef<CallPhase>('idle');
  const callRef = useRef<WebCall | null>(null);
  const isCallerRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  phaseRef.current = phase;
  callRef.current = call;
  isCallerRef.current = isCaller;

  const showInfo = (text: string) => {
    setInfo(text);
    setTimeout(() => setInfo((cur) => (cur === text ? null : cur)), 5000);
  };

  const cleanupMedia = useCallback(() => {
    stopRingtone();
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch { /* уже закрыт */ }
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    pendingSignalsRef.current = [];
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setMuted(false);
    setVideoOff(false);
    setDuration(0);
  }, []);

  const resetToIdle = useCallback(() => {
    cleanupMedia();
    setPhase('idle');
    setCall(null);
    setPeer(null);
    setIsCaller(false);
  }, [cleanupMedia]);

  // === Сигналинг: отправка SDP/ICE второму участнику ===
  const sendSignal = useCallback((data: SignalData) => {
    const ws = wsRef.current;
    const current = callRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && current) {
      ws.send(JSON.stringify({ type: 'signal', callId: current.id, data }));
    }
  }, []);

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal({ kind: 'ice', candidate: e.candidate.toJSON() });
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0] || new MediaStream([e.track]);
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (!mountedRef.current) return;
      if (pc.connectionState === 'connected') {
        setPhase('active');
        if (!durationTimerRef.current) {
          const start = Date.now();
          durationTimerRef.current = setInterval(() => {
            setDuration(Math.floor((Date.now() - start) / 1000));
          }, 1000);
        }
      } else if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed' ||
        pc.connectionState === 'disconnected'
      ) {
        // Разрыв P2P-канала завершает звонок с нашей стороны
        const current = callRef.current;
        if (current && phaseRef.current !== 'idle') {
          api.calls.end(current.id).catch(() => {});
          resetToIdle();
        }
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sendSignal, resetToIdle]);

  // Дождались звонка: подключаем микрофон/камеру и (для ответившего) создаём оффер
  const setupMedia = useCallback(
    async (asOfferer: boolean) => {
      const current = callRef.current;
      if (!current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: current.type === 'video',
        });
        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setLocalStream(stream);
        const pc = createPeerConnection();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        setPhase('connecting');
        if (asOfferer) {
          makingOfferRef.current = true;
          await pc.setLocalDescription(await pc.createOffer());
          makingOfferRef.current = false;
          if (pcRef.current === pc && pc.localDescription) {
            sendSignal({ kind: 'sdp', sdp: pc.localDescription.toJSON() });
          }
        }
      } catch (err: any) {
        // Нет доступа к микрофону/камере — вежливо завершаем звонок
        const id = callRef.current?.id;
        if (id) {
          if (isCallerRef.current) api.calls.cancel(id).catch(() => {});
          else api.calls.reject(id).catch(() => {});
        }
        resetToIdle();
        showInfo('Нет доступа к микрофону или камере');
      }
    },
    [createPeerConnection, sendSignal, resetToIdle]
  );

  // === Обработка SDP/ICE, пришедших по сигнальному каналу ===
  const handleSignal = useCallback(
    async (callId: string, data: SignalData) => {
      const current = callRef.current;
      if (!current || current.id !== callId) return;
      let pc = pcRef.current;
      // Сигнал пришёл до создания RTCPeerConnection (например, оффер раньше,
      // чем звонящий получил media) — кладём в очередь
      if (!pc) {
        pendingSignalsRef.current.push(data);
        return;
      }
      try {
        if (data.kind === 'sdp' && data.sdp) {
          const offerCollision =
            data.sdp.type === 'offer' &&
            (makingOfferRef.current || pc.signalingState !== 'stable');
          // При glare (оба шлют оффер) отступает звонящий — polite peer
          ignoreOfferRef.current = isCallerRef.current && offerCollision;
          if (ignoreOfferRef.current) return;
          await pc.setRemoteDescription(data.sdp);
          if (data.sdp.type === 'offer') {
            await pc.setLocalDescription(await pc.createAnswer());
            if (pcRef.current === pc && pc.localDescription) {
              sendSignal({ kind: 'sdp', sdp: pc.localDescription.toJSON() });
            }
          }
        } else if (data.kind === 'ice' && data.candidate) {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (err) {
            if (!ignoreOfferRef.current) throw err;
          }
        }
      } catch (err) {
        console.error('[Call] Signal handling error:', err);
      }
    },
    [sendSignal]
  );

  // Применить сигналы, накопившиеся до создания RTCPeerConnection
  const flushPendingSignals = useCallback(() => {
    const queue = pendingSignalsRef.current;
    pendingSignalsRef.current = [];
    for (const data of queue) {
      const current = callRef.current;
      if (current) handleSignal(current.id, data);
    }
  }, [handleSignal]);

  // === WebSocket: подключение и управляющие события ===
  const connectWs = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !mountedRef.current) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/api/calls/ws?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[CallsWS] Connected');
    };

    ws.onmessage = (event) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      const current = callRef.current;
      switch (msg.type) {
        case 'incoming_call': {
          // Уже в звонке — автоматически отклоняем новый
          if (phaseRef.current !== 'idle') {
            api.calls.reject(msg.call.id).catch(() => {});
            return;
          }
          setCall(msg.call);
          setPeer(msg.from);
          setIsCaller(false);
          setPhase('incoming');
          startRingtone('incoming');
          break;
        }
        case 'call_accepted': {
          if (!current || current.id !== msg.callId || !isCallerRef.current) return;
          stopRingtone();
          setCall(msg.call || current);
          setupMedia(false).then(flushPendingSignals);
          break;
        }
        case 'call_rejected': {
          if (!current || current.id !== msg.callId) return;
          resetToIdle();
          showInfo(msg.reason === 'busy' ? 'Пользователь занят другим звонком' : 'Звонок отклонён');
          break;
        }
        case 'call_cancelled': {
          if (!current || current.id !== msg.callId) return;
          resetToIdle();
          break;
        }
        case 'call_missed': {
          if (!current || current.id !== msg.callId) return;
          resetToIdle();
          showInfo('Абонент не ответил');
          break;
        }
        case 'call_ended': {
          if (!current || current.id !== msg.callId) return;
          resetToIdle();
          break;
        }
        case 'signal': {
          handleSignal(msg.callId, msg.data);
          break;
        }
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      wsRef.current = null;
      // Переподключение с нарастающей задержкой; во время звонка reconnect
      // должен успеть быстро — сервер хранит звонок в БД, состояние
      // восстановим через /api/calls/active ниже
      reconnectTimerRef.current = setTimeout(connectWs, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [setupMedia, flushPendingSignals, handleSignal, resetToIdle]);

  useEffect(() => {
    mountedRef.current = true;
    connectWs();

    // Восстановление состояния после перезагрузки страницы / открытия CRM
    // по клику из push-уведомления (?call=<id> — автопринятие входящего)
    const params = new URLSearchParams(window.location.search);
    const pushCallId = params.get('call');
    const pushReject = params.get('reject');
    if (pushCallId || pushReject) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    api.calls
      .active()
      .then(async (active) => {
        if (!mountedRef.current || !active) return;
        const { call: activeCall, role } = active;
        if (activeCall.status === 'ringing' && role === 'caller') {
          // Мы звонили и страницу перезагрузили — продолжаем ждать ответа
          setCall(activeCall);
          setPeer(role === 'caller' ? activeCall.callee! : activeCall.caller!);
          setIsCaller(true);
          setPhase('outgoing');
          startRingtone('outgoing');
        } else if (activeCall.status === 'ringing' && role === 'callee') {
          if (pushReject) {
            api.calls.reject(activeCall.id).catch(() => {});
            return;
          }
          setCall(activeCall);
          setPeer(activeCall.caller!);
          setIsCaller(false);
          if (pushCallId === activeCall.id || !pushCallId) {
            // Обычное входящее — ждём клика «Принять»; пришли из push —
            // принимаем автоматически
            if (pushCallId === activeCall.id) {
              await api.calls.accept(activeCall.id).catch(() => {});
              setupMedia(true).then(flushPendingSignals);
            } else {
              setPhase('incoming');
              startRingtone('incoming');
            }
          }
        } else if (activeCall.status === 'ongoing') {
          // Перезагрузка во время разговора: пересоздаём P2P-канал.
          // Оффер создаёт ответившая сторона (callee), звонящий ждёт оффер
          setCall(activeCall);
          setPeer(role === 'caller' ? activeCall.callee! : activeCall.caller!);
          setIsCaller(role === 'caller');
          await setupMedia(role === 'callee');
          flushPendingSignals();
        }
      })
      .catch(() => {});

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      cleanupMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Публичные действия ===
  const startCall = useCallback(
    async (target: CallPeer, type: 'audio' | 'video') => {
      if (phaseRef.current !== 'idle') {
        showInfo('Вы уже участвуете в звонке');
        return;
      }
      try {
        const created = await api.calls.initiate(target.id, type);
        if (!mountedRef.current) return;
        setCall(created);
        setPeer(target);
        setIsCaller(true);
        setPhase('outgoing');
        startRingtone('outgoing');
      } catch (err: any) {
        showInfo(err.message || 'Не удалось начать звонок');
      }
    },
    []
  );

  const accept = useCallback(async () => {
    const current = callRef.current;
    if (!current || phaseRef.current !== 'incoming') return;
    stopRingtone();
    try {
      await api.calls.accept(current.id);
      await setupMedia(true);
      flushPendingSignals();
    } catch (err: any) {
      resetToIdle();
      showInfo(err.message || 'Звонок уже завершён');
    }
  }, [setupMedia, flushPendingSignals, resetToIdle]);

  const reject = useCallback(() => {
    const current = callRef.current;
    stopRingtone();
    if (current) api.calls.reject(current.id).catch(() => {});
    resetToIdle();
  }, [resetToIdle]);

  const end = useCallback(() => {
    const current = callRef.current;
    const currentPhase = phaseRef.current;
    stopRingtone();
    if (current) {
      if (currentPhase === 'outgoing') api.calls.cancel(current.id).catch(() => {});
      else if (currentPhase === 'incoming') api.calls.reject(current.id).catch(() => {});
      else api.calls.end(current.id).catch(() => {});
    }
    resetToIdle();
  }, [resetToIdle]);

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }, [muted]);

  const toggleVideo = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !videoOff;
    stream.getVideoTracks().forEach((t) => (t.enabled = !next));
    setVideoOff(next);
  }, [videoOff]);

  const value: CallContextValue = {
    phase, call, peer, isCaller, muted, videoOff,
    localStream, remoteStream, duration, info,
    startCall, accept, reject, end, toggleMute, toggleVideo,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}
